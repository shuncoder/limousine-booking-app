import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { cancelTicket, listMyTickets } from '../services/api';

/**
 * Owns the data-side of the ticket history screen:
 *   - status filter
 *   - fetch + refresh + focus refetch
 *   - confirm-and-cancel ticket flow (with native Alert)
 *
 * Returns plain state + handlers; the screen is responsible for layout only.
 */
export default function useTicketHistory({ initialStatus = 'all' } = {}) {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

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

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTickets(true);
    setRefreshing(false);
  }, [fetchTickets]);

  const confirmCancelTicket = useCallback(
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
                  err?.response?.data?.msg ||
                    'Không thể hủy vé. Vui lòng thử lại.'
                );
              }
            },
          },
        ]
      );
    },
    [fetchTickets]
  );

  return {
    tickets,
    statusFilter,
    setStatusFilter,
    loading,
    refreshing,
    error,
    refresh,
    confirmCancelTicket,
  };
}
