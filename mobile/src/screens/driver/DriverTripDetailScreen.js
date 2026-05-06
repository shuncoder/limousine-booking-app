import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { getTripPassengers } from '../../services/api';
import { connectSocket } from '../../services/socket';
import { colors, spacing } from '../../theme/theme';
import AppBackground from '../../components/ui/AppBackground';
import GlassCard from '../../components/ui/GlassCard';

const STATUS_META = {
  pending: { label: 'Chờ thanh toán', color: '#FCD34D', bg: 'rgba(252,211,77,0.18)' },
  paid: { label: 'Đã thanh toán', color: '#34D399', bg: 'rgba(52,211,153,0.18)' },
};

function formatCurrency(value, currency = 'VND') {
  try {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  } catch {
    return `${value} ${currency}`;
  }
}

function formatDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPoint(point, fallback = '--') {
  if (!point) return fallback;
  const name = String(point.name || '').trim();
  const address = String(point.address || '').trim();
  return [name, address].filter(Boolean).join(' • ') || fallback;
}

export default function DriverTripDetailScreen({ route }) {
  const tripId = route?.params?.tripId;
  const initialTrip = route?.params?.trip || null;

  const [trip, setTrip] = useState(initialTrip);
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  const fetchData = useCallback(
    async (silent = false) => {
      if (!tripId) return;
      try {
        if (!silent) setLoading(true);
        setError('');
        const data = await getTripPassengers(tripId);
        if (data?.trip) setTrip((prev) => ({ ...(prev || {}), ...data.trip }));
        setPassengers(Array.isArray(data?.passengers) ? data.passengers : []);
      } catch (err) {
        setError(
          err?.response?.data?.msg || 'Không tải được danh sách hành khách.'
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [tripId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!tripId) return undefined;
    let cancelled = false;
    let socket;

    const refresh = () => {
      if (!cancelled) fetchData(true);
    };

    (async () => {
      try {
        socket = await connectSocket();
        socketRef.current = socket;
        socket.emit('join_trip', { tripId });
        socket.on('seat_booked', refresh);
        socket.on('seat_paid', refresh);
        socket.on('seat_release', refresh);
        socket.on('seat_update', refresh);
        socket.on('notification:new', (notif) => {
          if (notif?.tripId && String(notif.tripId) === String(tripId)) {
            refresh();
          }
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.emit('leave_trip', { tripId });
        socketRef.current.off('seat_booked', refresh);
        socketRef.current.off('seat_paid', refresh);
        socketRef.current.off('seat_release', refresh);
        socketRef.current.off('seat_update', refresh);
        socketRef.current = null;
      }
    };
  }, [tripId, fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  const handleCallPhone = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => undefined);
  };

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
            <Text style={styles.statValue}>{passengers.length}</Text>
            <Text style={styles.statLabel}>Khách đã đặt</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{trip?.totalSeats || 0}</Text>
            <Text style={styles.statLabel}>Tổng ghế</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.brand2 }]}>
              {passengers.filter((p) => p.status === 'paid').length}
            </Text>
            <Text style={styles.statLabel}>Đã thanh toán</Text>
          </View>
        </View>
      </View>

      <View style={styles.passengersHeader}>
        <Text style={styles.sectionTitle}>Danh sách hành khách</Text>
        <Text style={styles.subtle}>
          Cập nhật theo thời gian thực qua socket.
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
              data={passengers}
              keyExtractor={(item) => String(item._id)}
              ListHeaderComponent={renderHeader}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.text}
                />
              }
              renderItem={({ item }) => {
                const meta = STATUS_META[item.status] || STATUS_META.pending;
                const customer = item.userId && typeof item.userId === 'object' ? item.userId : null;

                return (
                  <View style={styles.passengerCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.seatBadge}>
                        <Text style={styles.seatText}>{item.seatId}</Text>
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
                        onPress={() => handleCallPhone(customer.phone)}
                      >
                        <Ionicons name="call-outline" size={16} color={colors.brand} />
                        <Text style={styles.phoneText}>{customer.phone}</Text>
                      </TouchableOpacity>
                    ) : null}

                    <View style={styles.divider} />

                    <View style={styles.row}>
                      <Text style={styles.label}>Đón</Text>
                      <Text style={styles.value} numberOfLines={2}>
                        {formatPoint(item.pickupPoint)}
                      </Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Trả</Text>
                      <Text style={styles.value} numberOfLines={2}>
                        {formatPoint(item.dropoffPoint)}
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
  seatBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(79,124,255,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(79,124,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatText: { color: colors.text, fontWeight: '900', fontSize: 16 },
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
