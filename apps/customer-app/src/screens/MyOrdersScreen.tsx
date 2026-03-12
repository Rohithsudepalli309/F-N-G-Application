import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
  Dimensions, Image,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../services/api';
import { useCartStore } from '../store/useCartStore';
import { useGroceryCartStore } from '../store/useGroceryCartStore';

const { width } = Dimensions.get('window');

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  placed:    { label: 'Order Placed',     color: '#1565C0', bg: '#E3F2FD' },
  confirmed: { label: 'Confirmed',        color: '#2E7D32', bg: '#E8F5E9' },
  preparing: { label: 'Preparing',        color: '#F57F17', bg: '#FFF8E1' },
  ready:     { label: 'Ready',            color: '#6A1B9A', bg: '#F3E5F5' },
  pickup:    { label: 'Out for Delivery', color: '#00695C', bg: '#E0F2F1' },
  delivered: { label: 'Delivered',        color: '#1B5E20', bg: '#E8F5E9' },
  cancelled: { label: 'Cancelled',        color: '#C62828', bg: '#FFEBEE' },
  rejected:  { label: 'Rejected',         color: '#BF360C', bg: '#FBE9E7' },
};

const STATUS_IMG: Record<string, string> = {
  placed:    'https://img.icons8.com/color/96/overtime--v1.png',
  confirmed: 'https://img.icons8.com/color/96/checkmark--v1.png',
  preparing: 'https://img.icons8.com/color/96/cooking.png',
  ready:     'https://img.icons8.com/color/96/box--v1.png',
  pickup:    'https://img.icons8.com/color/96/motorcycle-delivery--v1.png',
  delivered: 'https://img.icons8.com/color/96/checked--v1.png',
  cancelled: 'https://img.icons8.com/color/96/cancel--v1.png',
  rejected:  'https://img.icons8.com/color/96/cancel--v1.png',
};

const FILTER_TABS = ['All', 'Active', 'Delivered', 'Cancelled'];

const isActive = (status: string) => ['placed','confirmed','preparing','ready','pickup'].includes(status);
const isDelivered = (status: string) => status === 'delivered';
const isCancelled = (status: string) => ['cancelled','rejected'].includes(status);

export const MyOrdersScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const addToCart = useCartStore(s => s.addToCart);
  const addGroceryItem = useGroceryCartStore(s => s.addItem);
  const updateGroceryQty = useGroceryCartStore(s => s.updateQty);

  const handleReorder = (order: any) => {
    if (order.type === 'grocery') {
      order.items?.forEach((item: any) => {
        const pid = String(item.product_id ?? item.id);
        addGroceryItem({ productId: pid, name: item.name, price: Number(item.price) });
        if (item.quantity > 1) updateGroceryQty(pid, item.quantity);
      });
      navigation.navigate('InstamartTab', { screen: 'GroceryCart' });
    } else {
      const sid = String(order.store_id ?? 'default');
      order.items?.forEach((item: any) => {
        addToCart(sid, { productId: String(item.product_id ?? item.id), name: item.name, price: Number(item.price), quantity: item.quantity });
      });
      navigation.navigate('HomeTab', { screen: 'Cart' });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch { setOrders([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { if (isFocused) fetchOrders(); }, [isFocused]);

  const filtered = useCallback(() => {
    if (filter === 'Active')    return orders.filter(o => isActive(o.status));
    if (filter === 'Delivered') return orders.filter(o => isDelivered(o.status));
    if (filter === 'Cancelled') return orders.filter(o => isCancelled(o.status));
    return orders;
  }, [orders, filter]);

  const stats = {
    total:     orders.length,
    active:    orders.filter(o => isActive(o.status)).length,
    delivered: orders.filter(o => isDelivered(o.status)).length,
  };

  const EmptyState = () => (
    <View style={s.empty}>
      <Image source={{ uri: 'https://img.icons8.com/color/96/shopping-cart--v1.png' }} style={s.emptyImg} resizeMode="contain" />
      <Text style={s.emptyTitle}>No orders yet</Text>
      <Text style={s.emptySub}>
        {filter === 'All'
          ? "You haven't placed any orders yet.\nStart shopping to see them here!"
          : `No ${filter.toLowerCase()} orders found.`}
      </Text>
      {filter === 'All' && (
        <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('HomeTab')}>
          <Text style={s.emptyBtnText}>Start Shopping</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Orders</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>{stats.total}</Text>
        </View>
      </View>

      {/* Stats row */}
      {orders.length > 0 && (
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: '#E8F5E9' }]}>
            <Text style={s.statNum}>{stats.total}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: '#FFF8E1' }]}>
            <Text style={s.statNum}>{stats.active}</Text>
            <Text style={s.statLabel}>Active</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: '#E3F2FD' }]}>
            <Text style={s.statNum}>{stats.delivered}</Text>
            <Text style={s.statLabel}>Delivered</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: '#F5F5F5' }]}>
            <Text style={s.statNum}>
              {stats.total > 0 ? '\u20B9' + Math.round(orders.reduce((a, o) => a + (o.total_amount || 0), 0) / 100 / (stats.total || 1)).toLocaleString('en-IN') : '0'}
            </Text>
            <Text style={s.statLabel}>Avg/Order</Text>
          </View>
        </View>
      )}

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersScroll} contentContainerStyle={s.filtersContent}>
        {FILTER_TABS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterTab, filter === f && s.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[s.filterTabText, filter === f && s.filterTabTextActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={s.loaderText}>Loading orders…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, filtered().length === 0 && { flex: 1 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} colors={[theme.colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {filtered().length === 0 ? (
            <EmptyState />
          ) : (
            filtered().map(order => {
              const meta = STATUS_META[order.status] || STATUS_META['placed'];
              const live = isActive(order.status);
              return (
                <TouchableOpacity
                  key={order.id}
                  style={[s.card, live && s.cardLive]}
                  onPress={() => live
                    ? navigation.navigate('OrderTracking', { orderId: order.id })
                    : navigation.navigate('OrderDetail', { orderId: order.id })
                  }
                  activeOpacity={0.85}
                >
                  {/* Card top */}
                  <View style={s.cardTop}>
                    <View style={[s.statusEmojiBg, { backgroundColor: meta.bg }]}>
                      <Image
                        source={{ uri: STATUS_IMG[order.status] ?? STATUS_IMG.placed }}
                        style={s.statusImg}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={s.cardTopMid}>
                      <View style={s.cardTopRow}>
                        <View style={[s.statusPill, { backgroundColor: meta.bg }]}>
                          <Text style={[s.statusPillText, { color: meta.color }]}>{meta.label}</Text>
                        </View>
                        {live && (
                          <View style={s.livePill}>
                            <View style={s.liveDot} />
                            <Text style={s.liveTxt}>LIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.orderId}>
                        Order #{String(order.id).slice(-8).toUpperCase()}
                      </Text>
                    </View>
                    <View style={s.cardTopRight}>
                      <Text style={s.amount}>
                        {'\u20B9'}{((order.total_amount || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </Text>
                      <Text style={s.date}>
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Items */}
                  <View style={s.itemsRow}>
                    <View style={[s.typeBadge, order.type === 'grocery' ? s.typeBG : s.typeFD]}>
                      <Text style={s.typeText}>{order.type === 'grocery' ? 'Grocery' : 'Food'}</Text>
                    </View>
                    <Text style={s.itemsList} numberOfLines={1}>
                      {order.items?.map((i: any) => i.name).slice(0, 3).join(' · ') || 'No items'}
                      {(order.items?.length || 0) > 3 ? ` +${(order.items?.length || 0) - 3} more` : ''}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={s.actions}>
                    {!isCancelled(order.status) && (
                      <TouchableOpacity style={s.reorderBtn} onPress={() => handleReorder(order)}>
                        <Text style={s.reorderText}>↩ Reorder</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={s.detailBtn}
                      onPress={() => live
                        ? navigation.navigate('OrderTracking', { orderId: order.id })
                        : navigation.navigate('OrderDetail', { orderId: order.id })
                      }
                    >
                      <Text style={s.detailText}>{live ? '→ Track Order' : 'View Details'}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEB' },
  headerTitle:  { fontSize: 22, fontWeight: '900', color: '#0D1B14', flex: 1, letterSpacing: -0.5 },
  headerBadge:  { backgroundColor: theme.colors.primary, minWidth: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  headerBadgeText:{ color: '#FFF', fontSize: 13, fontWeight: '900' },

  statsRow:   { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10, backgroundColor: '#FFF' },
  statCard:   { flex: 1, borderRadius: 12, padding: 10, alignItems: 'center' },
  statNum:    { fontSize: 18, fontWeight: '900', color: '#0D1B14' },
  statLabel:  { fontSize: 10, color: '#666', marginTop: 3, fontWeight: '600' },

  filtersScroll:  { maxHeight: 46, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEB' },
  filtersContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  filterTab:      { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD', backgroundColor: '#FFF' },
  filterTabActive:{ backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterTabText:  { fontSize: 12, fontWeight: '600', color: '#666' },
  filterTabTextActive:{ color: '#FFF' },

  scroll: { padding: 16 },

  loader:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: '#9E9E9E', fontSize: 13 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyImg: { width: 72, height: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0D1B14', marginBottom: 8 },
  emptySub:   { fontSize: 14, color: '#9E9E9E', textAlign: 'center', lineHeight: 21 },
  emptyBtn:   { marginTop: 24, backgroundColor: theme.colors.primary, paddingHorizontal: 32, paddingVertical: 13, borderRadius: 30 },
  emptyBtnText:{ color: '#FFF', fontSize: 14, fontWeight: '800' },

  card:         { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EBEBEB', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardLive:     { borderColor: theme.colors.primary, borderWidth: 1.5 },

  cardTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  statusEmojiBg:{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusImg:    { width: 26, height: 26 },
  cardTopMid:   { flex: 1 },
  cardTopRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  statusPill:   { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText:{ fontSize: 11, fontWeight: '800' },
  livePill:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D32F2F' },
  liveTxt:      { fontSize: 10, fontWeight: '900', color: '#D32F2F' },
  orderId:      { fontSize: 12, color: '#9E9E9E', fontWeight: '600' },
  cardTopRight: { alignItems: 'flex-end' },
  amount:       { fontSize: 16, fontWeight: '900', color: '#0D1B14' },
  date:         { fontSize: 11, color: '#9E9E9E', marginTop: 4 },

  itemsRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  typeBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  typeBG:     { backgroundColor: '#E8F5E9' },
  typeFD:     { backgroundColor: '#FFF8E1' },
  typeText:   { fontSize: 10, fontWeight: '700', color: '#333' },
  itemsList:  { flex: 1, fontSize: 12, color: '#555', fontWeight: '500' },

  actions:    { flexDirection: 'row', gap: 10 },
  reorderBtn: { flex: 1, borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  reorderText:{ fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  detailBtn:  { flex: 1, backgroundColor: theme.colors.primary, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  detailText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
});
