import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import TextField from '../components/ui/TextField';
import PrimaryButton from '../components/ui/PrimaryButton';
import SeatMap from '../components/SeatMap';
import { colors, spacing } from '../theme/theme';
import {
  createTicket,
  getTripPricePreview,
  getTripSeats,
  holdSeat,
  releaseSeat,
} from '../services/api';
import { createTripSocket } from '../services/socket';

const SEAT_HOLD_DURATION_MINUTES = 5;

function formatCurrency(value, currency = 'VND') {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function SeatSelectionScreen({ navigation, route }) {
  const trip = route?.params?.trip;
  const passengers = Math.max(1, Number(route?.params?.passengers || 1));
  const pickupPoint = route?.params?.pickupPoint || trip?.routeFrom;
  const travelDate = route?.params?.travelDate || '';

  const [seatLayout, setSeatLayout] = useState({ rows: [] });
  const [seats, setSeats] = useState({});
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [voucherCode, setVoucherCode] = useState('');
  const [previewPrice, setPreviewPrice] = useState(null);
  const [finalTotal, setFinalTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const socketRef = useRef(null);
  const selectedSeatIdsRef = useRef([]);
  const skipReleaseOnUnmountRef = useRef(false);

  const selectedCount = selectedSeatIds.length;
  const enoughSeats = selectedCount === passengers;
  const canSelectMore = selectedCount < passengers;

  const loadSeats = useCallback(async () => {
    if (!trip?._id) return;

    setLoading(true);
    try {
      const payload = await getTripSeats(trip._id);
      setSeatLayout(payload?.seatLayout || { rows: [] });
      setSeats(payload?.seats || {});
    } catch {
      setMessage('Không tải được sơ đồ ghế.');
    } finally {
      setLoading(false);
    }
  }, [trip?._id]);

  useEffect(() => {
    loadSeats();
  }, [loadSeats]);

  useEffect(() => {
    if (!trip?._id) return undefined;

    const socket = createTripSocket();
    socketRef.current = socket;

    socket.emit('join_trip', { tripId: trip._id });

    socket.on('seat_update', (payload) => {
      if (String(payload?.tripId) !== String(trip._id) || !payload?.seatId) return;

      setSeats((prev) => ({
        ...prev,
        [payload.seatId]: {
          ...(prev?.[payload.seatId] || {}),
          status: payload.status || 'available',
          heldByMe: false,
          expiresAt: payload.expiresAt || null,
        },
      }));

      if (payload.status === 'available') {
        setSelectedSeatIds((prev) => prev.filter((id) => id !== payload.seatId));
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_trip', { tripId: trip._id });
        socketRef.current.disconnect();
      }
    };
  }, [trip?._id]);

  useEffect(() => {
    if (!trip?._id) return undefined;

    return () => {
      if (skipReleaseOnUnmountRef.current) return;
      selectedSeatIdsRef.current.forEach((seatId) => {
        releaseSeat(trip._id, seatId).catch((error) => {
          // eslint-disable-next-line no-console
          console.warn('Release seat failed on unmount:', error?.response?.data?.msg || error?.message || error);
        });
      });
    };
  }, [trip?._id]);

  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeatIds;
  }, [selectedSeatIds]);

  const estimatedTotal = useMemo(() => {
    if (!previewPrice || !enoughSeats) return null;
    return Number(previewPrice.price || 0) * passengers;
  }, [previewPrice, enoughSeats, passengers]);

  const handleSeatPress = async (seatId, seat) => {
    setMessage('');

    const selected = selectedSeatIds.includes(seatId);

    if (selected) {
      try {
        await releaseSeat(trip._id, seatId);
        setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
        setSeats((prev) => ({
          ...prev,
          [seatId]: { status: 'available' },
        }));
      } catch {
        setMessage('Không thể nhả ghế.');
      }
      return;
    }

    if (!canSelectMore) {
      setMessage(`Bạn cần chọn đúng ${passengers} ghế.`);
      return;
    }

    if (seat?.status && seat.status !== 'available' && !seat?.heldByMe) {
      setMessage('Ghế này đã có người đặt/giữ.');
      return;
    }

    try {
      const hold = await holdSeat(trip._id, seatId, SEAT_HOLD_DURATION_MINUTES);
      setSelectedSeatIds((prev) => [...prev, seatId]);
      setSeats((prev) => ({
        ...prev,
        [seatId]: {
          status: 'held',
          heldByMe: true,
          expiresAt: hold?.expiresAt || null,
        },
      }));
    } catch (error) {
      setMessage(error?.response?.data?.msg || 'Giữ ghế thất bại.');
      loadSeats();
    }
  };

  const handlePreviewPrice = async () => {
    if (!enoughSeats) {
      setMessage(`Bạn phải chọn đủ ${passengers} ghế trước khi hiện giá.`);
      return;
    }

    setMessage('');
    try {
      const price = await getTripPricePreview(trip._id);
      setPreviewPrice(price);
      setFinalTotal(Number(price?.price || 0) * passengers);
    } catch {
      setMessage('Không lấy được giá vé hiện tại.');
    }
  };

  const handleContinuePayment = async () => {
    if (!enoughSeats) {
      setMessage(`Bạn phải chọn đủ ${passengers} ghế.`);
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const createdTickets = await Promise.all(
        selectedSeatIds.map((seatId) => createTicket(trip._id, seatId, voucherCode.trim() || undefined))
      );

      const total = createdTickets.reduce((sum, item) => sum + Number(item?.totalAmount || 0), 0);
      skipReleaseOnUnmountRef.current = true;

      navigation.navigate('Payment', {
        trip,
        passengers,
        pickupPoint,
        travelDate,
        tickets: createdTickets,
        selectedSeatIds,
        voucherCode: voucherCode.trim(),
        totalAmount: total,
      });
    } catch (error) {
      setMessage(error?.response?.data?.msg || 'Không tạo được vé tạm giữ để thanh toán.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppBackground>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Chọn ghế</Text>
          <Text style={styles.subtitle}>{trip?.routeFrom} → {trip?.routeTo}</Text>
          <Text style={styles.meta}>Điểm đón: {pickupPoint}</Text>
          <Text style={styles.meta}>Ngày đi: {travelDate}</Text>
          <Text style={styles.meta}>Số khách: {passengers}</Text>

          {loading ? <Text style={styles.loading}>Đang tải sơ đồ ghế...</Text> : null}

          {!loading ? (
            <SeatMap
              seatLayout={seatLayout}
              seats={seats}
              selectedSeatIds={selectedSeatIds}
              onPressSeat={handleSeatPress}
            />
          ) : null}

          <Text style={styles.helper}>Đã chọn {selectedCount}/{passengers} ghế</Text>

          <PrimaryButton
            title="Hiển thị giá"
            onPress={handlePreviewPrice}
            disabled={!enoughSeats}
          />

          {previewPrice ? (
            <View style={styles.priceBox}>
              <Text style={styles.priceLabel}>Giá 1 ghế: {formatCurrency(previewPrice.price, previewPrice.currency)}</Text>
              <Text style={styles.priceLabel}>Tổng tạm tính: {formatCurrency(estimatedTotal, previewPrice.currency)}</Text>
            </View>
          ) : null}

          <TextField
            label="Voucher"
            placeholder="Nhập mã voucher (nếu có)"
            value={voucherCode}
            onChangeText={setVoucherCode}
            returnKeyType="done"
          />

          {finalTotal != null ? (
            <Text style={styles.totalText}>Tổng giá dự kiến: {formatCurrency(finalTotal, trip?.currency || 'VND')}</Text>
          ) : null}

          <PrimaryButton
            title="Tiếp tục thanh toán"
            onPress={handleContinuePayment}
            loading={submitting}
            disabled={!enoughSeats || submitting}
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
  card: { maxWidth: 620, width: '100%', alignSelf: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  subtitle: { color: colors.text, fontWeight: '800', marginTop: spacing.xs, marginBottom: spacing.sm },
  meta: { color: colors.muted, marginBottom: spacing.xs, fontWeight: '600' },
  loading: { color: colors.muted, marginTop: spacing.md, marginBottom: spacing.md },
  helper: { color: colors.text, marginTop: spacing.md, marginBottom: spacing.md, fontWeight: '700' },
  priceBox: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 14,
    padding: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: spacing.xs,
  },
  priceLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  totalText: {
    color: colors.brand,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: spacing.md,
  },
  message: {
    marginTop: spacing.sm,
    color: '#FECACA',
    fontWeight: '700',
  },
});
