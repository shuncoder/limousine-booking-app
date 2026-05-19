import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { listMyDriverTrips } from '../services/api';
import { connectSocket } from '../services/socket';

/**
 * Driver "Trips" list hook:
 *   - holds the upcoming/all filter,
 *   - fetches assigned trips with seat-count metadata,
 *   - subscribes to socket notifications and silently re-fetches when a new
 *     passenger is added (so X/Y ghế stays fresh without manual reload).
 */
export default function useDriverTrips({ initialFilter = 'upcoming' } = {}) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(initialFilter);
  const socketRef = useRef(null);

  const fetchTrips = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError('');
        const data = await listMyDriverTrips({
          upcoming: filter === 'upcoming',
          limit: 50,
        });
        setTrips(data.items);
      } catch (err) {
        setError(err?.response?.data?.msg || 'Không tải được danh sách chuyến.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [filter]
  );

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useFocusEffect(
    useCallback(() => {
      fetchTrips(true);
    }, [fetchTrips])
  );

  useEffect(() => {
    let cancelled = false;
    const handleNew = (notification) => {
      if (cancelled) return;
      if (notification?.type === 'driver_new_passenger') {
        fetchTrips(true);
      }
    };

    (async () => {
      try {
        const socket = await connectSocket();
        socketRef.current = socket;
        socket.on('notification:new', handleNew);
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.off('notification:new', handleNew);
        socketRef.current = null;
      }
    };
  }, [fetchTrips]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrips(true);
    setRefreshing(false);
  }, [fetchTrips]);

  return {
    trips,
    filter,
    setFilter,
    loading,
    refreshing,
    error,
    refresh,
  };
}
