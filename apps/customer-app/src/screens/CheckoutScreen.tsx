import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Platform,
  TextInput,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCartStore } from '../store/useCartStore';
import { api } from '../services/api';
import { theme } from '../theme';

interface DeliveryAddress {
  id?: string;
  label: string;
  address_line: string;
  city: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
}

const DELIVERY_SLOTS = [
  { id: 'asap',  label: 'ASAP (~30 min)' },
  { id: '45min', label: 'In ~45 min' },
  { id: '60min', label: 'In ~60 min' },
];

const PAYMENT_METHODS = [
  { id: 'paytm', name: 'Paytm', icon: 'https://cdn-icons-png.flaticon.com/512/825/825454.png' },
  { id: 'phonepe', name: 'PhonePe', icon: 'https://img.icons8.com/color/452/phone-pe.png' },
  { id: 'gpay', name: 'Google Pay', icon: 'https://cdn-icons-png.flaticon.com/512/6124/6124998.png' },
  { id: 'upi', name: 'Other BHIM UPI', icon: 'https://cdn-icons-png.flaticon.com/512/3034/3034601.png' },
];

export const CheckoutScreen = () => {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('paytm');
  const [isCOD, setIsCOD] = useState(false);
  const [isWallet, setIsWallet] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [deliverySlot, setDeliverySlot] = useState('asap');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const { items, storeId, clearCart, total } = useCartStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Pick up address returned from SavedAddressesScreen
  useEffect(() => {
    if (route.params?.selectedAddress) {
      setDeliveryAddress(route.params.selectedAddress);
    }
  }, [route.params?.selectedAddress]);

  // Fetch wallet balance on mount
  useEffect(() => {
    api.get('/wallet/balance')
      .then(({ data }) => setWalletBalance(Number(data.balance ?? 0)))
      .catch(() => {})
      .finally(() => setWalletLoading(false));
  }, []);

  const billTotal = total() / 100;
  const deliveryFee = billTotal > 500 ? 0 : 25;
  const handlingFee = 5;
  const grandTotal = billTotal + deliveryFee + handlingFee - couponDiscount;

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    try {
      setApplyingCoupon(true);
      setCouponError('');
      const { data } = await api.post('/coupons/validate', {
        code,
        orderTotal: Math.round(billTotal * 100),
      });
      setCouponDiscount(data.discount / 100);
    } catch (e: any) {
      setCouponDiscount(0);
      setCouponError(e?.response?.data?.error ?? 'Invalid or expired coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    setCouponError('');
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress) {
      Alert.alert('No Address', 'Please select a delivery address before placing your order.');
      return;
    }
    setLoading(true);

    try {
      // 1. Create Internal Order on Backend
      const paymentMethod = isWallet ? 'wallet' : isCOD ? 'cod' : 'online';
      const orderPayload = {
        storeId: storeId ? Number(storeId) : undefined,
        items: items.map(i => ({ productId: Number(i.productId), quantity: i.quantity })),
        deliveryAddress: deliveryAddress
          ? {
              label: deliveryAddress.label,
              address_line: deliveryAddress.address_line,
              city: deliveryAddress.city,
              pincode: deliveryAddress.pincode,
              ...(deliveryAddress.lat != null ? { lat: deliveryAddress.lat } : {}),
              ...(deliveryAddress.lng != null ? { lng: deliveryAddress.lng } : {}),
            }
          : { label: 'Home', address_line: 'Not provided', city: '', pincode: '' },
        paymentMethod,
        deliverySlot,
        couponCode: couponDiscount > 0 ? couponCode.trim().toUpperCase() : undefined,
      };

      const { data: orderResponse } = await api.post('/orders', orderPayload);
      const internalOrder = orderResponse.order; // { id, orderNumber, ... }
      
      // C-1: Wallet payment — server deducts balance, no Razorpay needed
      if (isWallet) {
        Alert.alert('Order Placed!', 'Payment deducted from your F&G Wallet.');
        clearCart();
        navigation.navigate('OrderConfirmed', { orderId: internalOrder.id, totalAmount: grandTotal, eta: 30 });
        return;
      }

      if (isCOD) {
        // Handle COD flow (Status would likely be 'Placed' directly in a real COD flow)
        // But for this demo, we'll just navigate
        Alert.alert('Order Placed!', 'Your order has been received. Pay cash on delivery.');
        clearCart();
        navigation.navigate('OrderConfirmed', { orderId: internalOrder.id, totalAmount: grandTotal, eta: 30 });
        return;
      }

      // 2. Create Razorpay Order on Backend (Linked to internal ID)
      const { data: paymentOrder } = await api.post('/payments/orders', {
        orderId: internalOrder.id  // amount is taken server-side from order.total_amount
      });

      // 3. Trigger Razorpay Checkout
      const options = {
        description: 'F&G Grocery Order',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: paymentOrder.currency,
        key: paymentOrder.key_id,
        amount: paymentOrder.amount,
        name: 'F&G Delivery',
        order_id: paymentOrder.order_id,
        theme: { color: theme.colors.primary }
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        try {
          await api.post('/payments/verify', {
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
            orderId: internalOrder.id,
          });
        } catch {
          // Verification failed — warn but continue; webhook will handle it
          console.warn('[Checkout] Client-side payment verification failed — webhook fallback active');
        }
        clearCart();
        navigation.navigate('OrderConfirmed', { orderId: internalOrder.id, totalAmount: grandTotal, eta: 30 });
      }).catch((error: any) => {
        Alert.alert('Payment Cancelled', 'You can try paying again from My Orders if needed.');
      });

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || 'Something went wrong while placing your order.';
      Alert.alert('Order Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Total Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total to pay</Text>
          <Text style={styles.amountValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
        </View>

        {/* F&G Wallet */}
        <Text style={styles.sectionTitle}>F&G Wallet</Text>
        <TouchableOpacity
          style={[styles.paymentBox, isWallet && styles.payRowActive]}
          onPress={() => { setIsWallet(true); setIsCOD(false); }}
        >
          <View style={styles.payRow}>
            <View style={styles.payLeft}>
              <View style={[styles.codIconBox, { backgroundColor: '#E8F5E9' }]}>
                <Image source={{ uri: 'https://img.icons8.com/color/96/coins--v1.png' }} style={{ width: 18, height: 18 }} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.payName}>F&G Wallet</Text>
                <Text style={{ fontSize: 11, color: '#666' }}>
                  {walletLoading ? 'Loading…' : `Balance: ₹${(walletBalance / 100).toLocaleString('en-IN')}`}
                </Text>
              </View>
            </View>
            <View style={[styles.radio, isWallet && styles.radioActive]}>
              {isWallet && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>

        {/* UPI Options */}
        <Text style={styles.sectionTitle}>UPI Options</Text>
        <View style={styles.paymentBox}>
          {PAYMENT_METHODS.map((method) => (
            <TouchableOpacity 
              key={method.id} 
              style={[styles.payRow, selectedMethod === method.id && !isCOD && styles.payRowActive]}
              onPress={() => {
                setSelectedMethod(method.id);
                setIsCOD(false);
                setIsWallet(false);
              }}
            >
              <View style={styles.payLeft}>
                 <Image source={{ uri: method.icon }} style={styles.payIcon} />
                 <Text style={styles.payName}>{method.name}</Text>
              </View>
              <View style={[styles.radio, selectedMethod === method.id && !isCOD && styles.radioActive]}>
                 {selectedMethod === method.id && !isCOD && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cash on Delivery */}
        <Text style={styles.sectionTitle}>More Payment Options</Text>
        <TouchableOpacity
          style={[styles.paymentBox, isCOD && styles.payRowActive]}
          onPress={() => { setIsCOD(true); setIsWallet(false); }}
        >
          <View style={styles.payRow}>
            <View style={styles.payLeft}>
               <View style={styles.codIconBox}>
                  <Image source={{ uri: 'https://img.icons8.com/color/96/banknotes--v1.png' }} style={{ width: 18, height: 18 }} resizeMode="contain" />
               </View>
               <Text style={styles.payName}>Cash on Delivery</Text>
            </View>
            <View style={[styles.radio, isCOD && styles.radioActive]}>
               {isCOD && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>

        {/* Delivery Time Slot (C-4) */}
                <Text style={styles.sectionTitle}>Delivery Time</Text>
                <View style={[styles.paymentBox, { flexDirection: 'row', gap: 8 }]}>
                  {DELIVERY_SLOTS.map(slot => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[
                        { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5,
                          borderColor: deliverySlot === slot.id ? theme.colors.primary : '#E0E0E0',
                          backgroundColor: deliverySlot === slot.id ? '#FFF8F0' : '#FFF',
                          alignItems: 'center' },
                      ]}
                      onPress={() => setDeliverySlot(slot.id)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700',
                        color: deliverySlot === slot.id ? theme.colors.primary : '#555' }}>
                        {slot.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Coupon Code */}
                <Text style={styles.sectionTitle}>Have a Coupon?</Text>
        <View style={styles.couponBox}>
          {couponDiscount > 0 ? (
            <View style={styles.couponApplied}>
              <View style={styles.couponAppliedLeft}>
                <Image source={{ uri: 'https://img.icons8.com/color/96/discount--v1.png' }} style={styles.couponAppliedImg} resizeMode="contain" />
                <View>
                  <Text style={styles.couponAppliedCode}>{couponCode.trim().toUpperCase()}</Text>
                  <Text style={styles.couponAppliedSaving}>Saving ₹{couponDiscount.toLocaleString('en-IN')}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} style={styles.couponRemoveBtn}>
                <Text style={styles.couponRemoveText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInputRow}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor="#AAA"
                value={couponCode}
                onChangeText={(t) => { setCouponCode(t); setCouponError(''); }}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleApplyCoupon}
              />
              <TouchableOpacity
                style={[styles.couponApplyBtn, (!couponCode.trim() || applyingCoupon) && styles.couponApplyBtnDisabled]}
                onPress={handleApplyCoupon}
                disabled={!couponCode.trim() || applyingCoupon}
              >
                {applyingCoupon
                  ? <ActivityIndicator color="#FFF" size="small" />
                  : <Text style={styles.couponApplyBtnText}>Apply</Text>
                }
              </TouchableOpacity>
            </View>
          )}
          {couponError !== '' && <Text style={styles.couponErrorText}>{couponError}</Text>}
        </View>

        {/* Delivery Address */}
        <View style={styles.addressSection}>
          <View style={styles.addressHeader}>
            <Text style={styles.sectionTitle}>Delivering to</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}
            >
              <Text style={styles.changeLink}>Change</Text>
            </TouchableOpacity>
          </View>
          {deliveryAddress ? (
            <View style={styles.addressCard}>
              <Text style={styles.addressHome}>{deliveryAddress.label}</Text>
              <Text style={styles.addressText}>
                {deliveryAddress.address_line}, {deliveryAddress.city} — {deliveryAddress.pincode}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addAddressBtn}
              onPress={() => navigation.navigate('SavedAddresses', { selectMode: true })}
            >
              <Text style={styles.addAddressBtnText}>＋  Add a delivery address</Text>
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.payBtn} 
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <View style={styles.payBtnContent}>
                <Text style={styles.payBtnText}>
                   {isCOD ? 'Place Order (COD)' : `Pay via ${PAYMENT_METHODS.find(m => m.id === selectedMethod)?.name}`}
                </Text>
                <Text style={styles.payBtnArrow}>→</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backArrow: {
    fontSize: 24,
    color: '#000',
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 196,
  },
  amountCard: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  amountLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#333',
    marginBottom: 12,
  },
  paymentBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FB',
  },
  payRowActive: {
    backgroundColor: '#F0F9F0',
  },
  payLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    resizeMode: 'contain',
  },
  payName: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#333',
  },
  codIconBox: {
    width: 24,
    height: 24,
    backgroundColor: '#F0F4F7',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#339233',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#339233',
  },
  addressSection: { marginTop: 8 },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  changeLink: {
    fontSize: 13,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  addressCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  addressHome: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  addAddressBtn: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addAddressBtnText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
  },
  couponBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  couponInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponInput: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#000',
    fontFamily: theme.typography.fontFamily.medium,
    backgroundColor: '#FAFAFA',
  },
  couponApplyBtn: {
    height: 44,
    paddingHorizontal: 18,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponApplyBtnDisabled: {
    opacity: 0.5,
  },
  couponApplyBtnText: {
    color: '#FFF',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
  },
  couponErrorText: {
    color: '#DC3545',
    fontSize: 12,
    marginTop: 8,
  },
  couponApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponAppliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponAppliedImg: {
    width: 24,
    height: 24,
  },
  couponAppliedCode: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#2E7D32',
  },
  couponAppliedSaving: {
    fontSize: 12,
    color: '#2E7D32',
    marginTop: 2,
  },
  couponRemoveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  couponRemoveText: {
    color: '#DC3545',
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
  },
  footer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 0 : 62,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  payBtn: {
    backgroundColor: '#339233',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  payBtnContent: {
      flexDirection: 'row',
      alignItems: 'center',
  },
  payBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    marginRight: 8,
  },
  payBtnArrow: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
  },
});
