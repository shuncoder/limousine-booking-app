import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/theme';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import useComplaints from '../hooks/useComplaints';
import { formatRelativeTime } from '../utils/bookingFormatters';

const STATUS_FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'open', label: 'Mới' },
  { id: 'in_progress', label: 'Đang xử lý' },
  { id: 'resolved', label: 'Đã xử lý' },
  { id: 'rejected', label: 'Từ chối' },
];

const STATUS_META = {
  open: { label: 'Mới', color: '#FCD34D', bg: 'rgba(252,211,77,0.15)' },
  in_progress: { label: 'Đang xử lý', color: '#60A5FA', bg: 'rgba(96,165,250,0.18)' },
  resolved: { label: 'Đã xử lý', color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  rejected: { label: 'Từ chối', color: '#FCA5A5', bg: 'rgba(252,165,165,0.18)' },
};

export default function ComplaintsScreen({ navigation }) {
  const { items, loading, refreshing, error, refresh, statusFilter, setStatusFilter } =
    useComplaints();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const openCreate = () => {
    navigation.getParent()?.navigate('CreateComplaint');
  };

  const openDetail = (complaintId) => {
    navigation.getParent()?.navigate('ComplaintDetail', { complaintId });
  };

  return (
    <AppBackground>
      <View style={styles.screen}>
        <GlassCard style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Lịch sử khiếu nại</Text>
              <Text style={styles.subtle}>
                Theo dõi trạng thái các khiếu nại đã gửi
              </Text>
            </View>
            <TouchableOpacity onPress={openCreate} style={styles.addBtn}>
              <Ionicons name="add" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            {STATUS_FILTERS.map((filter) => {
              const active = statusFilter === filter.id;
              return (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setStatusFilter(filter.id)}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {loading && !items.length ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
              <Text style={styles.loadingText}>Đang tải khiếu nại...</Text>
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(item) => String(item._id)}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  tintColor={colors.text}
                />
              }
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => {
                const meta = STATUS_META[item.status] || STATUS_META.open;

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => openDetail(item._id)}
                    style={styles.itemCard}
                  >
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemSubject} numberOfLines={2}>
                        {item.subject}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                        <Text style={[styles.statusText, { color: meta.color }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.itemMessage} numberOfLines={3}>
                      {item.message}
                    </Text>

                    {item.resolutionNote ? (
                      <View style={styles.resolutionBox}>
                        <Text style={styles.resolutionLabel}>Phản hồi từ hệ thống</Text>
                        <Text style={styles.resolutionText} numberOfLines={2}>
                          {item.resolutionNote}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.itemFooter}>
                      <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
                      <Text style={styles.viewDetail}>Xem chi tiết →</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="chatbubble-ellipses-outline" size={40} color={colors.muted} />
                  <Text style={styles.emptyText}>
                    {error || 'Bạn chưa gửi khiếu nại nào.'}
                  </Text>
                  <PrimaryButton
                    title="Gửi khiếu nại mới"
                    onPress={openCreate}
                    style={styles.emptyBtn}
                  />
                </View>
              }
            />
          )}
        </GlassCard>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: spacing.xl },
  card: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: { color: colors.text, fontSize: 20, fontWeight: '900' },
  subtle: {
    color: 'rgba(234,240,255,0.72)',
    fontWeight: '600',
    marginTop: 2,
    fontSize: 13,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79,124,255,0.5)',
    backgroundColor: 'rgba(79,124,255,0.22)',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  filterChipActive: {
    borderColor: colors.brand,
    backgroundColor: 'rgba(79,124,255,0.25)',
  },
  filterText: {
    color: colors.muted,
    fontWeight: '700',
    fontSize: 11,
  },
  filterTextActive: {
    color: colors.text,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    borderRadius: 14,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  itemSubject: {
    flex: 1,
    color: colors.text,
    fontWeight: '900',
    fontSize: 15,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusText: {
    fontWeight: '900',
    fontSize: 10,
  },
  itemMessage: {
    color: 'rgba(234,240,255,0.85)',
    fontWeight: '600',
    fontSize: 13,
    lineHeight: 19,
  },
  resolutionBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 10,
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
    lineHeight: 18,
  },
  timeText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  viewDetail: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: '800',
  },
  separator: {
    height: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  loadingText: {
    color: colors.muted,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    color: 'rgba(234,240,255,0.78)',
    textAlign: 'center',
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
  },
  emptyBtn: {
    marginTop: spacing.sm,
    minWidth: 200,
  },
});
