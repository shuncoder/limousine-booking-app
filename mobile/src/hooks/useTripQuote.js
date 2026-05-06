import { useEffect, useRef, useState } from 'react';
import { quoteTrip } from '../services/api';

/**
 * Fetches a server-rendered price quote whenever the relevant inputs
 * (tripId, seatCount, promoCode) change. Server is the single source of truth
 * for pricing — the screen merely displays whatever the backend returns.
 */
export default function useTripQuote({ tripId, seatCount, promoCode }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!tripId || !seatCount) {
      setQuote(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await quoteTrip({ tripId, seatCount, promoCode });
        setQuote(data);
      } catch (err) {
        setQuote((prev) => (prev?.tripId === String(tripId) ? prev : null));
        setError(err?.response?.data?.msg || 'Không lấy được báo giá.');
      } finally {
        setLoading(false);
      }
    }, promoCode ? 350 : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [tripId, seatCount, promoCode]);

  return { quote, loading, error };
}
