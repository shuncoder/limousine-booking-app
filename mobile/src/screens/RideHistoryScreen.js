import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { listMyTickets, cancelTicket } from '../services/api';
import { colors, spacing } from '../theme/theme';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'pending', label: 'Chờ thanh toán' },
  { id: 'paid', label: 'Đã thanh toán' },
  { id: 'cancelled', label: 'Đã hủy' },
  { id: 'expired', label: 'Hết hạn' },
];

const STATUS_META = {
  pending: { label: 'Chờ thanh toán', color: '#FCD34D', bg: 'rgba(252,211,77,0.15)' },
  paid: { label: 'Đã thanh toán', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  cancelled: { label: 'Đã hủy', color: '#FCA5A5', bg: 'rgba(252,165,165,0.18)' },
  expired: { label: 'Hết hạn', color: '#94A3B8', bg: 'rgba(148,163,184,0.18)' },
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

export default function RideHistoryScreen({ navigation }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTickets = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError('');
        const params = statusFilter === 'all' ? {} : { status: statusFilter };
        const data = await listMyTickets({ ...params, limit: 50 });
        setTickets(data.items);
      } catch (err) {
        setError(err?.response?.data?.msg || 'Không tải được danh sách vé.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [statusFilter]
  );

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useFocusEffect(
    useCallback(() => {
      fetchTickets(true);
    }, [fetchTickets])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets(true);
    setRefreshing(false);
  }, [fetchTickets]);

  const handleCancelTicket = useCallback(
    (ticket) => {
      if (!ticket?._id) return;
      if (!['pending', 'paid'].includes(ticket.status)) return;

      Alert.alert(
        'Hủy vé',
        `Bạn chắc chắn muốn hủy vé ghế ${ticket.seatId}?`,
        [
          { text: 'Không', style: 'cancel' },
          {
            text: 'Hủy vé',
            style: 'destructive',
            onPress: async () => {
              try {
                await cancelTicket(ticket._id, 'Khách tự hủy');
                await fetchTickets(true);
              } catch (err) {
                Alert.alert(
                  'Lỗi',
                  err?.response?.data?.msg || 'Không thể hủy vé. Vui lòng thử lại.'
                );
              }
            },
          },
        ]
      );
    },
    [fetchTickets]
  );

  const grouped = useMemo(() => tickets, [tickets]);

  return (
    <AppBackground>
      <View style={styles.screen}>
        <GlassCard style={styles.mainCard}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Lịch sử chuyến</Text>
          </View>

          <View style={styles.filterRow}>
            {STATUS_FILTERS.map((filter) => {
              const active = statusFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setStatusFilter(filter.id)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
              <Text style={styles.loadingText}>Đang tải lịch sử...</Text>
            </View>
          ) : (
            <FlatList
              data={grouped}
              keyExtractor={(item) => String(item._id)}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.text}
                />
              }
              renderItem={({ item }) => {
                const trip = item.tripId && typeof item.tripId === 'object' ? item.tripId : null;
                const meta = STATUS_META[item.status] || STATUS_META.pending;

                return (
                  <View style={styles.ticketCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.route}>
                          {trip ? `${trip.routeFrom} → ${trip.routeTo}` : 'Chuyến đi'}
                        </Text>
                        <Text style={styles.subtle}>
                          Khởi hành: {formatDateTime(trip?.departureAt)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.row}>
                      <Text style={styles.label}>Ghế</Text>
                      <Text style={styles.value}>{item.seatId}</Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Điểm đón</Text>
                      <Text style={styles.value} numberOfLines={2}>
                        {formatPoint(item.pickupPoint)}
                      </Text>
                    </View>

                    <View style={styles.row}>
                      <Text style={styles.label}>Điểm trả</Text>
                      <Text style={styles.value} numberOfLines={2}>
                        {formatPoint(item.dropoffPoint)}
                      </Text>
                    </View>

                    {item.promoCode ? (
                      <View style={styles.row}>
                        <Text style={styles.label}>Mã giảm giá</Text>
                        <Text style={styles.value}>{item.promoCode}</Text>
                      </View>
                    ) : null}

                    <View style={styles.row}>
                      <Text style={styles.label}>Tổng tiền</Text>
                      <Text style={styles.priceValue}>
                        {formatCurrency(item.totalAmount, item.currency)}
                      </Text>
                    </View>

                    {item.status === 'pending' && item.expiresAt ? (
                      <Text style={styles.expireHint}>
                        Hết hạn lúc: {formatDateTime(item.expiresAt)}
                      </Text>
                    ) : null}

                    {item.status === 'paid' && item.paidAt ? (
                      <Text style={styles.subtle}>
                        Đã thanh toán: {formatDateTime(item.paidAt)}
                      </Text>
                    ) : null}

                    <View style={styles.actionsRow}>
                      {item.status === 'paid' ? (
                        <TouchableOpacity
                          style={styles.routeBtn}
                          onPress={() =>
                            navigation.navigate('RouteVisualization', {
                              ticketId: item._id,
                            })
                          }
                        >
                          <Text style={styles.routeBtnText}>Xem định tuyến A*</Text>
                        </TouchableOpacity>
                      ) : null}
                      {['pending', 'paid'].includes(item.status) ? (
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => handleCancelTicket(item)}
                        >
                          <Text style={styles.cancelBtnText}>Hủy vé</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    {error || 'Bạn chưa có vé nào.'}
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
  mainCard: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  filterChipActive: {
    borderColor: colors.brand,
    backgroundColor: 'rgba(79,124,255,0.25)',
  },
  filterText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  filterTextActive: {
    color: colors.text,
  },
  list: {
    paddingTop: spacing.sm,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  ticketCard: {
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
  route: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  subtle: {
    color: 'rgba(234,240,255,0.65)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
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
    width: 96,
  },
  value: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  priceValue: {
    color: colors.brand,
    fontWeight: '900',
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
  },
  expireHint: {
    color: '#FCD34D',
    fontWeight: '700',
    fontSize: 12,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.7)',
    backgroundColor: 'rgba(248,113,113,0.18)',
  },
  cancelBtnText: {
    color: '#FCA5A5',
    fontWeight: '900',
    fontSize: 12,
  },
  routeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(79,124,255,0.6)',
    backgroundColor: 'rgba(79,124,255,0.20)',
  },
  routeBtnText: {
    color: '#A5B4FC',
    fontWeight: '900',
    fontSize: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: {
    color: colors.muted,
    fontWeight: '600',
  },
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
