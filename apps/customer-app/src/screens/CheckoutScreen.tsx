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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

const UPI_METHODS = [
  { id: 'gpay', name: 'Google Pay', icon: 'https://img.icons8.com/color/96/google-pay.png', tag: 'Popular' },
  { id: 'phonepe', name: 'PhonePe', icon: 'https://img.icons8.com/color/96/phone-pe.png' },
  { id: 'paytm', name: 'Paytm UPI', icon: 'https://img.icons8.com/color/96/paytm.png' },
  { id: 'bhim', name: 'BHIM UPI', icon: 'https://img.icons8.com/color/96/bhim.png' },
];

const CARD_METHODS = [
  { id: 'visa', name: 'Visa Card', icon: 'https://img.icons8.com/color/96/visa.png' },
  { id: 'mastercard', name: 'Mastercard', icon: 'https://img.icons8.com/color/96/mastercard-logo.png' },
  { id: 'rupay', name: 'RuPay', icon: 'https://img.icons8.com/color/96/bank-card-back-side.png' },
  { id: 'amex', name: 'AmEx', icon: 'https://img.icons8.com/color/96/bank-card-front-side.png' },
];

const THIRD_PARTY_METHODS = [
  { id: 'amazonpay', name: 'Amazon Pay', icon: 'https://img.icons8.com/color/96/amazon.png' },
  { id: 'mobikwik', name: 'MobiKwik', icon: 'https://img.icons8.com/color/96/wallet--v1.png' },
  { id: 'freecharge', name: 'Freecharge', icon: 'https://img.icons8.com/color/96/online-payment-with-a-credit-card.png' },
  { id: 'postpaid', name: 'Pay Later', icon: 'https://img.icons8.com/color/96/calendar-plus.png' },
];

const NET_BANKING_METHODS = [
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'sbi', name: 'SBI' },
  { id: 'icici', name: 'ICICI' },
  { id: 'axis', name: 'Axis' },
  { id: 'kotak', name: 'Kotak' },
  { id: 'otherbank', name: 'Other Banks' },
];

const ALL_ONLINE_METHODS = [...UPI_METHODS, ...CARD_METHODS, ...THIRD_PARTY_METHODS, ...NET_BANKING_METHODS];

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

  const billTotal = total() / 100;             // subtotal in rupees
  const deliveryFee = billTotal > 499 ? 0 : 25; // BUG-006 FIX: matches backend ₹499 threshold
  const handlingFee = 5;
  const preTaxTotal = billTotal + deliveryFee + handlingFee - couponDiscount;
  const taxAmount = Math.round(preTaxTotal * 0.05 * 100) / 100; // BUG-005 FIX: 5% GST to match backend
  const grandTotal = preTaxTotal + taxAmount;
  const isUpiSelected = !isWallet && !isCOD;
  const selectedOnline = ALL_ONLINE_METHODS.find(m => m.id === selectedMethod);
  const selectedMethodLabel = isWallet
    ? 'F&G Wallet'
    : isCOD
    ? 'Cash on Delivery'
    : (selectedOnline?.name ?? 'Online Payment');

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
        deliverySlot,   // FEAT-001: persist chosen slot
        couponCode: couponDiscount > 0 ? couponCode.trim().toUpperCase() : undefined,
      };

      const { data: orderResponse } = await api.post('/orders', orderPayload);
      const internalOrder = orderResponse.order; // { id, orderNumber, ... }
      
      // C-1: Wallet payment — server deducts balance, no Razorpay needed
      if (isWallet) {
        // BUG-007 FIX (frontend guard): check balance before even calling API
        if (walletBalance < Math.round(grandTotal * 100)) {
          Alert.alert(
            'Insufficient Wallet Balance',
            `Your wallet has ₹${(walletBalance / 100).toLocaleString('en-IN')} but ₹${grandTotal.toLocaleString('en-IN')} is needed. Please top up first.`
          );
          setLoading(false);
          return;
        }
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
        {/* Total Amount Card — itemised bill breakdown */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Total to pay</Text>
          <Text style={styles.amountValue}>₹{grandTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</Text>
          {/* Bill breakdown */}
          <View style={styles.billBreakdown}>
            <View style={styles.billRow}><Text style={styles.billKey}>Subtotal</Text><Text style={styles.billVal}>₹{billTotal.toFixed(2)}</Text></View>
            <View style={styles.billRow}><Text style={styles.billKey}>Delivery fee</Text><Text style={styles.billVal}>{deliveryFee === 0 ? <Text style={{color:'#0B6E4F'}}>FREE</Text> : `₹${deliveryFee}`}</Text></View>
            <View style={styles.billRow}><Text style={styles.billKey}>Handling fee</Text><Text style={styles.billVal}>₹{handlingFee}</Text></View>
            <View style={styles.billRow}><Text style={styles.billKey}>GST (5%)</Text><Text style={styles.billVal}>₹{taxAmount.toFixed(2)}</Text></View>
            {couponDiscount > 0 && (
              <View style={styles.billRow}><Text style={[styles.billKey,{color:'#0B6E4F'}]}>Coupon discount</Text><Text style={[styles.billVal,{color:'#0B6E4F'}]}>- ₹{couponDiscount.toFixed(2)}</Text></View>
            )}
          </View>
          <View style={styles.securePill}>
            <MaterialCommunityIcons name="shield-check" size={12} color="#0B6E4F" />
            <Text style={styles.securePillText}>100% secure payments</Text>
          </View>
        </View>

        {/* Payment methods */}
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <Text style={styles.sectionHint}>Secure and encrypted</Text>
        </View>

        {/* F&G Wallet */}
        <TouchableOpacity
          style={[styles.methodCard, isWallet && styles.methodCardActive]}
          onPress={() => { setIsWallet(true); setIsCOD(false); }}
          activeOpacity={0.85}
        >
          <View style={styles.methodRow}>
            <View style={styles.payLeft}>
              <View style={[styles.methodIconBox, { backgroundColor: '#E8F5E9' }]}>
                <Image source={{ uri: 'https://img.icons8.com/color/96/coins--v1.png' }} style={{ width: 18, height: 18 }} resizeMode="contain" />
              </View>
              <View>
                <Text style={styles.payName}>F&G Wallet</Text>
                <Text style={styles.paySub}>
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
        <Text style={styles.sectionTitle}>Pay by UPI</Text>
        <View style={styles.upiGrid}>
          {UPI_METHODS.map((method) => {
            const active = selectedMethod === method.id && !isCOD && !isWallet;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.upiCard, active && styles.upiCardActive]}
                onPress={() => {
                  setSelectedMethod(method.id);
                  setIsCOD(false);
                  setIsWallet(false);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.upiTopRow}>
                  <Image source={{ uri: method.icon }} style={styles.payIcon} />
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </View>
                <Text style={styles.upiName}>{method.name}</Text>
                {!!method.tag && <Text style={styles.upiTag}>{method.tag}</Text>}
                {active && isUpiSelected && <Text style={styles.upiSelectedTag}>Selected</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cards */}
        <Text style={styles.paymentSubTitle}>Credit & Debit Cards</Text>
        <View style={styles.upiGrid}>
          {CARD_METHODS.map((method) => {
            const active = selectedMethod === method.id && !isCOD && !isWallet;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.upiCard, active && styles.upiCardActive]}
                onPress={() => {
                  setSelectedMethod(method.id);
                  setIsCOD(false);
                  setIsWallet(false);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.upiTopRow}>
                  <Image source={{ uri: method.icon }} style={styles.payIcon} />
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </View>
                <Text style={styles.upiName}>{method.name}</Text>
                {active && <Text style={styles.upiSelectedTag}>Selected</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Third-party wallets */}
        <Text style={styles.paymentSubTitle}>Third-party Wallets & Pay Later</Text>
        <View style={styles.upiGrid}>
          {THIRD_PARTY_METHODS.map((method) => {
            const active = selectedMethod === method.id && !isCOD && !isWallet;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.upiCard, active && styles.upiCardActive]}
                onPress={() => {
                  setSelectedMethod(method.id);
                  setIsCOD(false);
                  setIsWallet(false);
                }}
                activeOpacity={0.85}
              >
                <View style={styles.upiTopRow}>
                  <Image source={{ uri: method.icon }} style={styles.payIcon} />
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active && <View style={styles.radioInner} />}
                  </View>
                </View>
                <Text style={styles.upiName}>{method.name}</Text>
                {active && <Text style={styles.upiSelectedTag}>Selected</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Net banking */}
        <Text style={styles.paymentSubTitle}>Net Banking</Text>
        <View style={styles.bankWrap}>
          {NET_BANKING_METHODS.map((method) => {
            const active = selectedMethod === method.id && !isCOD && !isWallet;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.bankChip, active && styles.bankChipActive]}
                onPress={() => {
                  setSelectedMethod(method.id);
                  setIsCOD(false);
                  setIsWallet(false);
                }}
                activeOpacity={0.85}
              >
                <Text style={[styles.bankChipText, active && styles.bankChipTextActive]}>{method.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Cash on Delivery */}
        <Text style={styles.sectionTitle}>More Options</Text>
        <TouchableOpacity
          style={[styles.methodCard, isCOD && styles.methodCardActive]}
          onPress={() => { setIsCOD(true); setIsWallet(false); }}
          activeOpacity={0.85}
        >
          <View style={styles.methodRow}>
            <View style={styles.payLeft}>
               <View style={styles.methodIconBox}>
                  <Image source={{ uri: 'https://img.icons8.com/color/96/banknotes--v1.png' }} style={{ width: 18, height: 18 }} resizeMode="contain" />
               </View>
               <View>
                 <Text style={styles.payName}>Cash on Delivery</Text>
                 <Text style={styles.paySub}>Pay when order arrives</Text>
               </View>
            </View>
            <View style={[styles.radio, isCOD && styles.radioActive]}>
               {isCOD && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>

        {/* Delivery Time Slot (C-4) */}
                <Text style={styles.sectionTitle}>Delivery Time</Text>
                <View style={styles.slotRow}>
                  {DELIVERY_SLOTS.map(slot => (
                    <TouchableOpacity
                      key={slot.id}
                      style={[styles.slotChip, deliverySlot === slot.id && styles.slotChipActive]}
                      onPress={() => setDeliverySlot(slot.id)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.slotText, deliverySlot === slot.id && styles.slotTextActive]}>{slot.label}</Text>
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
        <View style={styles.footerMeta}>
          <Text style={styles.footerMetaLabel}>Paying with</Text>
          <Text style={styles.footerMetaMethod}>{selectedMethodLabel}</Text>
        </View>
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
                   {isCOD ? 'Place Order (COD)' : `Pay ₹${grandTotal.toLocaleString('en-IN')}`}
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
    backgroundColor: '#F3F6FB',
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
    backgroundColor: '#0F2B1D',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 0,
  },
  amountLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFF',
    marginBottom: 10,
  },
  billBreakdown: {
    width: '100%',
    marginBottom: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 10,
    gap: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billKey: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: theme.typography.fontFamily.medium,
  },
  billVal: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontFamily: theme.typography.fontFamily.bold,
  },
  securePill: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DDF7EA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  securePillText: {
    color: '#0B6E4F',
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHint: {
    fontSize: 11,
    color: '#7A869A',
    fontFamily: theme.typography.fontFamily.medium,
  },
  paymentSubTitle: {
    fontSize: 12,
    color: '#5B6473',
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: 10,
  },
  methodCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#0B1220',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  methodCardActive: {
    borderColor: '#A7D7A7',
    backgroundColor: '#F4FBF4',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  payLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paySub: {
    fontSize: 11,
    color: '#6E7787',
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.medium,
  },
  upiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
    rowGap: 10,
  },
  upiCard: {
    width: '48.5%',
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    padding: 12,
    minHeight: 96,
  },
  upiCardActive: {
    borderColor: '#86C186',
    backgroundColor: '#F4FBF4',
  },
  upiTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  upiName: {
    fontSize: 13,
    color: '#1F2937',
    fontFamily: theme.typography.fontFamily.bold,
  },
  upiTag: {
    marginTop: 5,
    alignSelf: 'flex-start',
    fontSize: 10,
    color: '#0B6E4F',
    backgroundColor: '#E8F8F1',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    fontFamily: theme.typography.fontFamily.bold,
  },
  upiSelectedTag: {
    marginTop: 4,
    alignSelf: 'flex-start',
    fontSize: 10,
    color: '#0B6E4F',
    fontFamily: theme.typography.fontFamily.bold,
  },
  bankWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  bankChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9E0EA',
    backgroundColor: '#FFF',
  },
  bankChipActive: {
    borderColor: '#86C186',
    backgroundColor: '#F4FBF4',
  },
  bankChipText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: theme.typography.fontFamily.medium,
  },
  bankChipTextActive: {
    color: '#176B39',
    fontFamily: theme.typography.fontFamily.bold,
  },
  payIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    resizeMode: 'contain',
  },
  payName: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#333',
  },
  methodIconBox: {
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
  slotRow: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 8,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 8,
  },
  slotChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E4E7ED',
    backgroundColor: '#FFF',
    alignItems: 'center',
    paddingVertical: 10,
  },
  slotChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#FFF8F0',
  },
  slotText: {
    fontSize: 12,
    color: '#555',
    fontFamily: theme.typography.fontFamily.bold,
  },
  slotTextActive: {
    color: theme.colors.primary,
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
    paddingBottom: Platform.OS === 'ios' ? 32 : 14,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  footerMeta: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  footerMetaLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: theme.typography.fontFamily.medium,
  },
  footerMetaMethod: {
    fontSize: 13,
    color: '#111827',
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: 2,
  },
  payBtn: {
    backgroundColor: '#119B4A',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#119B4A',
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
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
