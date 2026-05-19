import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/theme';
import AppBackground from '../../components/ui/AppBackground';
import GlassCard from '../../components/ui/GlassCard';
import useDriverDashboard from '../../hooks/useDriverDashboard';
import { formatDayTimeShort } from '../../utils/bookingFormatters';

export default function DriverHomeScreen({ navigation }) {
  const {
    todayTrips,
    totalBookedToday,
    nextTrip,
    unread,
    loading,
    refreshing,
    refresh,
  } = useDriverDashboard();

  return (
    <AppBackground>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.text}
          />
        }
      >
        <GlassCard style={styles.card}>
          <Text style={styles.subtle}>Bảng điều khiển tài xế</Text>
          <Text style={styles.title}>Xin chào, tài xế!</Text>
          <Text style={styles.helper}>
            Theo dõi chuyến đi và khách hàng đặt vé theo thời gian thực.
          </Text>

          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Ionicons name="calendar-outline" size={20} color={colors.brand} />
              <Text style={styles.statValue}>{todayTrips.length}</Text>
              <Text style={styles.statLabel}>Chuyến hôm nay</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="people-outline" size={20} color={colors.brand2} />
              <Text style={styles.statValue}>{totalBookedToday}</Text>
              <Text style={styles.statLabel}>Khách hôm nay</Text>
            </View>
            <View style={styles.statBox}>
              <Ionicons name="notifications-outline" size={20} color="#FCD34D" />
              <Text style={styles.statValue}>{unread}</Text>
              <Text style={styles.statLabel}>Thông báo mới</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Chuyến sắp tới</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Chuyến')}>
              <Text style={styles.linkText}>Xem tất cả →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
            </View>
          ) : nextTrip ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('Chuyến', {
                  screen: 'DriverTripDetail',
                  params: { tripId: String(nextTrip._id), trip: nextTrip },
                })
              }
              style={styles.tripRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.route}>
                  {nextTrip.routeFrom} → {nextTrip.routeTo}
                </Text>
                <Text style={styles.subtle}>
                  {formatDayTimeShort(nextTrip.departureAt)} • Xe{' '}
                  {nextTrip.vehicleName || '--'}
                </Text>
                <Text style={[styles.subtle, { color: colors.brand2 }]}>
                  {nextTrip.bookedSeats || 0}/{nextTrip.totalSeats || 0} khách đã đặt
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.muted} />
            </TouchableOpacity>
          ) : (
            <Text style={styles.empty}>
              Chưa có chuyến nào sắp tới được phân công cho bạn.
            </Text>
          )}
        </GlassCard>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.xl },
  content: { paddingVertical: spacing.xl, gap: spacing.lg },
  card: { width: '100%', maxWidth: 620, alignSelf: 'center', gap: spacing.sm },
  subtle: {
    color: 'rgba(234,240,255,0.78)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  helper: { color: 'rgba(234,240,255,0.78)', marginBottom: spacing.md, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statBox: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '900' },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  linkText: { color: colors.brand, fontWeight: '900', fontSize: 12 },
  center: { paddingVertical: spacing.lg, alignItems: 'center' },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  route: { color: colors.text, fontSize: 16, fontWeight: '900' },
  empty: {
    color: 'rgba(234,240,255,0.78)',
    textAlign: 'center',
    fontWeight: '600',
    paddingVertical: spacing.lg,
  },
});
