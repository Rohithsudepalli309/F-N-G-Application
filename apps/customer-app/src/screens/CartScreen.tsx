import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../store/useCartStore';
import { theme } from '../theme';

export const CartScreen = () => {
  const { items, total, removeFromCart } = useCartStore();
  const navigation = useNavigation();

  const handleCheckout = () => {
    navigation.navigate('Checkout' as never);
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.row}>
      <Text style={styles.qty}>{item.quantity}x</Text>
      <View style={styles.details}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>₹{(item.price * item.quantity) / 100}</Text>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
        <Text style={styles.remove}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Cart</Text>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={styles.list}
      />
      
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total To Pay</Text>
          <Text style={styles.totalValue}>₹{(total() / 100).toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>Proceed to Pay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: theme.spacing.l,
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
  },
  list: {
    padding: theme.spacing.m,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
  },
  qty: {
    width: 30,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.success,
  },
  details: {
    flex: 1,
  },
  name: {
    fontFamily: theme.typography.fontFamily.medium,
  },
  price: {
    color: theme.colors.text.secondary,
  },
  remove: {
    color: theme.colors.error,
    fontSize: theme.typography.size.s,
  },
  footer: {
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
  },
  totalLabel: {
    fontSize: theme.typography.size.l,
    fontFamily: theme.typography.fontFamily.bold,
  },
  totalValue: {
    fontSize: theme.typography.size.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  checkoutBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
  },
  checkoutText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.m,
  },
});
