import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import AppBackground from '../../components/ui/AppBackground';
import GlassCard from '../../components/ui/GlassCard';
import useDriverTripPassengers from '../../hooks/useDriverTripPassengers';
import {
  formatCurrency,
  formatDateTime,
  formatPointDetail,
} from '../../utils/bookingFormatters';

const STATUS_META = {
  pending: { label: 'Chờ thanh toán', color: '#FCD34D', bg: 'rgba(252,211,77,0.18)' },
  paid: { label: 'Đã thanh toán', color: '#34D399', bg: 'rgba(52,211,153,0.18)' },
  partial: { label: 'Một phần đã TT', color: '#93C5FD', bg: 'rgba(147,197,253,0.18)' },
};

function callPhone(phone) {
  if (!phone) return;
  Linking.openURL(`tel:${phone}`).catch(() => undefined);
}

export default function DriverTripDetailScreen({ route }) {
  const tripId = route?.params?.tripId;
  const initialTrip = route?.params?.trip || null;

  const {
    trip,
    passengerGroups,
    stats,
    loading,
    refreshing,
    error,
    refresh,
  } = useDriverTripPassengers({ tripId, initialTrip });

  const renderHeader = () => (
    <View>
      <View style={styles.tripHeader}>
        <Text style={styles.route}>
          {trip ? `${trip.routeFrom} → ${trip.routeTo}` : 'Chuyến đi'}
        </Text>
        <Text style={styles.subtle}>
          Khởi hành: {formatDateTime(trip?.departureAt)}
        </Text>
        {trip?.vehicleName ? (
          <Text style={styles.subtle}>Xe: {trip.vehicleName}</Text>
        ) : null}
        <View style={styles.statRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.uniqueCustomers}</Text>
            <Text style={styles.statLabel}>Số khách</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {stats.totalSeatsBooked}/{stats.totalSeats}
            </Text>
            <Text style={styles.statLabel}>Ghế đã đặt</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.brand2 }]}>
              {stats.paidSeats}
            </Text>
            <Text style={styles.statLabel}>Ghế đã TT</Text>
          </View>
        </View>
      </View>

      <View style={styles.passengersHeader}>
        <Text style={styles.sectionTitle}>Danh sách hành khách</Text>
        <Text style={styles.subtle}>
          Mỗi khách hàng là một dòng (1 khách có thể đặt nhiều ghế).
        </Text>
      </View>
    </View>
  );

  return (
    <AppBackground>
      <View style={styles.screen}>
        <GlassCard style={styles.card}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : (
            <FlatList
              data={passengerGroups}
              keyExtractor={(item) => String(item.key)}
              ListHeaderComponent={renderHeader}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={colors.text}
                />
              }
              renderItem={({ item }) => {
                const meta = STATUS_META[item.statusKey] || STATUS_META.pending;
                const customer = item.customer;
                const seatCount = item.seatIds.length;
                const seatsLabel = item.seatIds.join(', ');

                return (
                  <View style={styles.passengerCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.seatCountBadge}>
                        <Text style={styles.seatCountValue}>{seatCount}</Text>
                        <Text style={styles.seatCountLabel}>ghế</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.customerName}>
                          {customer?.name || 'Khách hàng'}
                        </Text>
                        {customer?.email ? (
                          <Text style={styles.subtle}>{customer.email}</Text>
                        ) : null}
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>

                    {customer?.phone ? (
                      <TouchableOpacity
                        style={styles.phoneRow}
                        onPress={() => callPhone(customer.phone)}
                      >
                        <Ionicons name="call-outline" size={16} color={colors.brand} />
                        <Text style={styles.phoneText}>{customer.phone}</Text>
                      </TouchableOpacity>
                    ) : null}

                    <View style={styles.divider} />

                    <View style={styles.row}>
                      <Text style={styles.label}>Ghế</Text>
                      <Text style={styles.value} numberOfLines={2}>
                        {seatsLabel}
                      </Text>
                    </View>

                    {item.statusKey === 'partial' ? (
                      <View style={styles.row}>
                        <Text style={styles.label}>TT</Text>
                        <Text style={styles.value} numberOfLines={1}>
                          {item.paidCount}/{seatCount} ghế đã thanh toán
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.row}>
                      <Text style={styles.label}>Đón</Text>
                      <Text style={styles.value} numberOfLines={2}>
                        {formatPointDetail(item.firstPickup)}
                        {item.samePickup ? '' : ' (mỗi ghế một điểm)'}
                      </Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Trả</Text>
                      <Text style={styles.value} numberOfLines={2}>
                        {formatPointDetail(item.firstDropoff)}
                        {item.sameDropoff ? '' : ' (mỗi ghế một điểm)'}
                      </Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Tiền</Text>
                      <Text style={styles.priceValue}>
                        {formatCurrency(item.totalAmount, item.currency)}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    {error || 'Chuyến này chưa có khách đặt vé.'}
                  </Text>
                </View>
              }
            />
          )}
        </GlassCard>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xl },
  card: { flex: 1 },
  list: { paddingBottom: spacing.xl, gap: spacing.md },
  tripHeader: {
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.18)',
    marginBottom: spacing.md,
    gap: 4,
  },
  route: { color: colors.text, fontSize: 20, fontWeight: '900' },
  subtle: { color: 'rgba(234,240,255,0.72)', fontWeight: '600', marginTop: 2 },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statBox: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 },
  passengersHeader: { marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  passengerCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: 16,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.10)',
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  seatCountBadge: {
    minWidth: 52,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(79,124,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(79,124,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatCountValue: { color: colors.text, fontWeight: '900', fontSize: 18 },
  seatCountLabel: {
    color: 'rgba(234,240,255,0.85)',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  customerName: { color: colors.text, fontWeight: '900', fontSize: 15 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.4 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  phoneText: { color: colors.brand, fontWeight: '800', fontSize: 13 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: 4,
  },
  label: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12,
    width: 56,
  },
  value: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
    flex: 1,
    textAlign: 'right',
  },
  priceValue: {
    color: colors.brand,
    fontWeight: '900',
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: { color: colors.muted, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: 'rgba(234,240,255,0.78)',
    textAlign: 'center',
    fontWeight: '600',
  },
});
