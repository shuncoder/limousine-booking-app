import { useEffect, useMemo, useState } from 'react';
import { getTicketRoutePlan } from '../services/api';
import { buildPolylinePoints, projectPath } from '../utils/mapProjection';
import useOsmRoute from './useOsmRoute';

/**
 * Owns everything RouteVisualizationScreen needs to render the A* graph:
 *   - resolves the routePlan (either passed inline as nav param or fetched
 *     by ticketId).
 *   - calls useOsmRoute to actually run A* on the OSM graph.
 *   - computes the SVG projection + polyline string given board dimensions.
 *
 * The screen stays purely declarative SVG.
 */
export default function useTicketRoutePlan({
  initialRoutePlan,
  ticketId,
  boardWidth,
  boardHeight,
}) {
  const [routePlan, setRoutePlan] = useState(initialRoutePlan || null);
  const [loadingPlan, setLoadingPlan] = useState(
    !initialRoutePlan && !!ticketId
  );
  const [planError, setPlanError] = useState('');

  useEffect(() => {
    if (initialRoutePlan || !ticketId) return undefined;
    let cancelled = false;

    setLoadingPlan(true);
    setPlanError('');

    getTicketRoutePlan(ticketId)
      .then((data) => {
        if (cancelled) return;
        setRoutePlan(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setPlanError(
          err?.response?.data?.msg || 'Không tải được dữ liệu định tuyến.'
        );
      })
      .finally(() => {
        if (!cancelled) setLoadingPlan(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialRoutePlan, ticketId]);

  const userPoint = routePlan?.user
    ? { lat: routePlan.user.lat, lng: routePlan.user.lng }
    : null;
  const pickupPoint = routePlan?.pickup
    ? { lat: routePlan.pickup.lat, lng: routePlan.pickup.lng }
    : null;

  const { data: osm, loading: routing, error: routingError } = useOsmRoute({
    from: userPoint,
    to: pickupPoint,
  });

  const projection = useMemo(() => {
    const points = [];
    if (osm?.path?.length) {
      osm.path.forEach((p) => points.push({ lat: p.lat, lng: p.lng }));
    }
    if (userPoint) points.push(userPoint);
    if (pickupPoint) points.push(pickupPoint);
    return projectPath(points, boardWidth, boardHeight);
  }, [osm, userPoint, pickupPoint, boardWidth, boardHeight]);

  const pathPolyline = useMemo(
    () => buildPolylinePoints(osm?.path, projection.bbox ? projection.project : null),
    [osm, projection]
  );

  return {
    routePlan,
    loadingPlan,
    planError,
    osm,
    routing,
    routingError,
    userPoint,
    pickupPoint,
    projection,
    pathPolyline,
  };
}
