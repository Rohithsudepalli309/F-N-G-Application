/**
 * HomeScreen.tsx — Online/Offline toggle + available order queue.
 *
 * ONLINE STATE: stored locally in auth store. Backend is notified via
 * PATCH /driver/status when toggled so the dispatcher can route orders.
 *
 * ORDER QUEUE: polled every POLL_INTERVAL_MS when online. Socket.IO
 * `driver:order_assigned` events can also push an order directly into
 * the active order store — the Active tab will then show the order.
 *
 * ACCEPT / REJECT: calls POST /driver/accept/:id or /driver/reject/:id.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import api from '../services/api';
import {useAuthStore} from '../store/useAuthStore';
import {useOrderStore, type AvailableOrder} from '../store/useOrderStore';
import {connectSocket} from '../services/socket';

const POLL_INTERVAL_MS = 15_000;

export default function HomeScreen(): React.JSX.Element {
  const tabBarHeight = useBottomTabBarHeight();
  const {driver, setOnline} = useAuthStore();
  const {available, setAvailable, removeAvailable, setActiveOrder} = useOrderStore();
  const [loading, setLoading] = useState(false);

  const isOnline = driver?.isOnline ?? false;

  // ── Fetch available orders ───────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    if (!isOnline) {
      setAvailable([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get<{orders: AvailableOrder[]}>('/driver/orders');
      setAvailable(res.data.orders);
    } catch {
      // silently fail on poll; user can pull-to-refresh
    } finally {
      setLoading(false);
    }
  }, [isOnline, setAvailable]);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  // ── Toggle online / offline ──────────────────────────────────────────
  async function handleToggleOnline(value: boolean): Promise<void> {
    try {
      await api.patch('/driver/status', {isOnline: value});
      setOnline(value);
      if (value) {
        connectSocket();
        fetchOrders();
      } else {
        setAvailable([]);
      }
    } catch {
      Alert.alert('Error', 'Could not update status. Check your connection.');
    }
  }

  // ── Accept order ─────────────────────────────────────────────────────
  async function handleAccept(order: AvailableOrder): Promise<void> {
    try {
      const res = await api.post<{order: object}>(`/driver/accept/${order.id}`);
      removeAvailable(order.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setActiveOrder(res.data.order as any);
    } catch (e: unknown) {
      const msg = (e as {response?: {data?: {error?: string}}}).response?.data?.error ?? 'Could not accept order.';
      Alert.alert('Error', msg);
    }
  }

  // ── Reject order ─────────────────────────────────────────────────────
  async function handleReject(orderId: number): Promise<void> {
    try {
      await api.post(`/driver/reject/${orderId}`);
      removeAvailable(orderId);
    } catch {/* ignore */}
  }

  // ── Render order card ─────────────────────────────────────────────────
  function renderOrder({item}: {item: AvailableOrder}): React.JSX.Element {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.storeName}>{item.storeName}</Text>
          <Text style={styles.payout}>₹{(item.driverPayout / 100).toFixed(0)}</Text>
        </View>
        <Text style={styles.meta}>
          {item.itemCount} item{item.itemCount !== 1 ? 's' : ''} · {item.estimatedKm.toFixed(1)} km
        </Text>
        <Text style={styles.address} numberOfLines={1}>{item.deliveryAddress}</Text>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => handleReject(item.id)}
            accessibilityRole="button">
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            onPress={() => handleAccept(item)}
            accessibilityRole="button">
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Status toggle ── */}
      <View style={styles.statusBar}>
        <View>
          <Text style={styles.statusLabel}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </Text>
          <Text style={styles.statusSub}>
            {isOnline ? 'Ready to receive orders' : 'You are not receiving orders'}
          </Text>
        </View>
        <Switch
          value={isOnline}
          onValueChange={handleToggleOnline}
          trackColor={{false: '#D1D5DB', true: '#FDBA74'}}
          thumbColor={isOnline ? '#F97316' : '#9CA3AF'}
          accessibilityLabel="Toggle online status"
        />
      </View>

      {/* ── Order list ── */}
      {loading && available.length === 0 ? (
        <ActivityIndicator style={styles.spinner} color="#F97316" />
      ) : (
        <FlatList
          data={available}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrder}
          contentContainerStyle={{paddingBottom: tabBarHeight + 16, paddingHorizontal: 16}}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchOrders} tintColor="#F97316" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {isOnline ? 'No orders nearby right now.' : 'Go online to see orders.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:   {flex: 1, backgroundColor: '#F9FAFB'},
  statusBar:   {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, marginBottom: 8, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4},
  statusLabel: {fontSize: 16, fontWeight: '600', color: '#111827'},
  statusSub:   {fontSize: 12, color: '#6B7280', marginTop: 2},
  spinner:     {marginTop: 48},
  card:        {backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8},
  cardHeader:  {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4},
  storeName:   {fontSize: 15, fontWeight: '600', color: '#111827'},
  payout:      {fontSize: 16, fontWeight: '700', color: '#16A34A'},
  meta:        {fontSize: 12, color: '#6B7280', marginBottom: 4},
  address:     {fontSize: 13, color: '#374151', marginBottom: 12},
  actions:     {flexDirection: 'row', gap: 10},
  actionBtn:   {flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center'},
  rejectBtn:   {backgroundColor: '#FEE2E2'},
  rejectText:  {color: '#DC2626', fontWeight: '600'},
  acceptBtn:   {backgroundColor: '#F97316'},
  acceptText:  {color: '#fff', fontWeight: '600'},
  empty:       {flex: 1, alignItems: 'center', marginTop: 80},
  emptyText:   {fontSize: 15, color: '#9CA3AF'},
});
