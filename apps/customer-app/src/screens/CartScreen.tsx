import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useCartStore } from '../store/useCartStore';
import { theme } from '../theme';
import { IMAGES } from '../assets/hq';
import { api } from '../services/api';

const { width } = Dimensions.get('window');
const FREE_DELIVERY_THRESHOLD = 499;

const FreeDeliveryProgress = ({ currentTotal }: { currentTotal: number }) => {
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - currentTotal);
  const progress = Math.min(1, currentTotal / FREE_DELIVERY_THRESHOLD);
  
  if (remaining === 0) {
    return (
      <View style={styles.freeDelBanner}>
        <View style={styles.freeDelIconBox}>
          <Image source={IMAGES.icon_box} style={styles.freeDelIcon} />
        </View>
        <Text style={styles.freeDelText}>Yay! Your delivery is on us.</Text>
      </View>
    );
  }

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressRow}>
         <Image source={IMAGES.icon_bike} style={styles.progressIcon} />
         <Text style={styles.progressMsg}>
           Add <Text style={styles.boldText}>₹{remaining}</Text> more for <Text style={styles.freeText}>FREE delivery</Text>
         </Text>
      </View>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
};

export const CartScreen = () => {
  const { items, storeId, total, addToCart, decrementFromCart, clearCart } = useCartStore();
  const navigation = useNavigation<any>();

  const [recommendations, setRecommendations] = React.useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = React.useState(false);

  React.useEffect(() => {
    if (items.length > 0) {
      const firstId = items[0].productId;
      setLoadingRecs(true);
      api.get(`/personalization/recommendations/${firstId}`)
        .then(({ data }) => setRecommendations(data))
        .catch(() => {})
        .finally(() => setLoadingRecs(false));
    } else {
      setRecommendations([]);
    }
  }, [items.length > 0 ? items[0].productId : null]);

  const billTotal = total() / 100;
  const deliveryFee = billTotal >= FREE_DELIVERY_THRESHOLD ? 0 : 25;
  const handlingFee = 5;
  const grandTotal = billTotal + deliveryFee + handlingFee;

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemRow}>
       <View style={styles.itemMain}>
          <View style={styles.itemImageContainer}>
            <Image 
               source={item.image_url ? { uri: item.image_url } : IMAGES.icon_box} 
               style={item.image_url ? styles.itemImg : styles.itemThumb} 
            />
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.itemPrice}>₹{(item.price / 100).toLocaleString('en-IN')}</Text>
          </View>
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
          onPress={() => addToCart(storeId ?? 'default', { ...item, quantity: 1 })}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUpsell = (item: any) => (
    <View key={item.id} style={styles.upsellCard}>
       <Image 
          source={item.image_url ? { uri: item.image_url } : IMAGES.icon_box} 
          style={styles.upsellImg} 
       />
       <Text style={styles.upsellName} numberOfLines={1}>{item.name}</Text>
       <Text style={styles.upsellPrice}>₹{(item.price / 100).toLocaleString('en-IN')}</Text>
       <TouchableOpacity 
          style={styles.upsellAddBtn}
          onPress={() => addToCart(storeId ?? 'default', { ...item, productId: item.id, quantity: 1 })}
       >
          <Text style={styles.upsellAddText}>ADD</Text>
       </TouchableOpacity>
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
             source={IMAGES.icon_box} 
             style={styles.emptyImg} 
          />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Don't let your bag feel lonely! Add some essentials to get started.</Text>
          <TouchableOpacity 
            style={styles.browseBtn} 
            onPress={() => navigation.navigate('HomeTab')}
          >
            <Text style={styles.browseText}>Start Shopping</Text>
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
                <Text style={styles.headerTitle}>Checkout</Text>
                <Text style={styles.headerSub}>{items.length} Items • ₹{grandTotal.toLocaleString('en-IN')}</Text>
            </View>
        </View>
        <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <FreeDeliveryProgress currentTotal={billTotal} />

        {/* Items List */}
        <View style={styles.section}>
          <Text style={styles.sectionHeaderTitle}>Items in Cart</Text>
          {items.map(item => (
            <View key={item.productId}>
               {renderItem({ item })}
            </View>
          ))}
        </View>

        {/* Before You Checkout (Upsells) */}
        {recommendations.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Before you checkout</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
               {recommendations.map(renderUpsell)}
            </ScrollView>
          </View>
        )}

        {/* Delivery Instruction */}
        <View style={styles.instrSection}>
            <Text style={styles.sectionTitle}>Delivery Instructions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
                <TouchableOpacity style={styles.instrCard}>
                    <Image source={IMAGES.icon_search} style={styles.instrImg} resizeMode="contain" />
                    <Text style={styles.instrText}>Don't ring bell</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.instrCard}>
                    <Image source={IMAGES.icon_box} style={styles.instrImg} resizeMode="contain" />
                    <Text style={styles.instrText}>Leave at gate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.instrCard}>
                    <Image source={IMAGES.icon_mic} style={styles.instrImg} resizeMode="contain" />
                    <Text style={styles.instrText}>Avoid calling</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>

        {/* Bill Details */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>Bill Details</Text>
          
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{billTotal.toLocaleString('en-IN')}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={[styles.billValue, deliveryFee === 0 && { color: theme.colors.primary }]}>
               {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Handling Fee</Text>
            <Text style={styles.billValue}>₹{handlingFee}</Text>
          </View>

          <View style={[styles.billRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>To Pay</Text>
            <Text style={styles.grandTotalValue}>₹{grandTotal.toLocaleString('en-IN')}</Text>
          </View>
          
          <View style={styles.secureBadge}>
            <Image source={IMAGES.icon_coin} style={styles.secureIcon} resizeMode="contain" />
            <Text style={styles.secureText}>Safe and Secure Payments</Text>
          </View>
        </View>

      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.footer}>
        <View style={styles.footerInfo}>
            <Text style={styles.footerTotal}>₹{grandTotal.toLocaleString('en-IN')}</Text>
            <Text style={styles.footerSub}>TOTAL TO PAY</Text>
        </View>
        <TouchableOpacity 
          style={styles.checkoutBtn} 
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={styles.checkoutText}>Choose Address</Text>
          <Text style={styles.checkoutArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F4F7F2' },
  emptyRoot: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  backArrow: { fontSize: 24, color: '#000', marginTop: -4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#000' },
  headerSub: { fontSize: 11, color: '#666', fontWeight: '500' },
  clearText: { fontSize: 13, color: '#DC3545', fontWeight: '700' },

  scrollContent: { padding: 16, paddingBottom: 120 },

  // Free Delivery Progress
  progressCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#E8F5E9',
  },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  progressIcon: { width: 18, height: 18 },
  progressMsg: { fontSize: 13, color: '#333' },
  boldText: { fontWeight: '700' },
  freeText: { fontWeight: '700', color: '#84c225' },
  progressBarBg: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#84c225' },
  freeDelBanner: {
    backgroundColor: '#E8F5E9', flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 12, marginBottom: 16, gap: 10,
  },
  freeDelIconBox: { width: 24, height: 24, backgroundColor: '#84c225', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  freeDelIcon: { width: 14, height: 14, tintColor: '#FFF' },
  freeDelText: { fontSize: 13, fontWeight: '700', color: '#163D26' },

  // Items
  section: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionHeaderTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  itemMain: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  itemImageContainer: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#F8F8F8', alignItems: 'center', justifyContent: 'center' },
  itemThumb: { width: 30, height: 30, opacity: 0.6 },
  itemImg: { width: 44, height: 44, borderRadius: 8 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '500', color: '#333', marginBottom: 2 },
  itemPrice: { fontSize: 13, fontWeight: '700', color: '#000' },

  // Upsell
  upsellCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 10, width: 120,
    marginRight: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0',
  },
  upsellImg: { width: 60, height: 60, borderRadius: 8, marginBottom: 8, resizeMode: 'contain' },
  upsellName: { fontSize: 11, fontWeight: '500', color: '#333', textAlign: 'center', marginBottom: 2 },
  upsellPrice: { fontSize: 12, fontWeight: '700', color: '#000', marginBottom: 6 },
  upsellAddBtn: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4,
    borderWidth: 1, borderColor: '#84c225', backgroundColor: '#F8FBF8',
  },
  upsellAddText: { color: '#84c225', fontSize: 10, fontWeight: '800' },

  qtyContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#84c225',
    borderRadius: 8, overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  qtyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  qtyText: { color: '#FFF', fontSize: 13, fontWeight: '700', minWidth: 20, textAlign: 'center' },

  // Instructions
  instrSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  instrCard: {
    backgroundColor: '#FFF', borderRadius: 12, padding: 12, width: 110,
    marginRight: 12, alignItems: 'center', borderWidth: 1, borderColor: '#F0F0F0',
  },
  instrImg: { width: 20, height: 20, marginBottom: 6 },
  instrText: { fontSize: 10, textAlign: 'center', color: '#666', fontWeight: '500' },

  // Bill
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billLabel: { fontSize: 13, color: '#666' },
  billValue: { fontSize: 13, color: '#333', fontWeight: '600' },
  grandTotalRow: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: '#000' },
  grandTotalValue: { fontSize: 16, fontWeight: '700', color: '#000' },
  secureBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 16, gap: 6, opacity: 0.8,
  },
  secureIcon: { width: 14, height: 14 },
  secureText: { fontSize: 11, color: '#666', fontWeight: '500' },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center',
    padding: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 10,
  },
  footerInfo: { flex: 1 },
  footerTotal: { fontSize: 20, fontWeight: '800', color: '#000' },
  footerSub: { fontSize: 10, color: '#84c225', fontWeight: '800', letterSpacing: 0.5 },
  checkoutBtn: {
    backgroundColor: '#84c225', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
  },
  checkoutText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginRight: 8 },
  checkoutArrow: { color: '#FFF', fontSize: 18, fontWeight: '700' },

  // Empty
  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyImg: { width: 120, height: 120, marginBottom: 24, opacity: 0.2 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#999', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  browseBtn: { backgroundColor: '#84c225', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  browseText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
