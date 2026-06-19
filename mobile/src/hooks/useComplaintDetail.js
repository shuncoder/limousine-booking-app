import { useCallback, useEffect, useState } from 'react';
import { getMyComplaint } from '../services/api';

export default function useComplaintDetail(complaintId) {
  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDetail = useCallback(async (isRefresh = false) => {
    if (!complaintId) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await getMyComplaint(complaintId);
      setComplaint(res.complaint);
      setHistory(res.history || []);
    } catch (e) {
      setError(e?.response?.data?.msg || e?.message || 'Không tải được chi tiết khiếu nại');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [complaintId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const refresh = useCallback(() => fetchDetail(true), [fetchDetail]);

  return {
    complaint,
    history,
    loading,
    refreshing,
    error,
    refresh,
  };
}
