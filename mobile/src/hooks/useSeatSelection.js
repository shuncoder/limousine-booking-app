import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTripSeats, holdSeat, releaseSeat } from '../services/api';

/**
 * Multi-seat selection hook.
 *
 * Keeps track of an array of `selectedSeatIds` (in tap order) and enforces an
 * upper bound of `requiredCount` (typically the passenger count chosen on the
 * previous screen). All seat-hold / seat-release I/O lives here so the screen
 * remains pure presentation.
 */
export default function useSeatSelection({
  tripId,
  trip,
  requiredCount = 1,
}) {
  const resolvedTripId = trip?._id || tripId;
  const safeRequiredCount = Math.max(1, Number(requiredCount) || 1);

  const [loading, setLoading] = useState(true);
  const [seatLayout, setSeatLayout] = useState(null);
  const [seats, setSeats] = useState({});
  const [error, setError] = useState('');
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [busySeatId, setBusySeatId] = useState('');
  const [holdMessage, setHoldMessage] = useState('');

  useEffect(() => {
    if (!resolvedTripId) {
      setError('Không tìm thấy chuyến xe.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getTripSeats(resolvedTripId)
      .then((data) => {
        if (cancelled) return;
        setSeatLayout(data.layout || data.seatLayout || {});
        setSeats(data.seats || {});
        setError('');
      })
      .catch(() => {
        if (cancelled) return;
        setError('Không tải được thông tin ghế.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resolvedTripId]);

  const isSeatSelected = useCallback(
    (seatId) => selectedSeatIds.includes(String(seatId)),
    [selectedSeatIds]
  );

  const toggleSeat = useCallback(
    async (seatId, seat) => {
      const id = String(seatId);
      if (!resolvedTripId) return;

      setHoldMessage('');

      // Already selected by me → release
      if (isSeatSelected(id)) {
        setBusySeatId(id);
        try {
          await releaseSeat(resolvedTripId, id);
          setSelectedSeatIds((prev) => prev.filter((s) => s !== id));
          setSeats((prev) => ({
            ...prev,
            [id]: { status: 'available' },
          }));
        } catch (err) {
          setHoldMessage(
            err?.response?.data?.msg || 'Không thể bỏ chọn ghế, thử lại.'
          );
        } finally {
          setBusySeatId('');
        }
        return;
      }

      // Not selected → enforce capacity
      if (selectedSeatIds.length >= safeRequiredCount) {
        setHoldMessage(
          `Bạn chỉ chọn được ${safeRequiredCount} ghế. Bỏ bớt một ghế trước khi chọn ghế khác.`
        );
        return;
      }

      if (seat?.status && seat.status !== 'available' && !seat.heldByMe) {
        return;
      }

      setBusySeatId(id);
      try {
        await holdSeat(resolvedTripId, id, 5);
        setSelectedSeatIds((prev) => [...prev, id]);
        setSeats((prev) => ({
          ...prev,
          [id]: { status: 'held', heldByMe: true },
        }));
      } catch (err) {
        setHoldMessage(
          err?.response?.data?.msg || 'Không giữ được ghế, vui lòng thử lại.'
        );
      } finally {
        setBusySeatId('');
      }
    },
    [resolvedTripId, isSeatSelected, selectedSeatIds.length, safeRequiredCount]
  );

  const reset = useCallback(() => {
    setSelectedSeatIds([]);
    setHoldMessage('');
  }, []);

  const isComplete = useMemo(
    () => selectedSeatIds.length === safeRequiredCount,
    [selectedSeatIds.length, safeRequiredCount]
  );

  return {
    loading,
    seatLayout,
    seats,
    error,
    selectedSeatIds,
    busySeatId,
    holdMessage,
    requiredCount: safeRequiredCount,
    isComplete,
    toggleSeat,
    reset,
  };
}
