import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { listMyDriverTrips, getNotificationUnreadCount } from '../../services/api';
import { colors, spacing } from '../../theme/theme';
import AppBackground from '../../components/ui/AppBackground';
import GlassCard from '../../components/ui/GlassCard';

function formatDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isToday(value) {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function DriverHomeScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState([]);
  const [unread, setUnread] = useState(0);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [tripsRes, unreadRes] = await Promise.all([
        listMyDriverTrips({ upcoming: true, limit: 10 }),
        getNotificationUnreadCount().catch(() => 0),
      ]);
      setTrips(tripsRes.items);
      setUnread(unreadRes);
    } catch {
      // ignore
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [fetchData])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  const todayTrips = trips.filter((t) => isToday(t.departureAt));
  const totalBookedToday = todayTrips.reduce(
    (sum, t) => sum + (Number(t.bookedSeats) || 0),
    0
  );
  const nextTrip = trips[0];

  return (
    <AppBackground>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
                  {formatDateTime(nextTrip.departureAt)} • Xe{' '}
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
