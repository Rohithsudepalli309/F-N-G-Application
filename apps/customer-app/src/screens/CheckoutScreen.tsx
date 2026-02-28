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
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCartStore } from '../store/useCartStore';
import { api } from '../services/api';
import { theme } from '../theme';

interface DeliveryAddress {
  id?: string;
  label: string;       // Home / Work / Other
  address_line: string;
  city: string;
  pincode: string;
}

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
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);

  const { items, storeId, clearCart, total } = useCartStore();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // Pick up address returned from SavedAddressesScreen
  useEffect(() => {
    if (route.params?.selectedAddress) {
      setDeliveryAddress(route.params.selectedAddress);
    }
  }, [route.params?.selectedAddress]);

  const billTotal = total() / 100;
  const deliveryFee = billTotal > 500 ? 0 : 25;
  const handlingFee = 5;
  const grandTotal = billTotal + deliveryFee + handlingFee;

  const handlePlaceOrder = async () => {
    if (!deliveryAddress) {
      Alert.alert('No Address', 'Please select a delivery address before placing your order.');
      return;
    }
    setLoading(true);

    try {
      // 1. Create Internal Order on Backend (Status: Pending, Stock Deducted)
      const addressString = deliveryAddress
        ? `${deliveryAddress.address_line}, ${deliveryAddress.city} - ${deliveryAddress.pincode}`
        : 'Address not selected';

      const orderPayload = {
        id: `ORD-${Date.now()}`,
        storeId: storeId || 'default-store',
        items: items.map(i => ({
          id: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        totalAmount: Math.round(grandTotal * 100), // In paise
        address: addressString,
      };

      const { data: internalOrder } = await api.post('/orders', orderPayload);
      
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
        amount: Math.round(grandTotal * 100),
        orderId: internalOrder.id
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

      RazorpayCheckout.open(options).then((data: any) => {
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
          onPress={() => setIsCOD(true)}
        >
          <View style={styles.payRow}>
            <View style={styles.payLeft}>
               <View style={styles.codIconBox}>
                  <Text style={{ fontSize: 16 }}>💵</Text>
               </View>
               <Text style={styles.payName}>Cash on Delivery</Text>
            </View>
            <View style={[styles.radio, isCOD && styles.radioActive]}>
               {isCOD && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>

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

        <View style={{ height: 100 }} />
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
  footer: {
    position: 'absolute',
    bottom: 0,
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
