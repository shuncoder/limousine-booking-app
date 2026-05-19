import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import AppBackground from '../../components/ui/AppBackground';
import GlassCard from '../../components/ui/GlassCard';
import useDriverTrips from '../../hooks/useDriverTrips';
import { formatDateTime } from '../../utils/bookingFormatters';

const FILTERS = [
  { id: 'upcoming', label: 'Sắp tới' },
  { id: 'all', label: 'Tất cả' },
];

const STATUS_META = {
  scheduled: { label: 'Sắp khởi hành', color: '#FCD34D', bg: 'rgba(252,211,77,0.18)' },
  departed: { label: 'Đang chạy', color: '#34D399', bg: 'rgba(52,211,153,0.18)' },
  cancelled: { label: 'Đã hủy', color: '#FCA5A5', bg: 'rgba(252,165,165,0.18)' },
};

export default function DriverTripsScreen({ navigation }) {
  const {
    trips,
    filter,
    setFilter,
    loading,
    refreshing,
    error,
    refresh,
  } = useDriverTrips();

  return (
    <AppBackground>
      <View style={styles.screen}>
        <GlassCard style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Chuyến của bạn</Text>
              <Text style={styles.subtle}>
                Danh sách chuyến đã được phân công cho tài xế.
              </Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setFilter(f.id)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : (
            <FlatList
              data={trips}
              keyExtractor={(item) => String(item._id)}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={colors.text}
                />
              }
              renderItem={({ item }) => {
                const meta = STATUS_META[item.status] || STATUS_META.scheduled;
                const totalSeats = item.totalSeats || 0;
                const booked = item.bookedSeats || 0;
                const fillPct = totalSeats
                  ? `${Math.min(100, Math.round((booked / totalSeats) * 100))}%`
                  : '0%';

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate('DriverTripDetail', {
                        tripId: String(item._id),
                        trip: item,
                      })
                    }
                    style={styles.tripCard}
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.route}>
                          {item.routeFrom} → {item.routeTo}
                        </Text>
                        <Text style={styles.subtle}>
                          {formatDateTime(item.departureAt)}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="bus-outline" size={16} color={colors.muted} />
                        <Text style={styles.metaText}>{item.vehicleName || '--'}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="people-outline" size={16} color={colors.muted} />
                        <Text style={styles.metaText}>
                          {booked}/{totalSeats} ghế
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <View style={styles.fillBar}>
                        <View style={[styles.fillBarFg, { width: fillPct }]} />
                      </View>
                      <Text style={styles.viewLink}>Xem khách →</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    {error ||
                      'Bạn chưa được phân công chuyến nào. Vui lòng liên hệ quản trị viên.'}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  subtle: { color: 'rgba(234,240,255,0.72)', fontWeight: '600', marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    borderColor: colors.brand,
    backgroundColor: 'rgba(79,124,255,0.25)',
  },
  filterText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  filterTextActive: { color: colors.text },
  list: { paddingTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xl },
  tripCard: {
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
  route: { color: colors.text, fontSize: 16, fontWeight: '900' },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: { fontWeight: '900', fontSize: 11, letterSpacing: 0.4 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fillBar: {
    flex: 1,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  fillBarFg: { height: 6, backgroundColor: colors.brand2 },
  viewLink: { color: colors.brand, fontWeight: '900', fontSize: 12 },
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
