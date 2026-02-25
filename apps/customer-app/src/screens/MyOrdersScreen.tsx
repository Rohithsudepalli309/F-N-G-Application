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
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { theme } from '../theme';
import { api } from '../services/api';
import { RefreshControl, ActivityIndicator } from 'react-native';

export const MyOrdersScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [orders, setOrders] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    if (isFocused) {
      fetchOrders();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBox}>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4555/4555971.png' }} 
          style={styles.emptyIcon} 
        />
      </View>
      <Text style={styles.emptyTitle}>No Previous Order</Text>
      <Text style={styles.emptySubtitle}>You haven't placed any orders yet. Start shopping to fill this space!</Text>
      <TouchableOpacity 
        style={styles.browseBtn}
        onPress={() => navigation.navigate('Home' as never)}
      >
        <Text style={styles.browseBtnText}>Browse Products</Text>
      </TouchableOpacity>
    </View>
  );

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

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, orders.length === 0 && { flex: 1, justifyContent: 'center' }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
        >
          {orders.length === 0 ? (
            <EmptyState />
          ) : (
            orders.map((order) => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.orderCard}
                onPress={() => (navigation as any).navigate('OrderTracking', { orderId: order.id })}
              >
                <View style={styles.orderTop}>
                  <View style={styles.orderIconBox}>
                    <Image 
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3523/3523887.png' }} 
                      style={styles.orderIcon} 
                    />
                  </View>
                  <View style={styles.orderMeta}>
                    <View style={styles.statusRow}>
                       <Text style={[styles.statusText, (order.status === 'Cancelled' || order.status === 'Refusal') && styles.statusCancelled]}>
                         {order.status}
                       </Text>
                       <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.orderDate}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.orderDivider} />
                
                <View style={styles.orderBottom}>
                  <Text style={styles.orderItems} numberOfLines={1}>
                    {order.items?.map((i: any) => i.name).join(', ') || 'Items details...'}
                  </Text>
                  <Text style={styles.orderAmount}>₹{order.total_amount}</Text>
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
            ))
          )}
        </ScrollView>
      )}
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
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.regular,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  browseBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: {
    color: '#FFF',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
  },
});
