import { useCallback, useEffect, useMemo, useState } from 'react';
import { listTrips } from '../services/api';

/**
 * Encapsulates trip-search logic so screens stay declarative:
 *  - loads the initial pickup/dropoff option universe,
 *  - searches by route + date,
 *  - filters by selected pickup area,
 *  - sorts by departure time.
 */
export default function useTripSearch() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [travelDate, setTravelDate] = useState(new Date());
  const [passengers, setPassengers] = useState(1);

  const [pickupOptions, setPickupOptions] = useState([]);
  const [dropoffOptions, setDropoffOptions] = useState([]);

  const [searchResults, setSearchResults] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initial load: pull the universe of route options.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listTrips({ page: 1, limit: 100 });
        if (cancelled) return;
        const trips = res?.items || [];
        const froms = [...new Set(trips.map((t) => t.routeFrom))];
        const tos = [...new Set(trips.map((t) => t.routeTo))];
        setPickupOptions(froms);
        setDropoffOptions(tos);
        if (froms.length) setPickup((prev) => prev || froms[0]);
        if (tos.length) setDropoff((prev) => prev || tos[0]);
      } catch (err) {
        if (!cancelled) setErrorMessage('Không tải được danh sách tuyến.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const swapRoute = useCallback(() => {
    setPickup(dropoff);
    setDropoff(pickup);
  }, [pickup, dropoff]);

  const searchTrips = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const dateParam = travelDate ? travelDate.toISOString().slice(0, 10) : '';
      const res = await listTrips({
        routeFrom: pickup,
        routeTo: dropoff,
        date: dateParam,
        page: 1,
        limit: 100,
      });
      setSearchResults(res?.items || []);
      setSelectedAreaId('');
    } catch (err) {
      setSearchResults([]);
      setErrorMessage('Không tìm được chuyến phù hợp.');
    } finally {
      setLoading(false);
    }
  }, [pickup, dropoff, travelDate]);

  const areaOptions = useMemo(() => {
    const map = new Map();
    searchResults.forEach((trip) => {
      (trip.pickupAreas || []).forEach((area) => {
        if (!area?.areaId || !area?.name) return;
        if (!map.has(area.areaId)) {
          map.set(area.areaId, { label: area.name, value: area.areaId });
        }
      });
    });
    return Array.from(map.values());
  }, [searchResults]);

  const filteredTrips = useMemo(() => {
    if (!selectedAreaId) return searchResults;
    return searchResults.filter((trip) =>
      (trip.pickupAreas || []).some(
        (area) => String(area.areaId) === String(selectedAreaId)
      )
    );
  }, [searchResults, selectedAreaId]);

  const sortedTrips = useMemo(
    () =>
      [...filteredTrips].sort(
        (a, b) => new Date(a.departureAt) - new Date(b.departureAt)
      ),
    [filteredTrips]
  );

  const formattedDate = useMemo(() => {
    if (!travelDate) return '';
    return travelDate.toLocaleDateString('vi-VN');
  }, [travelDate]);

  return {
    pickup,
    setPickup,
    dropoff,
    setDropoff,
    travelDate,
    setTravelDate,
    passengers,
    setPassengers,
    formattedDate,

    pickupOptions,
    dropoffOptions,
    swapRoute,

    searchTrips,
    loading,
    errorMessage,

    areaOptions,
    selectedAreaId,
    setSelectedAreaId,
    sortedTrips,
  };
}
