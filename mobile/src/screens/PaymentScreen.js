import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import { colors, spacing } from '../theme/theme';
import {
  formatCurrency,
  formatDateTime,
  formatPointLabel,
} from '../utils/bookingFormatters';
import useTicketPayment from '../hooks/useTicketPayment';

export default function PaymentScreen({ navigation, route }) {
  const trip = route?.params?.trip;
  const tickets = Array.isArray(route?.params?.tickets) ? route.params.tickets : [];
  const pickupPoint = route?.params?.pickupPoint;
  const dropoffPoint = route?.params?.dropoffPoint;
  const travelDate = route?.params?.travelDate || '';
  const summary = route?.params?.summary || null;

  const {
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
  } = useTicketPayment({
    trip,
    tickets,
    passengersFromParams: route?.params?.passengers,
    selectedSeatIdsFromParams: route?.params?.selectedSeatIds,
    summary,
    totalAmountFromParams: route?.params?.totalAmount,
    onPaid: ({ routePlan, ticketId }) => {
      navigation.replace('RouteVisualization', { routePlan, ticketId });
    },
  });

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
            onPress={confirmPaid}
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
