import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Svg, { Polyline, Circle, Rect, Line, Text as SvgText } from 'react-native-svg';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import { colors, spacing } from '../theme/theme';
import useTicketRoutePlan from '../hooks/useTicketRoutePlan';
import { formatLatLng, formatMeters } from '../utils/mapProjection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RouteVisualizationScreen({ navigation, route }) {
  const initialRoutePlan = route?.params?.routePlan || null;
  const ticketId = route?.params?.ticketId || null;

  const boardWidth = Math.min(SCREEN_WIDTH - spacing.xl * 2 - 32, 520);
  const boardHeight = Math.round(boardWidth * 0.75);

  const {
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
  } = useTicketRoutePlan({
    initialRoutePlan,
    ticketId,
    boardWidth,
    boardHeight,
  });

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
          <Text style={styles.title}>Đường đi ngắn nhất đến điểm đón</Text>
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

              {userPoint && osm?.start && projection.bbox ? (
                <Line
                  x1={projection.project(userPoint.lat, userPoint.lng).x}
                  y1={projection.project(userPoint.lat, userPoint.lng).y}
                  x2={projection.project(osm.start.lat, osm.start.lng).x}
                  y2={projection.project(osm.start.lat, osm.start.lng).y}
                  stroke="rgba(52, 211, 153, 0.7)"
                  strokeWidth={1.5}
                  strokeDasharray="4,3"
                />
              ) : null}

              {pickupPoint && projection.bbox ? (
                <>
                  <Circle
                    cx={projection.project(pickupPoint.lat, pickupPoint.lng).x}
                    cy={projection.project(pickupPoint.lat, pickupPoint.lng).y}
                    r={11}
                    fill="rgba(248, 113, 113, 0.25)"
                  />
                  <Circle
                    cx={projection.project(pickupPoint.lat, pickupPoint.lng).x}
                    cy={projection.project(pickupPoint.lat, pickupPoint.lng).y}
                    r={7}
                    fill="#F87171"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={projection.project(pickupPoint.lat, pickupPoint.lng).x + 10}
                    y={projection.project(pickupPoint.lat, pickupPoint.lng).y + 4}
                    fill="#FCA5A5"
                    fontSize={10}
                    fontWeight="bold"
                  >
                    Đón
                  </SvgText>
                </>
              ) : null}

              {/* Render user point LAST so it always sits on top of the
                  polyline + pickup marker, even when they overlap. */}
              {userPoint && projection.bbox ? (
                <>
                  <Circle
                    cx={projection.project(userPoint.lat, userPoint.lng).x}
                    cy={projection.project(userPoint.lat, userPoint.lng).y}
                    r={12}
                    fill="rgba(52, 211, 153, 0.25)"
                  />
                  <Circle
                    cx={projection.project(userPoint.lat, userPoint.lng).x}
                    cy={projection.project(userPoint.lat, userPoint.lng).y}
                    r={8}
                    fill="#34D399"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                  <SvgText
                    x={projection.project(userPoint.lat, userPoint.lng).x + 11}
                    y={projection.project(userPoint.lat, userPoint.lng).y - 6}
                    fill="#A7F3D0"
                    fontSize={10}
                    fontWeight="bold"
                  >
                    Bạn
                  </SvgText>
                </>
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
            <Stat label="Số node duyệt" value={osm?.nodesExplored ?? '--'} />
            <Stat label="Node trên đường đi" value={osm?.path?.length ?? '--'} />
            <Stat
              label="Quãng đường"
              value={formatMeters(osm?.distance)}
              accent={colors.brand}
            />
            <Stat
              label="Thời gian"
              value={osm?.runtimeMs != null ? `${osm.runtimeMs} ms` : '--'}
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
  legendBox: { width: 14, height: 14, borderRadius: 3 },
  legendLine: { width: 18, height: 4, borderRadius: 2 },
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
  statValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
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
