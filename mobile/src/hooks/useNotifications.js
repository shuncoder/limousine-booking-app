import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotificationUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api';
import { connectSocket } from '../services/socket';
import {
  decrementUnreadCount,
  getUnreadCount,
  incrementUnreadCount,
  resetUnreadCount,
  setUnreadCount,
  subscribeUnreadCount,
} from '../services/unreadCountStore';

/**
 * Subscribe a React state value to the shared unread-count store. Both
 * hooks below use this so any mutation from one screen propagates to the
 * other (e.g. "mark all read" in NotificationScreen instantly clears the
 * red badge in the bottom tab navigator).
 */
function useUnreadCount() {
  const [count, setLocal] = useState(getUnreadCount());
  useEffect(() => subscribeUnreadCount(setLocal), []);
  return count;
}

export const useNotifications = ({ autoLoad = true, limit = 30 } = {}) => {
  const [items, setItems] = useState([]);
  const unreadCount = useUnreadCount();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  const fetch = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setLoading(true);
        setError('');
        const data = await listNotifications({ limit });
        setItems(data.items);
        // Authoritative value from the server – sync the shared store.
        setUnreadCount(data.unreadCount);
      } catch (err) {
        setError(err?.response?.data?.msg || 'Không tải được thông báo');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [limit]
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetch(true);
    setRefreshing(false);
  }, [fetch]);

  const markRead = useCallback(async (id) => {
    if (!id) return;
    try {
      await markNotificationRead(id);
      let wasUnread = false;
      setItems((prev) =>
        prev.map((item) => {
          if (String(item._id) !== String(id) || item.readAt) return item;
          wasUnread = true;
          return { ...item, readAt: new Date().toISOString() };
        })
      );
      if (wasUnread) decrementUnreadCount(1);
    } catch {
      // ignore
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((item) =>
          item.readAt ? item : { ...item, readAt: new Date().toISOString() }
        )
      );
      resetUnreadCount();
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return undefined;
    let cancelled = false;
    let socket;

    // List-only listener: we just append the new notification to the local
    // items array. The shared store is updated by the global listener in
    // useUnreadNotificationsCount, so we don't bump the count here to avoid
    // double-counting when both hooks are mounted simultaneously.
    const handleNew = (notification) => {
      if (cancelled) return;
      setItems((prev) => {
        const exists = prev.some(
          (item) => String(item._id) === String(notification._id)
        );
        if (exists) return prev;
        return [notification, ...prev];
      });
    };

    (async () => {
      await fetch();
      if (cancelled) return;
      try {
        socket = await connectSocket();
        socketRef.current = socket;
        socket.on('notification:new', handleNew);
      } catch {
        // ignore socket errors
      }
    })();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.off('notification:new', handleNew);
        socketRef.current = null;
      }
    };
  }, [autoLoad, fetch]);

  return {
    items,
    unreadCount,
    loading,
    refreshing,
    error,
    refresh,
    markRead,
    markAllRead,
    setUnreadCount,
    refetch: fetch,
  };
};

export const useUnreadNotificationsCount = () => {
  const count = useUnreadCount();
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let socket;

    const handleNew = (notification) => {
      if (cancelled) return;
      // Only count notifications that arrive unread.
      if (!notification?.readAt) incrementUnreadCount(1);
    };

    (async () => {
      try {
        const initial = await getNotificationUnreadCount();
        if (!cancelled) setUnreadCount(initial);
      } catch {
        // ignore
      }
      try {
        socket = await connectSocket();
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
  }, []);

  return { count, setCount: setUnreadCount };
};
