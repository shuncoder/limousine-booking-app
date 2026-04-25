import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import { colors, spacing } from '../theme/theme';
import { payTicket } from '../services/api';
import { createTripSocket } from '../services/socket';

function formatCurrency(value, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('vi-VN');
}

function secondsLeft(expireAt) {
  if (!expireAt) return 0;
  const now = Date.now();
  const target = new Date(expireAt).getTime();
  return Math.max(0, Math.floor((target - now) / 1000));
}

function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function PaymentScreen({ navigation, route }) {
  const trip = route?.params?.trip;
  const tickets = Array.isArray(route?.params?.tickets) ? route.params.tickets : [];
  const passengers = Number(route?.params?.passengers || tickets.length || 1);
  const selectedSeatIds = Array.isArray(route?.params?.selectedSeatIds)
    ? route.params.selectedSeatIds
    : tickets.map((item) => String(item?.seatId || '')).filter(Boolean);

  const pickupPoint = route?.params?.pickupPoint || trip?.routeFrom;
  const travelDate = route?.params?.travelDate || '';
  const totalAmount = Number(route?.params?.totalAmount || 0);
  const currency = tickets[0]?.currency || trip?.currency || 'VND';

  const [leftSeconds, setLeftSeconds] = useState(() => {
    const minExpireAt = tickets
      .map((item) => item?.expiresAt)
      .filter(Boolean)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
    return secondsLeft(minExpireAt);
  });
  const [message, setMessage] = useState('');
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const socketRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLeftSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!trip?._id) return undefined;

    const socket = createTripSocket();
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

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_trip', { tripId: trip._id });
        socketRef.current.disconnect();
      }
    };
  }, [paid, selectedSeatIds, trip?._id]);

  const qrValue = useMemo(() => {
    const ticketIds = tickets.map((item) => item?._id).filter(Boolean).join(',');
    return `PAY|trip=${trip?._id || ''}|tickets=${ticketIds}|amount=${totalAmount}|currency=${currency}`;
  }, [currency, tickets, totalAmount, trip?._id]);

  const qrUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrValue)}`,
    [qrValue]
  );

  const handleConfirmPaid = async () => {
    setPaying(true);
    setMessage('');

    try {
      for (const ticket of tickets) {
        if (!ticket?._id) continue;
        // eslint-disable-next-line no-await-in-loop
        await payTicket(ticket._id);
      }
      setPaid(true);
      setMessage('Thanh toán thành công!');
    } catch (error) {
      setMessage(error?.response?.data?.msg || 'Thanh toán thất bại hoặc vé đã hết hạn.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <AppBackground>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Thanh toán</Text>
          <Text style={styles.step}>Bước 3/3 • Hoàn tất trong 15 phút</Text>

          <View style={styles.detailBox}>
            <Text style={styles.detailText}>Tuyến: {trip?.routeFrom} → {trip?.routeTo}</Text>
            <Text style={styles.detailText}>Ngày đi: {travelDate}</Text>
            <Text style={styles.detailText}>Giờ khởi hành: {formatDateTime(trip?.departureAt)}</Text>
            <Text style={styles.detailText}>Nơi đón: {pickupPoint}</Text>
            <Text style={styles.detailText}>Nơi trả: {trip?.routeTo}</Text>
            <Text style={styles.detailText}>Số khách: {passengers}</Text>
            <Text style={styles.detailText}>Ghế: {selectedSeatIds.join(', ')}</Text>
            <Text style={styles.total}>Tổng tiền: {formatCurrency(totalAmount, currency)}</Text>
          </View>

          <Text style={[styles.countdown, leftSeconds === 0 ? styles.countdownExpired : null]}>
            {leftSeconds > 0 ? `Thời gian còn lại: ${formatCountdown(leftSeconds)}` : 'Hết thời gian thanh toán'}
          </Text>

          <View style={styles.qrWrap}>
            <Image source={{ uri: qrUrl }} style={styles.qr} resizeMode="contain" />
          </View>

          <PrimaryButton
            title={paid ? 'Đã thanh toán' : 'Tôi đã thanh toán'}
            onPress={handleConfirmPaid}
            loading={paying}
            disabled={paid || leftSeconds === 0 || paying}
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
  qr: {
    width: 260,
    height: 260,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: spacing.sm,
  },
  message: { color: '#FECACA', fontWeight: '700', textAlign: 'center' },
});
