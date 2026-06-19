import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/theme';
import AppBackground from '../components/ui/AppBackground';
import GlassCard from '../components/ui/GlassCard';
import { useNotifications } from '../hooks/useNotifications';
import { formatRelativeTime } from '../utils/bookingFormatters';

const TYPE_META = {
  ticket_created: { icon: 'ticket-outline', color: '#FCD34D' },
  ticket_paid: { icon: 'checkmark-circle-outline', color: '#34D399' },
  ticket_cancelled: { icon: 'close-circle-outline', color: '#FCA5A5' },
  ticket_expired: { icon: 'time-outline', color: '#94A3B8' },
  driver_new_passenger: { icon: 'people-outline', color: '#60A5FA' },
  complaint_status_updated: { icon: 'chatbubble-ellipses-outline', color: '#FCD34D' },
  system: { icon: 'megaphone-outline', color: colors.brand },
};

export default function NotificationScreen() {
  const {
    items,
    loading,
    refreshing,
    refresh,
    markRead,
    markAllRead,
    unreadCount,
    error,
  } = useNotifications();

  return (
    <AppBackground>
      <View style={styles.screen}>
        <GlassCard style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Thông báo</Text>
              <Text style={styles.subtle}>
                {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Không có thông báo mới'}
              </Text>
            </View>
            {unreadCount > 0 ? (
              <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
                <Text style={styles.markAllText}>Đánh dấu đã đọc</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {loading && !items.length ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.text} />
              <Text style={styles.loadingText}>Đang tải thông báo...</Text>
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
                const meta = TYPE_META[item.type] || TYPE_META.system;
                const unread = !item.readAt;

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => unread && markRead(item._id)}
                    style={[styles.itemRow, unread && styles.itemRowUnread]}
                  >
                    <View
                      style={[
                        styles.iconWrap,
                        { backgroundColor: `${meta.color}33`, borderColor: `${meta.color}80` },
                      ]}
                    >
                      <Ionicons name={meta.icon} size={20} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.itemHeaderRow}>
                        <Text style={[styles.itemTitle, unread && styles.itemTitleUnread]}>
                          {item.title}
                        </Text>
                        {unread ? <View style={styles.dot} /> : null}
                      </View>
                      {item.body ? (
                        <Text style={styles.itemBody} numberOfLines={4}>
                          {item.body}
                        </Text>
                      ) : null}
                      <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    {error || 'Hiện chưa có thông báo nào.'}
                  </Text>
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
  },
  markAllBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(79,124,255,0.5)',
    backgroundColor: 'rgba(79,124,255,0.18)',
  },
  markAllText: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 11,
  },
  list: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
  },
  itemRowUnread: {
    backgroundColor: 'rgba(79,124,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(79,124,255,0.25)',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginVertical: 4,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 14,
    flex: 1,
  },
  itemTitleUnread: {
    fontWeight: '900',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },
  itemBody: {
    color: 'rgba(234,240,255,0.85)',
    fontWeight: '600',
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  timeText: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
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
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: 'rgba(234,240,255,0.78)',
    textAlign: 'center',
    fontWeight: '600',
  },
});
