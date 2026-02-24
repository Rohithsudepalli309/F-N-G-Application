import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../store/useCartStore';
import { api } from '../services/api';
import { theme } from '../theme';

export const CheckoutScreen = () => {
  const [loading, setLoading] = useState(false);
  const { items, storeId, clearCart, total } = useCartStore();
  const navigation = useNavigation();

  const handlePayment = async () => {
    setLoading(true);

    try {
      // 1. Create Order on Backend
      const orderPayload = {
        store_id: storeId,
        items: items.map(i => ({ product_id: i.productId, quantity: i.quantity })),
        amount: total(), // Validate on backend!
        address: { lat: 12.9, lng: 77.5, text: "Home" } // Mock address
      };

      const { data } = await api.post('/orders', orderPayload);
      
      if (!data.success) {
        throw new Error('Order creation failed');
      }

      // 2. Open Razorpay (Native SDK)
      const options = {
        description: 'Food Order',
        image: 'https://i.imgur.com/3g7nmJC.png',
        currency: data.currency,
        key: data.key_id,
        amount: data.amount,
        name: 'FNG Delivery',
        order_id: data.razorpay_order_id, // Order ID from backend
        theme: { color: theme.colors.primary }
      };

      RazorpayCheckout.open(options).then((data: any) => {
        // handle success
        Alert.alert('Success', `Payment ID: ${data.razorpay_payment_id}`);
        clearCart();
        navigation.navigate('Home' as never); // Ideally navigate to Order Tracking
      }).catch((error: any) => {
        // handle failure
        Alert.alert('Error', `Code: ${error.code} | ${error.description}`);
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Checkout</Text>
      
      <View style={styles.summary}>
        <Text style={styles.label}>Payable Amount</Text>
        <Text style={styles.amount}>₹{(total() / 100).toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.addressSection}>
        <Text style={styles.addressLabel}>Delivering to:</Text>
        <Text style={styles.addressText}>Flat 402, Shanthi Niketan, Indiranagar, Bangalore</Text>
      </View>

      <TouchableOpacity 
        style={styles.payBtn} 
        onPress={handlePayment}
        disabled={loading}
      >
         {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.payText}>Pay with UPI / Card (Razorpay)</Text>}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.l,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
  },
  header: {
    fontSize: theme.typography.size.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  summary: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  addressSection: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addressLabel: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 4,
  },
  addressText: {
    fontSize: theme.typography.size.s,
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  label: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.m,
  },
  amount: {
    color: theme.colors.primary,
    fontSize: theme.typography.size.xxl,
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: theme.spacing.s,
  },
  payBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
  },
  payText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.l,
    fontFamily: theme.typography.fontFamily.bold,
  },
});
