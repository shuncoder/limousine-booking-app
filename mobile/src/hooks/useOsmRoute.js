import { useEffect, useState } from 'react';
import { runAstarRoute } from '../services/api';

/**
 * Calls the backend's A* OSM router (which loads hanoi.osm.pbf, builds the
 * road graph, snaps `from` / `to` to the nearest road nodes, then runs
 * A* with Haversine heuristic) and exposes the result to React.
 *
 * Returns the path as a polyline of { lat, lng } points so the screen can
 * render it without doing any algorithmic work itself.
 */
export default function useOsmRoute({ from, to }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (
      !from ||
      !to ||
      !Number.isFinite(Number(from.lat)) ||
      !Number.isFinite(Number(from.lng)) ||
      !Number.isFinite(Number(to.lat)) ||
      !Number.isFinite(Number(to.lng))
    ) {
      setData(null);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    runAstarRoute({ from, to })
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err?.response?.data?.msg ||
            err?.message ||
            'Không tính được đường đi.'
        );
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [from?.lat, from?.lng, to?.lat, to?.lng]);

  return { data, loading, error };
}
