import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import { colors, spacing } from '../theme/theme';
import { payTicket } from '../services/api';
import { createTripSocket } from '../services/socket';
import QRCode from 'react-native-qrcode-svg';
import {
  formatCurrency,
  formatDateTime,
  formatPointLabel,
} from '../utils/bookingFormatters';
import usePaymentCountdown from '../hooks/usePaymentCountdown';

export default function PaymentScreen({ navigation, route }) {
  const trip = route?.params?.trip;
  const tickets = Array.isArray(route?.params?.tickets) ? route.params.tickets : [];
  const passengers = Number(route?.params?.passengers || tickets.length || 1);
  const selectedSeatIds = Array.isArray(route?.params?.selectedSeatIds)
    ? route.params.selectedSeatIds
    : tickets.map((item) => String(item?.seatId || '')).filter(Boolean);

  const pickupPoint = route?.params?.pickupPoint;
  const dropoffPoint = route?.params?.dropoffPoint;
  const travelDate = route?.params?.travelDate || '';
  const summary = route?.params?.summary || null;
  const totalAmount = Number(
    summary?.totalAmount ?? route?.params?.totalAmount ?? 0
  );
  const currency = summary?.currency || tickets[0]?.currency || trip?.currency || 'VND';

  const expiresAtList = useMemo(
    () => tickets.map((t) => t?.expiresAt).filter(Boolean),
    [tickets]
  );
  const { leftSeconds, formatted: countdown, expired, setLeftSeconds } =
    usePaymentCountdown(expiresAtList);

  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    if (!trip?._id) return undefined;
    let cancelled = false;

    (async () => {
      const socket = await createTripSocket();
      if (cancelled) {
        socket.disconnect();
        return;
      }

      socketRef.current = socket;
      socket.emit('join_trip', { tripId: trip._id });
      socket.on('seat_update', (payload) => {
        if (String(payload?.tripId) !== String(trip._id)) return;
        if (!selectedSeatIds.includes(String(payload?.seatId || ''))) return;

        if (payload?.status === 'available' && !paid) {
          setMessage('Đã hết thời gian giữ ghế hoặc ghế đã được giải phóng.');
          setLeftSeconds(0);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.emit('leave_trip', { tripId: trip._id });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paid, selectedSeatIds, trip?._id]);

  const qrValue = useMemo(() => {
    const ticketIds = tickets
      .map((item) => item?._id)
      .filter(Boolean)
      .join(',');
    return `PAY|trip=${trip?._id || ''}|tickets=${ticketIds}|amount=${totalAmount}|currency=${currency}`;
  }, [currency, tickets, totalAmount, trip?._id]);

  const expectedMinutes = useMemo(
    () => Math.max(1, Math.ceil(leftSeconds / 60) || 15),
    [leftSeconds]
  );

  const handleConfirmPaid = async () => {
    setPaying(true);
    setMessage('');

    try {
      const ticketIds = tickets.map((t) => t?._id).filter(Boolean);
      const responses = await Promise.all(
        ticketIds.map((ticketId) => payTicket(ticketId))
      );

      setPaid(true);
      setMessage('Thanh toán thành công!');

      const firstWithRoute = responses.find((r) => r?.routePlan);
      const firstTicketId = ticketIds[0];

      setTimeout(() => {
        navigation.replace('RouteVisualization', {
          routePlan: firstWithRoute?.routePlan || null,
          ticketId: firstTicketId,
        });
      }, 600);
    } catch (error) {
      setMessage(
        error?.response?.data?.msg || 'Thanh toán thất bại hoặc vé đã hết hạn.'
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <AppBackground>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Thanh toán</Text>
          <Text style={styles.step}>
            Bước 3/3 • Hoàn tất trong khoảng {expectedMinutes} phút
          </Text>

          <View style={styles.detailBox}>
            <Text style={styles.detailText}>
              Tuyến: {trip?.routeFrom} → {trip?.routeTo}
            </Text>
            <Text style={styles.detailText}>Ngày đi: {travelDate}</Text>
            <Text style={styles.detailText}>
              Giờ khởi hành: {formatDateTime(trip?.departureAt)}
            </Text>
            <Text style={styles.detailText}>
              Nơi đón: {formatPointLabel(pickupPoint, trip?.routeFrom)}
            </Text>
            <Text style={styles.detailText}>
              Nơi trả: {formatPointLabel(dropoffPoint, trip?.routeTo)}
            </Text>
            <Text style={styles.detailText}>Số khách: {passengers}</Text>
            <Text style={styles.detailText}>
              Ghế: {selectedSeatIds.join(', ')}
            </Text>
            {summary?.discountAmount > 0 ? (
              <Text style={styles.detailText}>
                Giảm giá: -{formatCurrency(summary.discountAmount, currency)}
                {summary.promoCode ? ` (${summary.promoCode})` : ''}
              </Text>
            ) : null}
            <Text style={styles.total}>
              Tổng tiền: {formatCurrency(totalAmount, currency)}
            </Text>
          </View>

          <Text
            style={[styles.countdown, expired ? styles.countdownExpired : null]}
          >
            {expired
              ? 'Hết thời gian thanh toán'
              : `Thời gian còn lại: ${countdown}`}
          </Text>

          <View style={styles.qrWrap}>
            <View style={styles.qrBox}>
              <QRCode value={qrValue} size={240} />
            </View>
          </View>

          <PrimaryButton
            title={paid ? 'Đã thanh toán' : 'Tôi đã thanh toán'}
            onPress={handleConfirmPaid}
            loading={paying}
            disabled={paid || expired || paying}
          />

          <PrimaryButton
            title="Về trang chủ"
            onPress={() => navigation.navigate('Main')}
            variant="success"
          />

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </GlassCard>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing.xxl },
  card: { maxWidth: 620, width: '100%', alignSelf: 'center', gap: spacing.md },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  step: { color: colors.muted, fontWeight: '700' },
  detailBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: spacing.xs,
  },
  detailText: { color: colors.text, fontWeight: '700' },
  total: { color: colors.brand, fontSize: 18, fontWeight: '900', marginTop: spacing.sm },
  countdown: { color: '#FCD34D', fontWeight: '900', fontSize: 16, textAlign: 'center' },
  countdownExpired: { color: colors.danger },
  qrWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  qrBox: {
    width: 260,
    height: 260,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { color: '#FECACA', fontWeight: '700', textAlign: 'center' },
});
