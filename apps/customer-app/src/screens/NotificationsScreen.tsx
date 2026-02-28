/**
 * NotificationsScreen.tsx
 * Spec §8.1 #25 — Push notification history / inbox.
 * GET /api/notifications  PATCH /api/notifications/read-all
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'order' | 'offer' | 'system' | 'delivery';
  is_read: boolean;
  created_at: string;
  data?: { orderId?: string };
}

const TYPE_ICONS: Record<string, string> = {
  order: '📦', offer: '🏷️', system: '🔔', delivery: '🛵',
};

const TYPE_COLORS: Record<string, string> = {
  order: '#2563EB', offer: '#F5A826', system: '#6B7280', delivery: '#163D26',
};

const timeAgo = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(Array.isArray(data) ? data : data.notifications ?? []);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchNotifications(); }, []));

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleTap = (notif: Notification) => {
    // Mark single as read
    api.patch(`/notifications/${notif.id}/read`).catch(() => {});
    setNotifications(p => p.map(n => n.id === notif.id ? { ...n, is_read: true } : n));

    // Navigate based on type
    if (notif.type === 'order' && notif.data?.orderId) {
      navigation.navigate('HomeTab', {
        screen: 'OrderTracking', params: { orderId: notif.data.orderId }
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notifCard, !item.is_read && styles.notifUnread]}
      onPress={() => handleTap(item)}
      activeOpacity={0.75}
    >
      <View style={[styles.iconWrap, { backgroundColor: TYPE_COLORS[item.type] + '18' }]}>
        <Text style={styles.icon}>{TYPE_ICONS[item.type] ?? '🔔'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.is_read && styles.titleUnread]}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
      </View>
      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.readAllText}>Read all</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 60 }} />}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={n => n.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔕</Text>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                Order updates, exclusive deals, and delivery alerts will appear here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: theme.colors.text.primary },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },
  unreadBadge: {
    backgroundColor: '#F5A826', borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  unreadBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  readAllText: { color: '#163D26', fontWeight: '600', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingVertical: 8, paddingHorizontal: 0, paddingBottom: 40 },

  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  notifUnread: { backgroundColor: '#163D2604' },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500', color: theme.colors.text.primary, marginBottom: 3 },
  titleUnread: { fontWeight: '700' },
  body: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18 },
  time: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F5A826', marginTop: 6 },

  empty: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22 },
});
