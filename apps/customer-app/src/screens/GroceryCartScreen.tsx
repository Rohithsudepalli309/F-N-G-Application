/**
 * GroceryCartScreen.tsx
 * Spec §8.1 #21 — Instamart / grocery cart (separate from food cart).
 * Displays grocery items, quantity controls, bill summary, and checkout.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import RazorpayCheckout from 'react-native-razorpay';
import { api } from '../services/api';
import { theme } from '../theme';
import { useGroceryCartStore } from '../store/useGroceryCartStore';

export const GroceryCartScreen = () => {
  const navigation = useNavigation<any>();
  const { items, updateQty, removeItem, clearCart, total } = useGroceryCartStore();
  const [loading, setLoading] = useState(false);

  // Direct access — no filter needed, this store is grocery-only
  const groceryItems = items;
  const cartTotal = total();
  const deliveryFee = cartTotal >= 19900 ? 0 : 2500; // Free above ₹199
  const handlingFee = 500; // ₹5 platform fee in paise
  const grandTotal = cartTotal + deliveryFee + handlingFee;

  const fmt = (paise: number) => `₹${(paise / 100).toFixed(0)}`;

  const handleCheckout = async () => {
    if (groceryItems.length === 0) return;
    setLoading(true);
    try {
      // 1. Create order on backend
      const { data: order } = await api.post('/orders', {
        type: 'grocery',
        items: groceryItems.map(i => ({
          id: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        totalAmount: grandTotal,
        deliveryFee,
      });

      if (!order?.razorpayOrderId) {
        // COD fallback
        navigation.replace('OrderConfirmed', {
          orderId: order.id ?? `FNG-GROC-${Date.now()}`,
          totalAmount: grandTotal / 100,
          eta: 30,
        });
        clearCart();
        return;
      }

      // 2. Open Razorpay
      const options = {
        description: 'F&G Instamart Order',
        image: 'https://i.ibb.co/your-logo',
        currency: 'INR',
        key: order.razorpayKeyId,
        amount: String(grandTotal),
        name: 'F&G Delivery',
        order_id: order.razorpayOrderId,
        prefill: { email: 'customer@fng.in', contact: '' },
        theme: { color: '#163D26' },
      };

      const paymentData = await RazorpayCheckout.open(options);
      await api.post('/payments/verify', {
        orderId: order.id,
        razorpayOrderId: paymentData.razorpay_order_id,
        razorpayPaymentId: paymentData.razorpay_payment_id,
        razorpaySignature: paymentData.razorpay_signature,
      });

      clearCart();
      navigation.replace('OrderConfirmed', {
        orderId: order.id,
        totalAmount: grandTotal / 100,
        eta: 30,
      });
    } catch (e: any) {
      if (e?.code !== 2) { // RZP dismiss = code 2
        Alert.alert('Payment Failed', e?.response?.data?.error ?? e?.description ?? 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (groceryItems.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Basket</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your basket is empty</Text>
          <Text style={styles.emptySubtitle}>Add grocery items to start your order</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('InstamartTab')}
          >
            <Text style={styles.shopBtnText}>Browse Instamart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Basket ({groceryItems.length} items)</Text>
        <TouchableOpacity onPress={() => Alert.alert('Clear basket?', 'Remove all items?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Delivery promise banner */}
      <View style={styles.promiseBanner}>
        <Text style={styles.promiseIcon}>⚡</Text>
        <Text style={styles.promiseText}>Delivery in <Text style={styles.promiseBold}>30 minutes</Text></Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Items list */}
        <View style={styles.itemsSection}>
          {groceryItems.map(item => (
            <View key={item.productId} style={styles.itemRow}>
              {item.image
                ? <Image source={{ uri: item.image }} style={styles.itemImage} />
                : <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                    <Text style={{ fontSize: 24 }}>🥦</Text>
                  </View>
              }
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>{fmt(item.price)}</Text>
              </View>
              <View style={styles.qtyControls}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => item.quantity <= 1
                    ? removeItem(item.productId)
                    : updateQty(item.productId, item.quantity - 1)
                  }
                >
                  <Text style={styles.qtyBtnText}>{item.quantity <= 1 ? '🗑' : '−'}</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQty(item.productId, item.quantity + 1)}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Bill breakdown */}
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items Total</Text>
            <Text style={styles.billValue}>{fmt(cartTotal)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, deliveryFee === 0 && styles.freeText]}>
              {deliveryFee === 0 ? 'FREE' : fmt(deliveryFee)}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling Fee</Text>
            <Text style={styles.billValue}>{fmt(handlingFee)}</Text>
          </View>
          {deliveryFee > 0 && (
            <View style={styles.freeShipHint}>
              <Text style={styles.freeShipText}>
                Add {fmt(19900 - cartTotal)} more for FREE delivery
              </Text>
            </View>
          )}
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>{fmt(grandTotal)}</Text>
          </View>
        </View>

        {/* Savings note */}
        {cartTotal > 0 && (
          <View style={styles.savingsBar}>
            <Text style={styles.savingsText}>🎉  You're saving on this order!</Text>
          </View>
        )}
      </ScrollView>

      {/* Checkout button */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View>
            <Text style={styles.totalDisplay}>{fmt(grandTotal)}</Text>
            <Text style={styles.totalSub}>Total incl. delivery</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]}
            onPress={handleCheckout}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.checkoutBtnText}>Proceed to Pay →</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },
  clearText: { color: '#DC3545', fontWeight: '600', fontSize: 14 },

  promiseBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', padding: 12, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#D1FAE5',
  },
  promiseIcon: { fontSize: 18 },
  promiseText: { fontSize: 14, color: '#163D26' },
  promiseBold: { fontWeight: '800' },

  itemsSection: {
    margin: 16, backgroundColor: theme.colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', padding: 14,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 12,
  },
  itemImage: { width: 60, height: 60, borderRadius: 10, resizeMode: 'cover' },
  itemImagePlaceholder: { backgroundColor: '#F0F4EF', alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#163D26' },

  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#163D26',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  qtyNum: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, minWidth: 20, textAlign: 'center' },

  billCard: {
    margin: 16, backgroundColor: theme.colors.surface, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  billTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 12 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  billLabel: { color: theme.colors.text.secondary, fontSize: 14 },
  billValue: { color: theme.colors.text.primary, fontSize: 14, fontWeight: '600' },
  freeText: { color: '#1A7A3C', fontWeight: '700' },
  freeShipHint: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 8, marginVertical: 4 },
  freeShipText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: 6, paddingTop: 10 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
  totalValue: { fontSize: 16, fontWeight: '800', color: '#163D26' },

  savingsBar: { margin: 16, marginTop: 0, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12 },
  savingsText: { color: '#163D26', fontWeight: '600', fontSize: 13, textAlign: 'center' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: theme.colors.background, padding: 16,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  bottomBarInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalDisplay: { fontSize: 20, fontWeight: '800', color: '#163D26' },
  totalSub: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  checkoutBtn: {
    backgroundColor: '#F5A826', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14,
  },
  checkoutBtnDisabled: { opacity: 0.6 },
  checkoutBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 24 },
  shopBtn: {
    backgroundColor: '#163D26', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14,
  },
  shopBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
