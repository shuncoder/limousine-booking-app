import { useCallback, useEffect, useState } from 'react';
import { listMyComplaints } from '../services/api';

export default function useComplaints() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchComplaints = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await listMyComplaints({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setItems(res.items || []);
    } catch (e) {
      setError(e?.response?.data?.msg || e?.message || 'Không tải được danh sách khiếu nại');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const refresh = useCallback(() => fetchComplaints(true), [fetchComplaints]);

  return {
    items,
    loading,
    refreshing,
    error,
    refresh,
    reload: fetchComplaints,
    statusFilter,
    setStatusFilter,
  };
}
