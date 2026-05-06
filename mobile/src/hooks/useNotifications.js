import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getNotificationUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api';
import { connectSocket } from '../services/socket';

export const useNotifications = ({ autoLoad = true, limit = 30 } = {}) => {
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
      setItems((prev) =>
        prev.map((item) =>
          String(item._id) === String(id) && !item.readAt
            ? { ...item, readAt: new Date().toISOString() }
            : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
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
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) return undefined;
    let cancelled = false;
    let socket;

    const handleNew = (notification) => {
      if (cancelled) return;
      setItems((prev) => {
        const exists = prev.some(
          (item) => String(item._id) === String(notification._id)
        );
        if (exists) return prev;
        return [notification, ...prev];
      });
      if (!notification.readAt) {
        setUnreadCount((prev) => prev + 1);
      }
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
  const [count, setCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let socket;

    const handleNew = () => {
      if (cancelled) return;
      setCount((prev) => prev + 1);
    };

    (async () => {
      try {
        const initial = await getNotificationUnreadCount();
        if (!cancelled) setCount(initial);
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

  return { count, setCount };
};
