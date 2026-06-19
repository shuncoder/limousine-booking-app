import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, spacing } from '../theme/theme';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import useComplaintDetail from '../hooks/useComplaintDetail';
import { formatDateTime, formatRelativeTime } from '../utils/bookingFormatters';

const STATUS_META = {
  open: { label: 'Mới', color: '#FCD34D', bg: 'rgba(252,211,77,0.15)' },
  in_progress: { label: 'Đang xử lý', color: '#60A5FA', bg: 'rgba(96,165,250,0.18)' },
  resolved: { label: 'Đã xử lý', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  rejected: { label: 'Từ chối', color: '#FCA5A5', bg: 'rgba(252,165,165,0.18)' },
};

export default function ComplaintDetailScreen({ route }) {
  const complaintId = route.params?.complaintId;
  const { complaint, history, loading, refreshing, error, refresh } =
    useComplaintDetail(complaintId);

  if (loading && !complaint) {
    return (
      <AppBackground>
        <View style={styles.center}>
          <ActivityIndicator color={colors.text} />
          <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
        </View>
      </AppBackground>
    );
  }

  if (!complaint) {
    return (
      <AppBackground>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || 'Không tìm thấy khiếu nại'}</Text>
        </View>
      </AppBackground>
    );
  }

  const meta = STATUS_META[complaint.status] || STATUS_META.open;
  const trip =
    complaint.tripId && typeof complaint.tripId === 'object' ? complaint.tripId : null;

  return (
    <AppBackground>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.text} />
        }
      >
        <GlassCard style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{complaint.subject}</Text>
            <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>

          <Text style={styles.metaText}>
            Gửi lúc: {formatDateTime(complaint.createdAt)}
          </Text>
          {complaint.statusUpdatedAt ? (
            <Text style={styles.metaText}>
              Cập nhật gần nhất: {formatRelativeTime(complaint.statusUpdatedAt)}
            </Text>
          ) : null}

          {trip ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Chuyến liên quan</Text>
              <Text style={styles.infoValue}>
                {trip.routeFrom} → {trip.routeTo}
              </Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nội dung khiếu nại</Text>
            <Text style={styles.message}>{complaint.message}</Text>
          </View>

          {complaint.resolutionNote ? (
            <View style={styles.resolutionBox}>
              <Text style={styles.resolutionLabel}>Phản hồi từ hệ thống</Text>
              <Text style={styles.resolutionText}>{complaint.resolutionNote}</Text>
            </View>
          ) : null}
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.timelineTitle}>Lịch sử trạng thái</Text>
          {history.length ? (
            history.map((entry, index) => {
              const entryMeta = STATUS_META[entry.status] || STATUS_META.open;
              const isLast = index === history.length - 1;

              return (
                <View key={String(entry._id)} style={styles.timelineItem}>
                  <View style={styles.timelineRail}>
                    <View
                      style={[styles.timelineDot, { backgroundColor: entryMeta.color }]}
                    />
                    {!isLast ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={[styles.timelineStatus, { color: entryMeta.color }]}>
                      {entryMeta.label}
                    </Text>
                    {entry.note ? (
                      <Text style={styles.timelineNote}>{entry.note}</Text>
                    ) : null}
                    {entry.resolutionNote ? (
                      <Text style={styles.timelineResolution}>{entry.resolutionNote}</Text>
                    ) : null}
                    <Text style={styles.timelineTime}>
                      {formatDateTime(entry.createdAt)}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyHistory}>Chưa có lịch sử cập nhật.</Text>
          )}
        </GlassCard>
      </ScrollView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.xl,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.muted,
    fontWeight: '600',
  },
  errorText: {
    color: '#FCA5A5',
    fontWeight: '700',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 24,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: '900',
    fontSize: 11,
  },
  metaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79,124,255,0.30)',
    backgroundColor: 'rgba(79,124,255,0.10)',
  },
  infoLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  infoValue: {
    color: colors.text,
    fontWeight: '800',
    marginTop: 4,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  resolutionBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.35)',
    backgroundColor: 'rgba(52,211,153,0.10)',
  },
  resolutionLabel: {
    color: '#34D399',
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 4,
  },
  resolutionText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 19,
  },
  timelineTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineRail: {
    width: 16,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginVertical: 4,
    minHeight: 28,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineStatus: {
    fontWeight: '900',
    fontSize: 14,
  },
  timelineNote: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  timelineResolution: {
    color: 'rgba(234,240,255,0.85)',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  timelineTime: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  emptyHistory: {
    color: colors.muted,
    fontWeight: '600',
  },
});
