import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Svg, { Polyline, Circle, Rect } from 'react-native-svg';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import { colors, spacing } from '../theme/theme';
import { getTicketRoutePlan } from '../services/api';
import useOsmRoute from '../hooks/useOsmRoute';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatLatLng(value) {
  if (!Number.isFinite(Number(value))) return '--';
  return Number(value).toFixed(5);
}

function formatMeters(value) {
  if (!Number.isFinite(Number(value))) return '--';
  const m = Number(value);
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${Math.round(m)} m`;
}

/**
 * Equirectangular (plate-carrée) projection scaled to the bounding box of
 * the polyline. Good enough for academic visualization at city scale.
 */
function projectPath(points, width, height, padding = 12) {
  if (!points.length) return { project: () => ({ x: 0, y: 0 }), bbox: null };
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  const dLat = Math.max(1e-6, maxLat - minLat);
  const dLng = Math.max(1e-6, maxLng - minLng);

  // Compensate longitude for latitude (closer to poles ⇒ smaller deg).
  const midLat = (minLat + maxLat) / 2;
  const lngScale = Math.cos((midLat * Math.PI) / 180);
  const dLngEff = dLng * lngScale;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / dLngEff, innerH / dLat);

  const offsetX = (innerW - dLngEff * scale) / 2 + padding;
  const offsetY = (innerH - dLat * scale) / 2 + padding;

  return {
    bbox: { minLat, maxLat, minLng, maxLng },
    project: (lat, lng) => {
      const x = (lng - minLng) * lngScale * scale + offsetX;
      // SVG y axis points down; latitude grows up → flip.
      const y = (maxLat - lat) * scale + offsetY;
      return { x, y };
    },
  };
}

export default function RouteVisualizationScreen({ navigation, route }) {
  const initialRoutePlan = route?.params?.routePlan || null;
  const ticketId = route?.params?.ticketId || null;

  const [routePlan, setRoutePlan] = useState(initialRoutePlan);
  const [loadingPlan, setLoadingPlan] = useState(
    !initialRoutePlan && !!ticketId
  );
  const [planError, setPlanError] = useState('');

  // If we navigated here without an inline routePlan (e.g. from RideHistory),
  // fetch the simulated user/pickup coords for this ticket.
  useEffect(() => {
    if (initialRoutePlan || !ticketId) return;
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

  const boardWidth = Math.min(SCREEN_WIDTH - spacing.xl * 2 - 32, 520);
  const boardHeight = Math.round(boardWidth * 0.75);

  const projection = useMemo(() => {
    const points = [];
    if (osm?.path?.length) {
      osm.path.forEach((p) => points.push({ lat: p.lat, lng: p.lng }));
    }
    if (userPoint) points.push(userPoint);
    if (pickupPoint) points.push(pickupPoint);
    return projectPath(points, boardWidth, boardHeight);
  }, [osm, userPoint, pickupPoint, boardWidth, boardHeight]);

  const pathPolyline = useMemo(() => {
    if (!osm?.path?.length || !projection.bbox) return '';
    return osm.path
      .map((p) => {
        const { x, y } = projection.project(p.lat, p.lng);
        return `${x},${y}`;
      })
      .join(' ');
  }, [osm, projection]);

  if (loadingPlan) {
    return (
      <AppBackground>
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} size="large" />
          <Text style={styles.loadingText}>Đang tải dữ liệu chuyến...</Text>
        </View>
      </AppBackground>
    );
  }

  if (planError || !routePlan) {
    return (
      <AppBackground>
        <View style={styles.center}>
          <GlassCard style={{ alignItems: 'center', gap: spacing.md }}>
            <Text style={styles.title}>Không có dữ liệu định tuyến</Text>
            <Text style={styles.subtle}>
              {planError || 'Thiếu toạ độ điểm đón.'}
            </Text>
            <PrimaryButton title="Quay lại" onPress={() => navigation.goBack()} />
          </GlassCard>
        </View>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard style={styles.card}>
          <Text style={styles.title}>A* trên bản đồ Hà Nội (OSM)</Text>
          <Text style={styles.subtle}>
            f(n) = g(n) + h(n) • Heuristic: khoảng cách Haversine • Dữ liệu: hanoi.osm.pbf
          </Text>

          <View style={styles.legendRow}>
            <Legend color="#34D399" label="Bạn (start)" />
            <Legend color="#F87171" label="Điểm đón (goal)" />
            <Legend color="#FACC15" label="Đường đi A*" line />
          </View>

          <View style={styles.boardWrap}>
            <Svg
              width={boardWidth}
              height={boardHeight}
              viewBox={`0 0 ${boardWidth} ${boardHeight}`}
              style={styles.board}
            >
              <Rect
                x={0}
                y={0}
                width={boardWidth}
                height={boardHeight}
                fill="rgba(255,255,255,0.08)"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1}
              />

              {pathPolyline ? (
                <Polyline
                  points={pathPolyline}
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}

              {userPoint && projection.bbox ? (
                <Circle
                  cx={projection.project(userPoint.lat, userPoint.lng).x}
                  cy={projection.project(userPoint.lat, userPoint.lng).y}
                  r={7}
                  fill="#34D399"
                  stroke="#022C22"
                  strokeWidth={1.5}
                />
              ) : null}
              {pickupPoint && projection.bbox ? (
                <Circle
                  cx={projection.project(pickupPoint.lat, pickupPoint.lng).x}
                  cy={projection.project(pickupPoint.lat, pickupPoint.lng).y}
                  r={7}
                  fill="#F87171"
                  stroke="#3B0A12"
                  strokeWidth={1.5}
                />
              ) : null}
            </Svg>

            {routing ? (
              <View style={styles.overlay}>
                <ActivityIndicator color={colors.text} />
                <Text style={styles.overlayText}>
                  Đang tải đồ thị OSM & chạy A*...
                </Text>
              </View>
            ) : null}
          </View>

          {routingError ? (
            <Text style={styles.warning}>{routingError}</Text>
          ) : !osm?.reachable && osm ? (
            <Text style={styles.warning}>
              Không tìm được đường nối giữa hai điểm trên đồ thị OSM.
            </Text>
          ) : null}

          <View style={styles.statsRow}>
            <Stat
              label="Số node duyệt"
              value={osm?.nodesExplored ?? '--'}
            />
            <Stat
              label="Node trên đường đi"
              value={osm?.path?.length ?? '--'}
            />
            <Stat
              label="Quãng đường"
              value={formatMeters(osm?.distance)}
              accent={colors.brand}
            />
            <Stat
              label="Thời gian"
              value={
                osm?.runtimeMs != null ? `${osm.runtimeMs} ms` : '--'
              }
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Toạ độ thực tế</Text>
          <CoordRow
            label="Vị trí của bạn (giả lập)"
            lat={routePlan.user?.lat}
            lng={routePlan.user?.lng}
          />
          <CoordRow
            label="Điểm đón"
            sub={routePlan.pickup?.name}
            lat={routePlan.pickup?.lat}
            lng={routePlan.pickup?.lng}
          />
          {osm?.start ? (
            <CoordRow
              label={`Snap → node OSM (${osm.start.snapDistance ?? 0} m)`}
              sub={`id ${osm.start.id}`}
              lat={osm.start.lat}
              lng={osm.start.lng}
            />
          ) : null}
          {osm?.goal ? (
            <CoordRow
              label={`Snap → node OSM (${osm.goal.snapDistance ?? 0} m)`}
              sub={`id ${osm.goal.id}`}
              lat={osm.goal.lat}
              lng={osm.goal.lng}
            />
          ) : null}
          <View style={styles.metaBox}>
            <Text style={styles.metaLine}>
              Khoảng cách thẳng (giả lập): {formatMeters(routePlan.user?.distanceMeters)}
            </Text>
            <Text style={styles.metaLine}>
              Đồ thị: Node = giao lộ OSM • Edge = đoạn đường giữa hai node
            </Text>
            <Text style={styles.metaLine}>
              g(n) = quãng đường tích lũy • h(n) = Haversine(n, goal)
            </Text>
          </View>
        </GlassCard>

        <PrimaryButton
          title="Về trang chủ"
          onPress={() => navigation.navigate('Main')}
          variant="success"
        />
      </ScrollView>
    </AppBackground>
  );
}

function Legend({ color, label, line }) {
  return (
    <View style={styles.legendItem}>
      {line ? (
        <View style={[styles.legendLine, { backgroundColor: color }]} />
      ) : (
        <View style={[styles.legendBox, { backgroundColor: color }]} />
      )}
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function Stat({ label, value, accent }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, accent ? { color: accent } : null]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CoordRow({ label, lat, lng, sub }) {
  return (
    <View style={styles.coordRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.coordLabel}>{label}</Text>
        {sub ? <Text style={styles.coordSub}>{sub}</Text> : null}
      </View>
      <Text style={styles.coordValue}>
        {formatLatLng(lat)}, {formatLatLng(lng)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.xxl },
  card: { width: '100%', maxWidth: 620, alignSelf: 'center', gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  subtle: { color: 'rgba(234,240,255,0.78)', fontWeight: '600' },
  loadingText: { color: colors.text, marginTop: spacing.md, fontWeight: '700' },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendLine: {
    width: 18,
    height: 4,
    borderRadius: 2,
  },
  legendText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  boardWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  board: {
    backgroundColor: 'rgba(11, 18, 32, 0.6)',
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 8,
    gap: 8,
  },
  overlayText: { color: colors.text, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statBox: {
    flexBasis: '47%',
    flexGrow: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  warning: {
    color: '#FCA5A5',
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.10)',
    gap: spacing.sm,
  },
  coordLabel: { color: colors.text, fontWeight: '800', fontSize: 13 },
  coordSub: { color: colors.muted, fontWeight: '600', fontSize: 12 },
  coordValue: {
    color: colors.brand,
    fontFamily: 'Menlo',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  metaBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  metaLine: { color: colors.muted, fontSize: 11, fontWeight: '700' },
});
