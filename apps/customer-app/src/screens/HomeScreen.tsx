import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { ProductCard } from '../components/ProductCard';
import { useAuthStore } from '../store/useAuthStore';
import { BottomTabs } from '../components/BottomTabs';

import { api } from '../services/api';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

// --- Mock Data ------------------------------------------------------------------------------------------─
const BRAND_CHIPS = [
  { id: 'fng', name: 'F&G', color: '#2E7D32' },
  { id: 'off', name: '50% OFF ZONE', color: '#D32F2F' },
  { id: 'mall', name: 'Super Mall', color: '#FB8C00' },
  { id: 'fresh', name: 'Fresh', color: '#43A047' },
];

const CATEGORY_TAGS = ['All', 'Snacks', 'Drinks', 'Fashion', 'Electronics', 'Beauty', 'Kitchen', 'Care'];

const HOME_CATEGORIES = [
  { id: '1', title: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=300', price: '₹35' },
  { id: '2', title: 'Dairy, Bread & Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=300', price: '₹33' },
  { id: '3', title: 'Atta, Rice, Oil & Dals', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300', price: '₹145' },
  { id: '4', title: 'Munchies', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=300', price: '₹20' },
];

export const HomeScreen = () => {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [offZoneProducts, setOffZoneProducts] = useState<any[]>([]);
  const [munchiesProducts, setMunchiesProducts] = useState<any[]>([]);
  const [dairyProducts, setDairyProducts] = useState<any[]>([]);
  const [cleaningProducts, setCleaningProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const scrollRef = useRef<ScrollView>(null);

  const fetchHomeData = async () => {
    try {
      // 1. Fetch 50% Off Zone
      const offZoneRes = await api.get('/products', { params: { category: 'Fruits & Vegetables' } });
      if (offZoneRes.data && Array.isArray(offZoneRes.data)) {
        setOffZoneProducts(offZoneRes.data.slice(0, 6));
      }

      // 2. Fetch Munchies
      const munchiesRes = await api.get('/products', { params: { category: 'Munchies' } });
      if (munchiesRes.data && Array.isArray(munchiesRes.data)) {
        setMunchiesProducts(munchiesRes.data.slice(0, 6));
      }

      // 3. Fetch Dairy
      const dairyRes = await api.get('/products', { params: { category: 'Dairy, Bread & Eggs' } });
      if (dairyRes.data && Array.isArray(dairyRes.data)) {
        setDairyProducts(dairyRes.data.slice(0, 6));
      }

      // 4. Fetch Cleaning
      const cleaningRes = await api.get('/products', { params: { category: 'Cleaning Essentials' } });
      if (cleaningRes.data && Array.isArray(cleaningRes.data)) {
        setCleaningProducts(cleaningRes.data.slice(0, 6));
      }

      // REALISM: Poll for active order to show status bar
      const ordersRes = await api.get('/orders');
      const active = ordersRes.data.find((o: any) => 
        ['placed', 'preparing', 'ready', 'pickup'].includes(o.status)
      );
      setActiveOrder(active);

    } catch (err) {
      console.error('Failed to fetch home data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
    const interval = setInterval(fetchHomeData, 10000); // Poll every 10s for realism
    return () => clearInterval(interval);
  }, []);

  // Auto-redirect to Location if missing
  useEffect(() => {
    if (!user?.address) {
      setTimeout(() => {
        (navigation as any).navigate('LocationSelect');
      }, 800);
    }
  }, [user?.address]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowBackToTop(offsetY > 300);
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* --- 1. NO-GAP SPEEDY HEADER (F&G Premium) --- */}
      <View style={styles.newHeader}>
        <View style={styles.headerTopRow}>
          <View style={styles.speedPill}>
             <Text style={styles.speedBolt}>⚡</Text>
             <Text style={styles.speedText}>5 minutes</Text>
          </View>

          <TouchableOpacity 
            style={styles.profileIconBtn}
            onPress={() => (navigation as any).navigate('Settings')}
          >
            <View style={styles.profileCircleInner}>
               <Text style={styles.profileChar}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.locationContainer}
          onPress={() => (navigation as any).navigate('LocationSelect')}
        >
          <Text style={styles.locationTopText} numberOfLines={1}>
            {(user?.address?.split(',') || [])[0] || 'Bachupally - 70'}
          </Text>
          <View style={styles.locationBottomRow}>
            <Text style={styles.locationBottomText} numberOfLines={1}>
              {user?.address || 'Harithavanam Colony, Bachupally, Hyder...'}
            </Text>
            <Text style={styles.chevDown}>⌄</Text>
          </View>
        </TouchableOpacity>

        {/* --- 2. SERVICE GRID (4 Columns) --- */}
        <View style={styles.serviceGrid}>
           <TouchableOpacity style={styles.serviceCard}>
              <View style={[styles.servicePill, { backgroundColor: '#F3E5F5' }]}>
                 <Text style={[styles.servicePillText, { color: '#7B1FA2' }]}>F&G</Text>
              </View>
           </TouchableOpacity>
           <TouchableOpacity 
              style={styles.serviceCard}
              onPress={() => (navigation as any).navigate('ProductList', { categoryName: 'Fruits & Vegetables' })}
           >
              <View style={[styles.servicePill, { backgroundColor: '#FFF3E0' }]}>
                 <Text style={[styles.servicePillText, { color: '#E65100' }]}>50%</Text>
                 <Text style={styles.servicePillSub}>OFF ZONE</Text>
              </View>
           </TouchableOpacity>
           <TouchableOpacity style={styles.serviceCard}>
              <View style={[styles.servicePill, { backgroundColor: '#E8EAF6' }]}>
                 <Text style={[styles.servicePillText, { color: '#303F9F' }]}>Super</Text>
                 <Text style={styles.servicePillSub}>Mall.</Text>
              </View>
           </TouchableOpacity>
           <TouchableOpacity style={styles.serviceCard}>
              <View style={[styles.servicePill, { backgroundColor: '#E0F2F1' }]}>
                 <Text style={[styles.servicePillText, { color: '#00796B' }]}>Fresh</Text>
              </View>
           </TouchableOpacity>
        </View>

        {/* --- 3. SEARCH BAR REFINEMENT --- */}
        <View style={styles.newSearchSection}>
          <View style={styles.newSearchBar}>
            <Text style={styles.newSearchIcon}>🔍</Text>
            <TextInput 
              style={styles.newSearchInput}
              placeholder="Search for 'Milk'"
              placeholderTextColor="#757575"
              value={search}
              onChangeText={setSearch}
            />
            <View style={styles.searchRightBadges}>
               <View style={styles.searchSep} />
               <View style={styles.specialsBadge}>
                  <Text style={styles.specialsTitle}>Ramadan</Text>
                  <Text style={styles.specialsSub}>Specials</Text>
               </View>
               <Image 
                 source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3050/3050161.png' }} 
                 style={styles.badgeImg} 
               />
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollRef}
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* --- LIVE ORDER STATUS WIDGET (The "Genius" Touch) --- */}
        {activeOrder && (
          <TouchableOpacity 
            style={styles.liveOrderCard}
            onPress={() => (navigation as any).navigate('OrderTracking', { orderId: activeOrder.id })}
          >
            <View style={styles.liveOrderContent}>
               <View style={styles.liveOrderInfo}>
                  <Text style={styles.liveOrderTitle}>
                    {activeOrder.status === 'pickup' ? '🛵 Driver is on the way!' : 
                     activeOrder.status === 'ready' ? '📦 Order is ready for pickup!' :
                     '🥘 Preparing your order...'}
                  </Text>
                  <Text style={styles.liveOrderSub}>
                    {activeOrder.status === 'pickup' ? 'Arriving in 4-8 mins' : 
                     activeOrder.status === 'ready' ? 'Store is waiting for driver' :
                     'Expected in 12 mins'}
                  </Text>
               </View>
               <View style={styles.trackBtnPill}>
                  <Text style={styles.trackText}>TRACK</Text>
               </View>
            </View>
            <View style={styles.liveOrderProgress}>
               <View style={[styles.progressBar, { width: activeOrder.status === 'pickup' ? '75%' : '40%' }]} />
            </View>
          </TouchableOpacity>
        )}

        {/* --- 4. Horizontal Tags --- */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.tagsContainer}
        >
          {CATEGORY_TAGS.map((tag, i) => (
            <TouchableOpacity key={tag} style={[styles.tag, i === 0 && styles.activeTag]}>
              <Text style={[styles.tagText, i === 0 && styles.activeTagText]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* --- 5. Back to Top Button (Dynamic) --- */}
        {showBackToTop && (
          <View style={styles.backToTopSection}>
             <TouchableOpacity style={styles.backToTopBtn} onPress={scrollToTop}>
                <Text style={styles.backToTopText}>Back to top ⬆️</Text>
             </TouchableOpacity>
          </View>
        )}

        {/* --- 4. ZERO FEES UTILITY BAR (Premium Style) --- */}
        <View style={styles.zeroFeesBar}>
           <Text style={styles.zeroFeesMain}>₹0 FEES</Text>
           <View style={styles.zeroFeesDetails}>
              <View style={styles.zeroFeesRow}>
                 <Text style={styles.checkIcon}>✓</Text>
                 <Text style={styles.zeroFeesText}>₹0 Handling Fee</Text>
              </View>
              <View style={styles.zeroFeesRow}>
                 <Text style={styles.checkIcon}>✓</Text>
                 <Text style={styles.zeroFeesText}>₹0 Rain & Surge Fee</Text>
              </View>
           </View>
        </View>

        {/* --- 5. FEATURED GRIDS (Organic, Healthy, etc.) --------------------- */}
        <View style={styles.featuredGridWrapper}>
           <View style={styles.featuredRow}>
              <TouchableOpacity style={[styles.featuredCard, { backgroundColor: '#E8F5E9' }]}>
                 <Text style={styles.featuredTopTitle}>Organic &</Text>
                 <Text style={styles.featuredTopTitle}>Premium Picks</Text>
                 <Image 
                   source={{ uri: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&q=80&w=200' }} 
                   style={styles.featuredImg} 
                 />
                 <View style={styles.featuredPriceBadge}>
                    <Text style={styles.oldPriceSmall}>₹1045</Text>
                    <Text style={styles.newPriceSmall}>₹699</Text>
                 </View>
                 <Text style={styles.featuredBottomText}>Anveshan A2 Ghee</Text>
              </TouchableOpacity>

              <View style={styles.featuredCol}>
                 <TouchableOpacity style={[styles.featuredSmallCard, { backgroundColor: '#F3E5F5' }]}>
                    <Text style={styles.smallCardTitle}>Dry fruits & more</Text>
                    <View style={styles.smallCardRow}>
                       <Text style={styles.startsAt}>Starts at</Text>
                       <Text style={styles.startsPrice}>₹99</Text>
                    </View>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&q=80&w=150' }} 
                      style={styles.smallCardImg} 
                    />
                 </TouchableOpacity>

                 <TouchableOpacity style={[styles.featuredSmallCard, { backgroundColor: '#E1F5FE' }]}>
                    <Text style={styles.smallCardTitle}>Health & Wellness</Text>
                    <View style={styles.smallCardRow}>
                       <Text style={styles.upTo}>UP TO</Text>
                       <Text style={styles.offPerc}>70% OFF</Text>
                    </View>
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=150' }} 
                      style={styles.smallCardImg} 
                    />
                 </TouchableOpacity>
              </View>
           </View>
        </View>

        {/* --- 6. Category Grid (Grocery & Kitchen) ---------------------------─ */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>Grocery & Kitchen</Text>
          <View style={styles.gridWrapper}>
            {HOME_CATEGORIES.map(category => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.gridCard}
                onPress={() => (navigation as any).navigate('ProductList', { categoryName: category.title })}
              >
                <Text style={styles.gridTitle} numberOfLines={2}>{category.title}</Text>
                <Image source={{ uri: category.image }} style={styles.gridImage} resizeMode="cover" />
                <View style={styles.gridFooter}>
                  <Text style={styles.gridStarts}>Starts at</Text>
                  <Text style={styles.gridPrice}>{category.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* --- 8. 50% OFF ZONE ------------------------------------------------------------ */}
        <View style={styles.offZoneSection}>
          <View style={styles.offZoneHeader}>
             <Text style={styles.offZoneTitle}>50% Off Zone</Text>
             <Text style={styles.offZoneSubtitle}>Half the price, double the joy!</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
             {loading ? (
               <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 20 }} />
             ) : (
               offZoneProducts.map(p => (
                 <ProductCard 
                   key={p.id} 
                   product={{
                     id: p.id,
                     name: p.name,
                     weight: p.unit || '1 pack',
                     price: p.price / 100,
                     originalPrice: p.original_price ? p.original_price / 100 : undefined,
                     image: p.image_url,
                     deliveryTime: '5 mins',
                     discountTag: p.original_price ? `₹${(p.original_price - p.price)/100}` : undefined
                   }} 
                 />
               ))
             )}
             <TouchableOpacity 
               style={styles.seeAllCard}
               onPress={() => (navigation as any).navigate('ProductList', { categoryName: 'Fruits & Vegetables' })}
             >
                <Text style={styles.seeAllText}>See All</Text>
                <View style={styles.seeAllCircle}>
                   <Text style={{ fontSize: 18, color: '#E91E63' }}>→</Text>
                </View>
             </TouchableOpacity>
          </ScrollView>
        </View>

        {/* --- 9. Munchies Swiper ---------------------------------------------------------─ */}
        <View style={styles.offZoneSection}>
          <View style={styles.offZoneHeader}>
             <Text style={styles.offZoneTitle}>Munchies & Snacks</Text>
             <Text style={styles.offZoneSubtitle}>Crispy, crunchy, and yum!</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
             {loading ? (
               <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 20 }} />
             ) : (
               munchiesProducts.map(p => (
                 <ProductCard 
                   key={p.id} 
                   product={{
                     id: p.id,
                     name: p.name,
                     weight: p.unit || '1 pack',
                     price: p.price / 100,
                     originalPrice: p.original_price ? p.original_price / 100 : undefined,
                     image: p.image_url,
                     deliveryTime: '7 mins',
                     discountTag: p.original_price ? `₹${(p.original_price - p.price)/100}` : undefined
                   }} 
                 />
               ))
             )}
             <TouchableOpacity 
               style={[styles.seeAllCard, { backgroundColor: '#43A047' }]}
               onPress={() => (navigation as any).navigate('ProductList', { categoryName: 'Munchies' })}
             >
                <Text style={styles.seeAllText}>See All</Text>
                <View style={styles.seeAllCircle}>
                   <Text style={{ fontSize: 18, color: '#43A047' }}>→</Text>
                </View>
             </TouchableOpacity>
          </ScrollView>
        </View>

        {/* --- 10. Dairy & Breakfast Swiper -----------------------------------------------─ */}
        <View style={styles.offZoneSection}>
          <View style={styles.offZoneHeader}>
             <Text style={styles.offZoneTitle}>Dairy & Breakfast</Text>
             <Text style={styles.offZoneSubtitle}>Fresh milk, eggs, bread & more</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
             {loading ? (
               <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 20 }} />
             ) : (
               dairyProducts.map(p => (
                 <ProductCard 
                   key={p.id} 
                   product={{
                     id: p.id,
                     name: p.name,
                     weight: p.unit || '1 pack',
                     price: p.price / 100,
                     originalPrice: p.original_price ? p.original_price / 100 : undefined,
                     image: p.image_url,
                     deliveryTime: '7 mins',
                     discountTag: p.original_price ? `₹${(p.original_price - p.price)/100}` : undefined
                   }} 
                 />
               ))
             )}
             <TouchableOpacity 
               style={[styles.seeAllCard, { backgroundColor: '#1E88E5' }]}
               onPress={() => (navigation as any).navigate('ProductList', { categoryName: 'Dairy, Bread & Eggs' })}
             >
                <Text style={styles.seeAllText}>See All</Text>
                <View style={styles.seeAllCircle}>
                   <Text style={{ fontSize: 18, color: '#1E88E5' }}>→</Text>
                </View>
             </TouchableOpacity>
          </ScrollView>
        </View>

        {/* --- 11. Home & Cleaning Swiper -------------------------------------------------─ */}
        <View style={styles.offZoneSection}>
          <View style={styles.offZoneHeader}>
             <Text style={styles.offZoneTitle}>Home & Cleaning</Text>
             <Text style={styles.offZoneSubtitle}>Dirt doesn't stand a chance</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
             {loading ? (
               <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 20 }} />
             ) : (
               cleaningProducts.map(p => (
                 <ProductCard 
                   key={p.id} 
                   product={{
                     id: p.id,
                     name: p.name,
                     weight: p.unit || '1 pack',
                     price: p.price / 100,
                     originalPrice: p.original_price ? p.original_price / 100 : undefined,
                     image: p.image_url,
                     deliveryTime: '10 mins',
                     discountTag: p.original_price ? `₹${(p.original_price - p.price)/100}` : undefined
                   }} 
                 />
               ))
             )}
             <TouchableOpacity 
               style={[styles.seeAllCard, { backgroundColor: '#00BCD4' }]}
               onPress={() => (navigation as any).navigate('ProductList', { categoryName: 'Cleaning Essentials' })}
             >
                <Text style={styles.seeAllText}>See All</Text>
                <View style={styles.seeAllCircle}>
                   <Text style={{ fontSize: 18, color: '#00BCD4' }}>→</Text>
                </View>
             </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={{ height: 180 }} />
      </ScrollView>

      <BottomTabs activeTab="Home" />

      {/* --- 9. Back to Top Button (Floating) --------------------------------------- */}
      {showBackToTop && (
        <TouchableOpacity 
          style={styles.floatingBackToTop} 
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <Text style={styles.backToTopText}>Back to top ⬆️</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  newHeader: {
    backgroundColor: '#FFF',
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  speedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBC02D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  speedBolt: {
    fontSize: 22,
    marginRight: 6,
  },
  speedText: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
    letterSpacing: -0.5,
  },
  locationContainer: {
    paddingHorizontal: 14,
    marginTop: 4,
    paddingBottom: 12,
  },
  locationTopText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  locationBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  locationBottomText: {
    fontSize: 12,
    color: '#616161',
    maxWidth: '90%',
  },
  chevDown: {
    fontSize: 12,
    color: '#000',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  serviceGrid: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  serviceCard: {
    width: (width - 48) / 4,
  },
  servicePill: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  servicePillText: {
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  servicePillSub: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000',
    marginTop: -2,
  },
  profileIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCircleInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  profileChar: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8FAF5',
  },
  tagsContainer: {
    paddingLeft: 14,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  tag: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    marginRight: 4,
    alignItems: 'center',
  },
  activeTag: {
    borderBottomWidth: 3,
    borderBottomColor: '#000',
  },
  tagText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#616161',
  },
  activeTagText: {
    color: '#000',
  },
  promoBanner: {
    width: width,
    height: 220,
    backgroundColor: '#FFF',
    paddingVertical: 8,
  },
  gridSection: {
    paddingHorizontal: 14,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
    marginBottom: 12,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 42) / 3,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  gridTitle: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
    textAlign: 'center',
    height: 32,
    marginBottom: 4,
  },
  gridImage: {
    width: 65,
    height: 65,
    borderRadius: 8,
    marginBottom: 8,
  },
  gridFooter: {
    alignItems: 'center',
  },
  gridStarts: {
    fontSize: 9,
    color: '#757575',
  },
  gridPrice: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  offZoneSection: {
    marginTop: 24,
    backgroundColor: '#FFF',
    paddingVertical: 16,
  },
  offZoneHeader: {
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  offZoneTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  offZoneSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  seeAllCard: {
    width: 100,
    height: 150,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#D81B60',
  },
  seeAllCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    elevation: 2,
  },
  backToTopSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  backToTopBtn: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backToTopText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
  },
  floatingBackToTop: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 5,
  },
  // --- ZEPTIFIED UTILITY STYLES ------------------------------------------
  zeroFeesBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEFBE8',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 12,
  },
  zeroFeesMain: {
    fontSize: 24,
    fontWeight: '900',
    color: '#388E3C',
    marginRight: 16,
    width: 90,
  },
  zeroFeesDetails: {
    flex: 1,
  },
  zeroFeesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  checkIcon: {
    color: '#388E3C',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 4,
  },
  zeroFeesText: {
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  featuredGridWrapper: {
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  featuredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  featuredCard: {
    width: (width - 40) * 0.45,
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    height: 180,
  },
  featuredTopTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#1B5E20',
    lineHeight: 18,
  },
  featuredImg: {
    width: 90,
    height: 90,
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    resizeMode: 'contain',
  },
  featuredPriceBadge: {
    position: 'absolute',
    bottom: 80,
    left: 12,
    backgroundColor: '#FFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    elevation: 2,
  },
  oldPriceSmall: {
    fontSize: 9,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  newPriceSmall: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  featuredBottomText: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    fontSize: 11,
    color: '#2E7D32',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  featuredCol: {
    width: (width - 40) * 0.52,
    justifyContent: 'space-between',
  },
  featuredSmallCard: {
    height: 85,
    borderRadius: 16,
    padding: 10,
    position: 'relative',
  },
  smallCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    width: '60%',
  },
  smallCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  startsAt: {
    fontSize: 8,
    color: '#757575',
    marginRight: 2,
  },
  startsPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  upTo: {
     fontSize: 8,
     color: '#0277BD',
     fontWeight: 'bold',
  },
  offPerc: {
     fontSize: 12,
     fontWeight: '900',
     color: '#01579B',
  },
  smallCardImg: {
    width: 60,
    height: 60,
    position: 'absolute',
    bottom: 5,
    right: 5,
    resizeMode: 'contain',
  },
  newSearchSection: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  newSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  newSearchIcon: {
    fontSize: 16,
    color: '#757575',
    marginRight: 8,
  },
  newSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontFamily: theme.typography.fontFamily.medium,
  },
  searchRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchSep: {
    width: 1,
    height: 20,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 10,
  },
  specialsBadge: {
    marginRight: 6,
  },
  specialsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A237E',
  },
  specialsSub: {
    fontSize: 10,
    color: '#1A237E',
    marginTop: -2,
  },
  badgeImg: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  liveOrderCard: {
    backgroundColor: '#323232',
    margin: 14,
    borderRadius: 12,
    padding: 12,
    elevation: 4,
  },
  liveOrderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveOrderInfo: {
    flex: 1,
  },
  liveOrderTitle: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
  },
  liveOrderSub: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 2,
  },
  trackBtnPill: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  trackText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  liveOrderProgress: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
});
