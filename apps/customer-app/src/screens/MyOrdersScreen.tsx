import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const MOCK_ORDERS = [
  {
    id: 'FNG-8829-1X',
    status: 'Delivered',
    date: '24 Feb, 6:42 PM',
    items: 'Amul Gold Milk, Bread, Eggs',
    amount: 242,
    image: 'https://cdn-icons-png.flaticon.com/512/3523/3523887.png',
  },
  {
    id: 'FNG-7712-0B',
    status: 'Cancelled',
    date: '22 Feb, 10:15 AM',
    items: 'Coca Cola 2L, Lay\'s Magic Masala',
    amount: 145,
    image: 'https://cdn-icons-png.flaticon.com/512/2405/2405479.png',
  },
  {
    id: 'FNG-1102-4Z',
    status: 'Delivered',
    date: '18 Feb, 9:30 AM',
    items: 'Aashirvaad Atta 5kg, Maggi 12pk',
    amount: 890,
    image: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png',
  },
];

export const MyOrdersScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {MOCK_ORDERS.map((order) => (
          <TouchableOpacity 
            key={order.id} 
            style={styles.orderCard}
            onPress={() => (navigation as any).navigate('OrderTracking', { orderId: order.id })}
          >
            <View style={styles.orderTop}>
              <View style={styles.orderIconBox}>
                 <Image source={{ uri: order.image }} style={styles.orderIcon} />
              </View>
              <View style={styles.orderMeta}>
                <View style={styles.statusRow}>
                   <Text style={[styles.statusText, order.status === 'Cancelled' && styles.statusCancelled]}>
                     {order.status}
                   </Text>
                   <Text style={styles.orderId}>#{order.id}</Text>
                </View>
                <Text style={styles.orderDate}>{order.date}</Text>
              </View>
            </View>
            
            <View style={styles.orderDivider} />
            
            <View style={styles.orderBottom}>
              <Text style={styles.orderItems} numberOfLines={1}>{order.items}</Text>
              <Text style={styles.orderAmount}>₹{order.amount}</Text>
            </View>

            <View style={styles.orderActions}>
               <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionText}>Reorder</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.actionBtn, styles.actionBtnOutline]}>
                  <Text style={styles.actionTextOutline}>Need Help?</Text>
               </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F8F9FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  orderIcon: {
    width: 32,
    height: 32,
  },
  orderMeta: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#108D10',
  },
  statusCancelled: {
    color: '#D32F2F',
  },
  orderId: {
    fontSize: 10,
    color: '#999',
    fontFamily: theme.typography.fontFamily.medium,
  },
  orderDate: {
    fontSize: 11,
    color: '#666',
    fontFamily: theme.typography.fontFamily.regular,
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItems: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    marginRight: 12,
    fontFamily: theme.typography.fontFamily.medium,
  },
  orderAmount: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  orderActions: {
     flexDirection: 'row',
     marginTop: 16,
     gap: 12,
  },
  actionBtn: {
     flex: 1,
     backgroundColor: '#339233',
     paddingVertical: 10,
     borderRadius: 8,
     alignItems: 'center',
  },
  actionText: {
     color: '#FFF',
     fontSize: 13,
     fontFamily: theme.typography.fontFamily.bold,
  },
  actionBtnOutline: {
     backgroundColor: 'transparent',
     borderWidth: 1,
     borderColor: '#DDD',
  },
  actionTextOutline: {
     color: '#666',
     fontSize: 13,
     fontFamily: theme.typography.fontFamily.bold,
  }
});
