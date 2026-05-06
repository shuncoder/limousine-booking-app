import { useEffect } from 'react';
import { connectSocket } from '../services/socket';

export const useSeatSocket = (tripId, handlers = {}) => {
  useEffect(() => {
    if (!tripId) return undefined;
    let socket;
    let cancelled = false;

    const onSeatHold = (payload) => handlers.onSeatHold?.(payload);
    const onSeatRelease = (payload) => handlers.onSeatRelease?.(payload);
    const onSeatBooked = (payload) => handlers.onSeatBooked?.(payload);
    const onSeatPaid = (payload) => handlers.onSeatPaid?.(payload);
    const onSeatUpdate = (payload) => handlers.onSeatUpdate?.(payload);

    (async () => {
      socket = await connectSocket();
      if (cancelled) return;

      socket.emit('join_trip', { tripId });
      socket.on('seat_hold', onSeatHold);
      socket.on('seat_release', onSeatRelease);
      socket.on('seat_booked', onSeatBooked);
      socket.on('seat_paid', onSeatPaid);
      socket.on('seat_update', onSeatUpdate);
    })();

    return () => {
      cancelled = true;
      if (!socket) return;
      socket.emit('leave_trip', { tripId });
      socket.off('seat_hold', onSeatHold);
      socket.off('seat_release', onSeatRelease);
      socket.off('seat_booked', onSeatBooked);
      socket.off('seat_paid', onSeatPaid);
      socket.off('seat_update', onSeatUpdate);
    };
  }, [tripId]);
};
