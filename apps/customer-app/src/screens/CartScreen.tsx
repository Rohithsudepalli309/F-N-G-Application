import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../store/useCartStore';
import { theme } from '../theme';

export const CartScreen = () => {
  const { items, total, addToCart, decrementFromCart, clearCart } = useCartStore();
  const navigation = useNavigation();

  const handleCheckout = () => {
    navigation.navigate('Checkout' as never);
  };

  const billTotal = total() / 100;
  const deliveryFee = billTotal > 500 ? 0 : 25;
  const handlingFee = 5;
  const grandTotal = billTotal + deliveryFee + handlingFee;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>
      
      <View style={styles.qtyContainer}>
        <TouchableOpacity 
          style={styles.qtyBtn} 
          onPress={() => decrementFromCart(item.productId)}
        >
          <Text style={styles.qtyBtnText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity 
          style={styles.qtyBtn} 
          onPress={() => addToCart('default-store', { ...item, quantity: 1 })}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyRoot}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Your Cart</Text>
        </View>
        <View style={styles.emptyContent}>
          <Image 
             source={{ uri: 'https://cdn-icons-png.flaticon.com/512/11329/11329961.png' }} 
             style={styles.emptyImg} 
          />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Add some items from the store to see them here.</Text>
          <TouchableOpacity 
            style={styles.browseBtn} 
            onPress={() => navigation.navigate('Home' as never)}
          >
            <Text style={styles.browseText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <View>
                <Text style={styles.headerTitle}>Your Cart</Text>
                <Text style={styles.headerSub}>{items.length} Items</Text>
            </View>
        </View>
        <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear Cart</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Items List */}
        <View style={styles.section}>
          {items.map(item => (
            <View key={item.productId}>
               {renderItem({ item })}
            </View>
          ))}
        </View>

        {/* Delivery Instruction (Premium Style) */}
        <View style={styles.instrSection}>
            <Text style={styles.sectionTitle}>Delivery Instructions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity style={styles.instrCard}>
                    <Text style={styles.instrEmoji}>🔕</Text>
                    <Text style={styles.instrText}>Don't ring the bell</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.instrCard}>
                    <Text style={styles.instrEmoji}>📦</Text>
                    <Text style={styles.instrText}>Leave at the gate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.instrCard}>
                    <Text style={styles.instrEmoji}>🤳</Text>
                    <Text style={styles.instrText}>Avoid calling</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          
          <View style={styles.billRow}>
            <View style={styles.billLabelRow}>
               <Text style={styles.billLabel}>Item Total</Text>
            </View>
            <Text style={styles.billValue}>₹{billTotal.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.billRow}>
            <View style={styles.billLabelRow}>
               <Text style={styles.billLabel}>Delivery Fee</Text>
            </View>
            <Text style={[styles.billValue, deliveryFee === 0 && { color: '#108D10' }]}>
               {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          <View style={styles.billRow}>
            <View style={styles.billLabelRow}>
               <Text style={styles.billLabel}>Handling Fee</Text>
            </View>
            <Text style={styles.billValue}>₹{handlingFee}</Text>
          </View>

          <View style={[styles.billRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
            <Text style={styles.footerTotal}>₹{grandTotal.toLocaleString('en-IN')}</Text>
            <Text style={styles.footerSub}>Grand Total</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>Choose Address</Text>
          <Text style={styles.checkoutArrow}>→</Text>
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
  emptyRoot: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerSub: {
    fontSize: 11,
    color: '#666',
    fontFamily: theme.typography.fontFamily.medium,
  },
  clearText: {
    fontSize: 13,
    color: '#E91E63',
    fontFamily: theme.typography.fontFamily.bold,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#333',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#333',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#339233',
    borderRadius: 8,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
  },
  qtyText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    minWidth: 20,
    textAlign: 'center',
  },
  instrSection: {
      marginBottom: 24,
  },
  instrCard: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: 12,
      width: 120,
      marginRight: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#F0F0F0',
  },
  instrEmoji: {
      fontSize: 20,
      marginBottom: 6,
  },
  instrText: {
      fontSize: 10,
      textAlign: 'center',
      color: '#666',
      lineHeight: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 13,
    color: '#666',
    fontFamily: theme.typography.fontFamily.medium,
  },
  billValue: {
    fontSize: 13,
    color: '#333',
    fontFamily: theme.typography.fontFamily.medium,
  },
  grandTotalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  grandTotalValue: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  emptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyImg: {
    width: 120,
    height: 120,
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#333',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  browseBtn: {
    backgroundColor: '#339233',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  browseText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  footerInfo: {
      flex: 1,
  },
  footerTotal: {
      fontSize: 18,
      fontFamily: theme.typography.fontFamily.bold,
      color: '#000',
  },
  footerSub: {
      fontSize: 11,
      color: '#E91E63',
      fontFamily: theme.typography.fontFamily.bold,
  },
  checkoutBtn: {
    backgroundColor: '#339233',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkoutText: {
    color: '#FFF',
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.bold,
    marginRight: 8,
  },
  checkoutArrow: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
  },
});
