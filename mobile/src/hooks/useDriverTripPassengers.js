import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTripPassengers } from '../services/api';
import { connectSocket } from '../services/socket';
import { groupTicketsByCustomer } from '../utils/passengerGrouping';

/**
 * Driver "Trip detail" hook: loads passenger tickets for a trip, joins the
 * `trip:<id>` socket room, and groups tickets by customer so 1 customer ↔
 * 1 row in the UI.
 *
 * @param {object} options
 * @param {string} options.tripId – id of the trip to inspect.
 * @param {object} [options.initialTrip] – nav-param trip (optional). Used as
 *   an immediate placeholder before the API call returns the canonical one.
 */
export default function useDriverTripPassengers({ tripId, initialTrip = null }) {
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
    const refresh = () => {
      if (!cancelled) fetchData(true);
    };
    const handleNotification = (notif) => {
      if (notif?.tripId && String(notif.tripId) === String(tripId)) refresh();
    };

    (async () => {
      try {
        const socket = await connectSocket();
        socketRef.current = socket;
        socket.emit('join_trip', { tripId });
        socket.on('seat_booked', refresh);
        socket.on('seat_paid', refresh);
        socket.on('seat_release', refresh);
        socket.on('seat_update', refresh);
        socket.on('notification:new', handleNotification);
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
        socketRef.current.off('notification:new', handleNotification);
        socketRef.current = null;
      }
    };
  }, [tripId, fetchData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  }, [fetchData]);

  const passengerGroups = useMemo(
    () => groupTicketsByCustomer(passengers),
    [passengers]
  );

  const stats = useMemo(() => {
    const totalSeats = trip?.totalSeats || 0;
    const totalSeatsBooked = passengers.length;
    const uniqueCustomers = passengerGroups.length;
    const paidSeats = passengers.filter((p) => p.status === 'paid').length;
    return { totalSeats, totalSeatsBooked, uniqueCustomers, paidSeats };
  }, [trip, passengers, passengerGroups]);

  return {
    trip,
    passengers,
    passengerGroups,
    stats,
    loading,
    refreshing,
    error,
    refresh,
  };
}
