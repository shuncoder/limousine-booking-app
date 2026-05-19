import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  getNotificationUnreadCount,
  listMyDriverTrips,
} from '../services/api';

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

/**
 * Loads the driver dashboard data (upcoming trips + unread count) and
 * derives today's stats. Used by DriverHomeScreen so it can render purely
 * declarative cards.
 */
export default function useDriverDashboard() {
  const [trips, setTrips] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      // Original screen swallowed errors here – keep behavior identical.
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

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  const todayTrips = useMemo(
    () => trips.filter((t) => isToday(t.departureAt)),
    [trips]
  );

  const totalBookedToday = useMemo(
    () =>
      todayTrips.reduce(
        (sum, t) => sum + (Number(t.bookedSeats) || 0),
        0
      ),
    [todayTrips]
  );

  const nextTrip = trips[0] || null;

  return {
    trips,
    todayTrips,
    totalBookedToday,
    nextTrip,
    unread,
    loading,
    refreshing,
    refresh,
  };
}
