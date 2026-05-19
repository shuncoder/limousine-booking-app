import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { payTicket } from '../services/api';
import { createTripSocket } from '../services/socket';
import usePaymentCountdown from './usePaymentCountdown';

/**
 * End-to-end logic for the payment screen:
 *   - derives selected seats / total amount / currency from the booked
 *     tickets (so the screen doesn't have to reach into route params).
 *   - countdown for the pending-tickets window.
 *   - subscribes to seat_update events so we can warn the user when one of
 *     their held seats gets released by the backend.
 *   - confirm-paid action that calls payTicket() for every ticket.
 *
 * Returns everything the screen needs, plus a `qrValue` ready to feed into
 * <QRCode>.
 */
export default function useTicketPayment({
  trip,
  tickets,
  passengersFromParams,
  selectedSeatIdsFromParams,
  summary,
  totalAmountFromParams,
  onPaid,
}) {
  const tripId = trip?._id || null;

  const ticketList = Array.isArray(tickets) ? tickets : [];

  const selectedSeatIds = useMemo(() => {
    if (Array.isArray(selectedSeatIdsFromParams) && selectedSeatIdsFromParams.length) {
      return selectedSeatIdsFromParams;
    }
    return ticketList
      .map((item) => String(item?.seatId || ''))
      .filter(Boolean);
  }, [selectedSeatIdsFromParams, ticketList]);

  const passengers = Number(
    passengersFromParams || ticketList.length || 1
  );

  const totalAmount = Number(
    summary?.totalAmount ?? totalAmountFromParams ?? 0
  );
  const currency =
    summary?.currency || ticketList[0]?.currency || trip?.currency || 'VND';

  const expiresAtList = useMemo(
    () => ticketList.map((t) => t?.expiresAt).filter(Boolean),
    [ticketList]
  );

  const { leftSeconds, formatted: countdown, expired, setLeftSeconds } =
    usePaymentCountdown(expiresAtList);

  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!tripId) return undefined;
    let cancelled = false;

    const handleSeatUpdate = (payload) => {
      if (String(payload?.tripId) !== String(tripId)) return;
      if (!selectedSeatIds.includes(String(payload?.seatId || ''))) return;
      if (payload?.status === 'available' && !paid) {
        setMessage('Đã hết thời gian giữ ghế hoặc ghế đã được giải phóng.');
        setLeftSeconds(0);
      }
    };

    (async () => {
      const socket = await createTripSocket();
      if (cancelled) {
        socket.disconnect();
        return;
      }
      socketRef.current = socket;
      socket.emit('join_trip', { tripId });
      socket.on('seat_update', handleSeatUpdate);
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.emit('leave_trip', { tripId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [tripId, selectedSeatIds, paid, setLeftSeconds]);

  const qrValue = useMemo(() => {
    const ticketIds = ticketList
      .map((item) => item?._id)
      .filter(Boolean)
      .join(',');
    return `PAY|trip=${tripId || ''}|tickets=${ticketIds}|amount=${totalAmount}|currency=${currency}`;
  }, [ticketList, tripId, totalAmount, currency]);

  const expectedMinutes = useMemo(
    () => Math.max(1, Math.ceil(leftSeconds / 60) || 15),
    [leftSeconds]
  );

  const confirmPaid = useCallback(async () => {
    setPaying(true);
    setMessage('');
    try {
      const ticketIds = ticketList.map((t) => t?._id).filter(Boolean);
      const responses = await Promise.all(
        ticketIds.map((ticketId) => payTicket(ticketId))
      );

      setPaid(true);
      setMessage('Thanh toán thành công!');

      if (typeof onPaid === 'function') {
        const firstWithRoute = responses.find((r) => r?.routePlan);
        const firstTicketId = ticketIds[0];
        // Defer slightly so the success message paints before navigation.
        setTimeout(() => {
          onPaid({
            routePlan: firstWithRoute?.routePlan || null,
            ticketId: firstTicketId,
            responses,
          });
        }, 600);
      }
    } catch (error) {
      setMessage(
        error?.response?.data?.msg || 'Thanh toán thất bại hoặc vé đã hết hạn.'
      );
    } finally {
      setPaying(false);
    }
  }, [ticketList, onPaid]);

  return {
    selectedSeatIds,
    passengers,
    totalAmount,
    currency,
    qrValue,
    countdown,
    expired,
    expectedMinutes,
    paying,
    paid,
    message,
    confirmPaid,
  };
}
