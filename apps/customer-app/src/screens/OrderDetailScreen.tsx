/**
 * OrderDetailScreen.tsx
 * Spec §8.1 #18 — Single order full detail view.
 * Shows items, timeline, agent info, bill breakdown, and action CTAs.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, ActivityIndicator, Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

const STATUS_COLOR: Record<string, string> = {
  pending:           '#F5A826',
  confirmed:         '#2563EB',
  accepted:          '#2563EB',
  preparing:         '#8B5CF6',
  ready_for_pickup:  '#059669',
  agent_assigned:    '#059669',
  picked_up:         '#059669',
  out_for_delivery:  '#059669',
  delivered:         '#163D26',
  cancelled:         '#DC3545',
};

const STATUS_LABEL: Record<string, string> = {
  pending:           'Awaiting Payment',
  confirmed:         'Order Confirmed',
  accepted:          'Restaurant Accepted',
  preparing:         'Preparing Your Food',
  ready_for_pickup:  'Ready for Pickup',
  agent_assigned:    'Agent Assigned',
  picked_up:         'Picked Up',
  out_for_delivery:  'Out for Delivery',
  delivered:         'Delivered',
  cancelled:         'Cancelled',
};

interface OrderItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderData {
  id: string;
  status: string;
  created_at: string;
  total_amount: number;
  delivery_fee: number;
  items: OrderItem[];
  restaurant?: { name: string; image_url?: string };
  agent?: { name: string; phone: string; vehicle: string };
  address?: { line1: string; city: string };
  payment_method?: string;
  coupon_discount?: number;
}

export const OrderDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = (route.params as { orderId: string }) || {};
  const orderId = params.orderId;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/orders/${orderId}`);
        setOrder(data);
      } catch (e) {
        console.error('[OrderDetail]', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Order not found.</Text>
      </View>
    );
  }

  const subtotal = order.items?.reduce((s, i) => s + i.total_price, 0) ?? order.total_amount;
  const canTrack = ['agent_assigned', 'picked_up', 'out_for_delivery'].includes(order.status);
  const canReview = order.status === 'delivered';
  const canCancel = ['pending', 'confirmed', 'accepted'].includes(order.status);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: STATUS_COLOR[order.status] + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[order.status] }]} />
          <Text style={[styles.statusLabel, { color: STATUS_COLOR[order.status] }]}>
            {STATUS_LABEL[order.status] ?? order.status}
          </Text>
        </View>

        {/* Restaurant + Order ID */}
        <View style={styles.card}>
          {order.restaurant?.image_url && (
            <Image source={{ uri: order.restaurant.image_url }} style={styles.restImage} />
          )}
          <Text style={styles.restName}>{order.restaurant?.name ?? 'F&G Store'}</Text>
          <Text style={styles.orderId}>Order ID: {order.id}</Text>
          <Text style={styles.orderDate}>
            {new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </Text>
        </View>

        {/* Items */}
        <Text style={styles.sectionTitle}>Items Ordered</Text>
        <View style={styles.card}>
          {(order.items ?? []).map((item, i) => (
            <View key={i} style={[styles.itemRow, i > 0 && styles.itemDivider]}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemQty}>{item.quantity}×</Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Text style={styles.itemPrice}>₹{(item.total_price / 100).toFixed(0)}</Text>
            </View>
          ))}
        </View>

        {/* Bill Breakdown */}
        <Text style={styles.sectionTitle}>Bill Breakdown</Text>
        <View style={styles.card}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>₹{(subtotal / 100).toFixed(0)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>
              {order.delivery_fee === 0 ? 'FREE' : `₹${(order.delivery_fee / 100).toFixed(0)}`}
            </Text>
          </View>
          {(order.coupon_discount ?? 0) > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: '#1A7A3C' }]}>Coupon Discount</Text>
              <Text style={[styles.billValue, { color: '#1A7A3C' }]}>
                -₹{((order.coupon_discount ?? 0) / 100).toFixed(0)}
              </Text>
            </View>
          )}
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Paid</Text>
            <Text style={styles.totalValue}>₹{(order.total_amount / 100).toFixed(0)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Payment Method</Text>
            <Text style={styles.billValue}>{order.payment_method?.toUpperCase() ?? 'UPI'}</Text>
          </View>
        </View>

        {/* Delivery Address */}
        {order.address && (
          <>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.card}>
              <Text style={styles.addressText}>
                {order.address.line1}{'\n'}{order.address.city}
              </Text>
            </View>
          </>
        )}

        {/* Agent Info */}
        {order.agent && (
          <>
            <Text style={styles.sectionTitle}>Delivery Agent</Text>
            <View style={[styles.card, styles.agentCard]}>
              <View style={styles.agentAvatar}>
                <Text style={styles.agentInitial}>{order.agent.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.agentName}>{order.agent.name}</Text>
                <Text style={styles.agentVehicle}>{order.agent.vehicle}</Text>
              </View>
              <View style={styles.agentPhoneBtn}>
                <Text style={styles.agentPhoneIcon}>📞</Text>
              </View>
            </View>
          </>
        )}

        {/* Action CTAs */}
        <View style={styles.actionsRow}>
          {canTrack && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryAction]}
              onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
            >
              <Text style={styles.primaryActionText}>Track Order</Text>
            </TouchableOpacity>
          )}
          {canReview && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryAction]}
              onPress={() => navigation.navigate('OrderReview', { orderId: order.id })}
            >
              <Text style={styles.primaryActionText}>Rate & Review</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity style={[styles.actionBtn, styles.cancelAction]}>
              <Text style={styles.cancelActionText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.actionBtn, styles.secondaryAction]}>
            <Text style={styles.secondaryActionText}>Get Help</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: theme.colors.text.secondary, fontSize: 15 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: theme.colors.text.primary },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },

  statusBanner: {
    flexDirection: 'row', alignItems: 'center', margin: 16,
    borderRadius: 12, padding: 14, gap: 10,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { fontSize: 15, fontWeight: '700' },

  card: {
    backgroundColor: theme.colors.surface, borderRadius: 14,
    marginHorizontal: 16, marginBottom: 4, padding: 16,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  restImage: { width: '100%', height: 120, borderRadius: 10, marginBottom: 10, resizeMode: 'cover' },
  restName: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
  orderId: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '500' },
  orderDate: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },

  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: theme.colors.text.secondary,
    marginHorizontal: 16, marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
  },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  itemDivider: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  itemQty: { color: theme.colors.accent, fontWeight: '800', fontSize: 14 },
  itemName: { color: theme.colors.text.primary, fontSize: 14, fontWeight: '500', flex: 1 },
  itemPrice: { color: theme.colors.text.primary, fontWeight: '700', fontSize: 14 },

  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  billLabel: { color: theme.colors.text.secondary, fontSize: 14 },
  billValue: { color: theme.colors.text.primary, fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 6, paddingTop: 10 },
  totalLabel: { color: theme.colors.text.primary, fontWeight: '700', fontSize: 16 },
  totalValue: { color: '#163D26', fontWeight: '800', fontSize: 16 },

  addressText: { color: theme.colors.text.primary, fontSize: 14, lineHeight: 22 },

  agentCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  agentAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#163D26',
    alignItems: 'center', justifyContent: 'center',
  },
  agentInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  agentName: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
  agentVehicle: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  agentPhoneBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#163D26',
    alignItems: 'center', justifyContent: 'center',
  },
  agentPhoneIcon: { fontSize: 18 },

  actionsRow: { margin: 16, gap: 10 },
  actionBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryAction: { backgroundColor: '#F5A826' },
  primaryActionText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelAction: { backgroundColor: '#FEE2E2' },
  cancelActionText: { color: '#DC3545', fontWeight: '700', fontSize: 15 },
  secondaryAction: { borderWidth: 1.5, borderColor: theme.colors.border },
  secondaryActionText: { color: theme.colors.text.secondary, fontWeight: '600', fontSize: 15 },
});
