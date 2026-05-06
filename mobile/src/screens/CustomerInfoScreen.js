import React from 'react';
import { Text, StyleSheet, ScrollView, View } from 'react-native';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import TextField from '../components/ui/TextField';
import Dropdown from '../components/ui/Dropdown';
import PrimaryButton from '../components/ui/PrimaryButton';
import { colors, spacing } from '../theme/theme';
import useCustomerBookingForm from '../hooks/useCustomerBookingForm';
import useTripQuote from '../hooks/useTripQuote';
import { formatCurrency, formatPointLabel } from '../utils/bookingFormatters';

export default function CustomerInfoScreen({ navigation, route }) {
  const trip = route?.params?.trip;
  const tripId = route?.params?.tripId || trip?._id;
  const seatIds = Array.isArray(route?.params?.seatIds)
    ? route.params.seatIds
    : route?.params?.seatId
      ? [route.params.seatId]
      : [];
  const passengers = Number(route?.params?.passengers) || seatIds.length || 1;
  const travelDate = route?.params?.travelDate || '';

  const form = useCustomerBookingForm({
    trip,
    tripId,
    seatIds,
    expectedSeatCount: passengers,
  });

  const { quote, loading: quoteLoading, error: quoteError } = useTripQuote({
    tripId,
    seatCount: seatIds.length,
    promoCode: form.promoCode,
  });

  const [pickupAreaOpen, setPickupAreaOpen] = React.useState(false);
  const [dropoffAreaOpen, setDropoffAreaOpen] = React.useState(false);
  const [pickupPointOpen, setPickupPointOpen] = React.useState(false);
  const [dropoffPointOpen, setDropoffPointOpen] = React.useState(false);

  const pickupPointOptions = form.pickupPoints.map((point) => ({
    label: formatPointLabel(point),
    value: point,
  }));
  const dropoffPointOptions = form.dropoffPoints.map((point) => ({
    label: formatPointLabel(point),
    value: point,
  }));

  const handleSubmit = async () => {
    const result = await form.submit();
    if (!result) return;

    navigation.navigate('Payment', {
      trip,
      tickets: result.tickets,
      passengers,
      travelDate,
      pickupPoint: form.pickupPoint,
      dropoffPoint: form.dropoffPoint,
      totalAmount: result.summary?.totalAmount || 0,
      selectedSeatIds: seatIds,
      summary: result.summary,
    });
  };

  return (
    <AppBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Thông tin khách hàng</Text>
          <Text style={styles.subtitle}>
            {trip?.routeFrom} → {trip?.routeTo}
          </Text>
          {travelDate ? (
            <Text style={styles.subtle}>Ngày đi: {travelDate}</Text>
          ) : null}
          <Text style={styles.subtle}>
            Ghế đã chọn ({seatIds.length}): {seatIds.join(', ') || '--'}
          </Text>

          <TextField
            label="Họ và tên"
            placeholder="Ví dụ: Nguyễn Văn A"
            value={form.name}
            onChangeText={form.setName}
            autoCapitalize="words"
          />
          <TextField
            label="Số điện thoại"
            placeholder="Ví dụ: 0901234567"
            value={form.phone}
            onChangeText={form.setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Dropdown
            label="Khu vực đón"
            value={form.pickupAreaLabel || form.pickupAreaId}
            options={form.pickupAreaOptions}
            open={pickupAreaOpen}
            setOpen={setPickupAreaOpen}
            onSelect={form.setPickupAreaId}
          />
          <Dropdown
            label="Điểm đón chi tiết"
            value={formatPointLabel(form.pickupPoint, '')}
            options={pickupPointOptions}
            open={pickupPointOpen}
            setOpen={setPickupPointOpen}
            onSelect={form.setPickupPoint}
          />

          <Dropdown
            label="Khu vực trả"
            value={form.dropoffAreaLabel || form.dropoffAreaId}
            options={form.dropoffAreaOptions}
            open={dropoffAreaOpen}
            setOpen={setDropoffAreaOpen}
            onSelect={form.setDropoffAreaId}
          />
          <Dropdown
            label="Điểm trả chi tiết"
            value={formatPointLabel(form.dropoffPoint, '')}
            options={dropoffPointOptions}
            open={dropoffPointOpen}
            setOpen={setDropoffPointOpen}
            onSelect={form.setDropoffPoint}
          />

          <TextField
            label="Mã voucher (nếu có)"
            placeholder="VD: LIMOEVENT"
            value={form.promoCode}
            onChangeText={form.setPromoCode}
            autoCapitalize="characters"
          />

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Báo giá</Text>
            {quoteLoading ? (
              <Text style={styles.summaryRow}>Đang tính...</Text>
            ) : quote ? (
              <>
                <Text style={styles.summaryRow}>
                  {quote.seatCount} × {formatCurrency(quote.pricePerSeat, quote.currency)}
                  {' = '}
                  {formatCurrency(quote.subTotal, quote.currency)}
                </Text>
                {quote.discountAmount > 0 ? (
                  <Text style={styles.summaryRow}>
                    Giảm giá:{' '}
                    -{formatCurrency(quote.discountAmount, quote.currency)}
                    {quote.promo?.code ? ` (${quote.promo.code})` : ''}
                  </Text>
                ) : null}
                <Text style={styles.summaryTotal}>
                  Tổng: {formatCurrency(quote.totalAmount, quote.currency)}
                </Text>
              </>
            ) : (
              <Text style={styles.summaryRow}>--</Text>
            )}
            {quoteError ? (
              <Text style={styles.errorText}>{quoteError}</Text>
            ) : null}
          </View>

          {form.errorMessage ? (
            <Text style={styles.errorText}>{form.errorMessage}</Text>
          ) : null}

          <PrimaryButton
            title="Xác nhận thông tin"
            onPress={handleSubmit}
            loading={form.submitting}
            disabled={form.submitting}
          />
        </GlassCard>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.text,
    fontWeight: '700',
  },
  subtle: {
    color: colors.muted,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: spacing.md,
    gap: 4,
  },
  summaryTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: 4,
  },
  summaryRow: {
    color: colors.text,
    fontWeight: '600',
  },
  summaryTotal: {
    color: '#FFD27A',
    fontWeight: '900',
    fontSize: 16,
    marginTop: 4,
  },
  errorText: {
    color: '#FECACA',
    fontWeight: '700',
    textAlign: 'center',
  },
});
