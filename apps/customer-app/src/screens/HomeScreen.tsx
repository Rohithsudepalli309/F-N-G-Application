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

const { width } = Dimensions.get('window');

// ── Mock Data ─────────────────────────────────────────────────────────────
const BRAND_CHIPS = [
  { id: 'zepto', name: 'zepto', color: '#3E2723' },
  { id: 'off', name: '50% OFF ZONE', color: '#D32F2F' },
  { id: 'mall', name: 'Super Mall', color: '#FB8C00' },
  { id: 'fresh', name: 'Fresh', color: '#43A047' },
];

const CATEGORY_TAGS = ['All', 'Holi', 'Fashion', 'Electronics', 'Beauty', 'Kitchen', 'Care'];

const HOME_CATEGORIES = [
  { id: '1', title: 'Organic & Premium Picks', image: 'https://cdn-icons-png.flaticon.com/512/1531/1531391.png', price: '₹99' },
  { id: '2', title: 'Dry fruits & more', image: 'https://cdn-icons-png.flaticon.com/512/6143/6143467.png', price: '₹99' },
  { id: '3', title: 'Health & Wellness', image: 'https://cdn-icons-png.flaticon.com/512/3144/3144565.png', price: '₹70' },
  { id: '4', title: 'Clean & Care', image: 'https://cdn-icons-png.flaticon.com/512/2554/2554031.png', price: '₹89' },
];

const OFF_ZONE_PRODUCTS = [
  { id: 'p1', name: 'Heritage Total Curd Pouch', weight: '1 pack (450 g)', price: 47, originalPrice: 50, discountTag: '₹3', image: 'https://cdn-icons-png.flaticon.com/512/2674/2674486.png', deliveryTime: '5 mins' },
  { id: 'p2', name: 'Onion', weight: '1 Pack (900 - 100...', price: 28, originalPrice: 47, discountTag: '₹19', image: 'https://cdn-icons-png.flaticon.com/512/7292/7292911.png', deliveryTime: '5 mins' },
  { id: 'p3', name: 'Paper Boat Tender Coco...', weight: '1 pc (1.2 L)', price: 66, originalPrice: 140, discountTag: '₹74', image: 'https://cdn-icons-png.flaticon.com/512/3075/3075908.png', deliveryTime: '5 mins' },
  { id: 'p4', name: 'Kellogg\'s Millet Muesli', weight: '1 pack (1 kg)', price: 334, originalPrice: 690, discountTag: '₹356', image: 'https://cdn-icons-png.flaticon.com/512/2821/2821811.png', deliveryTime: '5 mins' },
];

export const HomeScreen = () => {
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');

  // Auto-redirect to Location if missing
  useEffect(() => {
    if (!user?.address) {
      setTimeout(() => {
        (navigation as any).navigate('LocationSelect');
      }, 800);
    }
  }, [user?.address]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.accentBackground} />
      
      {/* ── 1. Header (Yellow/Green Background) ────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.speedIndicator}>
            <Text style={styles.boltEmoji}>⚡</Text>
            <Text style={styles.speedText}>5 minutes</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileCircle}
            onPress={() => (navigation as any).navigate('Settings')}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.addressBar}
          onPress={() => (navigation as any).navigate('LocationSelect')}
        >
          <Text style={styles.addressText} numberOfLines={1}>
            {user?.address || 'Bachupally - 70, Harithavanam Colo...'}
          </Text>
          <Text style={styles.downArrow}>▼</Text>
        </TouchableOpacity>

        {/* ── 2. Brand swiper ────────────────────────────────────────── */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.brandSwiper}
          contentContainerStyle={styles.brandSwiperContent}
        >
          {BRAND_CHIPS.map(chip => (
            <TouchableOpacity key={chip.id} style={[styles.brandChip, { backgroundColor: '#FFFFFF' }]}>
               <Text style={[styles.brandChipText, { color: chip.color, fontWeight: '900' }]}>{chip.name.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── 3. Search Bar ────────────────────────────────────────── */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search for 'Milk'"
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            <View style={styles.searchDivider} />
            <View style={styles.ramadanBadge}>
               <Text style={styles.ramadanText}>Ramadan Specials 🏮</Text>
            </View>
          </View>
        </View>

        {/* ── 4. Horizontal Tags ────────────────────────────────────── */}
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

        {/* ── 5. Back to Top Button (Sticky) ────────────────────────── */}
        <View style={styles.backToTopSection}>
           <TouchableOpacity style={styles.backToTopBtn}>
              <Text style={styles.backToTopText}>Back to top ⬆️</Text>
           </TouchableOpacity>
        </View>

        {/* ── 6. Amul Banner ────────────────────────────────────────── */}
        <View style={styles.promoBanner}>
           <View style={[styles.promoContent, { backgroundColor: '#108D10' }]}>
              <View style={styles.promoTextCol}>
                 <Text style={styles.promoBrand}>Amul</Text>
                 <Text style={styles.promoTitle}>Cool, Creamy, Completely Amul</Text>
                 <Text style={styles.promoTag}>BEST DEALS</Text>
                 <TouchableOpacity style={styles.promoBtn}>
                    <Text style={styles.promoBtnText}>ORDER NOW</Text>
                 </TouchableOpacity>
              </View>
              <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3050/3050161.png' }} style={styles.promoImg} />
           </View>
        </View>

        {/* ── 7. Category Grid ──────────────────────────────────────── */}
        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>Grocery & Kitchen</Text>
          <View style={styles.gridWrapper}>
            {HOME_CATEGORIES.map(category => (
              <TouchableOpacity key={category.id} style={styles.gridCard}>
                <Text style={[styles.gridTitle, { color: '#2E7D32' }]}>{category.title}</Text>
                <Image source={{ uri: category.image }} style={styles.gridImage} />
                <View style={styles.gridFooter}>
                  <Text style={styles.gridStarts}>Starts at</Text>
                  <Text style={styles.gridPrice}>{category.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 8. 50% OFF ZONE ──────────────────────────────────────── */}
        <View style={styles.offZoneSection}>
          <View style={styles.offZoneHeader}>
             <Text style={styles.offZoneTitle}>50% Off Zone</Text>
             <Text style={styles.offZoneSubtitle}>Half the price, double the joy!</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16 }}>
             {OFF_ZONE_PRODUCTS.map(p => <ProductCard key={p.id} product={p} />)}
             <TouchableOpacity style={styles.seeAllCard}>
                <Text style={styles.seeAllText}>See All</Text>
                <View style={styles.seeAllCircle}>
                   <Text style={{ fontSize: 18, color: '#E91E63' }}>→</Text>
                </View>
             </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* ── 8. Unlock Free Delivery Sticky ──────────────────────────── */}
      <View style={styles.stickyFooter}>
        <View style={styles.freeDeliveryContainer}>
          <View style={styles.scooterIcon}>
             <Text style={{ fontSize: 20 }}>🛵</Text>
          </View>
          <View style={styles.freeDeliveryInfo}>
            <Text style={styles.freeTitle}>Unlock free delivery</Text>
            <Text style={styles.freeSubtitle}>Shop for ₹99</Text>
          </View>
        </View>
      </View>

      <BottomTabs activeTab="Home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: theme.colors.accentBackground,
    paddingTop: theme.spacing.s,
    paddingBottom: theme.spacing.m,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
  },
  speedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boltEmoji: {
    fontSize: 22,
    marginRight: 4,
  },
  speedText: {
    fontSize: 22,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIcon: {
    fontSize: 18,
    color: '#FFF',
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    marginTop: 4,
  },
  addressText: {
    fontSize: theme.typography.size.s,
    color: '#333',
    fontFamily: theme.typography.fontFamily.medium,
    marginRight: 4,
    maxWidth: '85%',
  },
  downArrow: {
    fontSize: 10,
    color: '#333',
  },
  brandSwiper: {
    marginTop: theme.spacing.m,
  },
  brandSwiperContent: {
    paddingHorizontal: theme.spacing.l,
  },
  brandChip: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  brandChipText: {
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: theme.spacing.l,
    marginTop: -10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EEE',
    borderRadius: 12,
    height: 54,
    paddingHorizontal: theme.spacing.m,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  searchDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#EEE',
    marginHorizontal: 10,
  },
  ramadanBadge: {
    backgroundColor: '#F0F8E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ramadanText: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#2E7D32',
  },
  tagsContainer: {
    paddingLeft: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  tag: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 8,
    marginRight: 10,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTag: {
    borderBottomColor: '#000',
  },
  tagText: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#666',
  },
  activeTagText: {
    color: '#000',
    fontFamily: theme.typography.fontFamily.bold,
  },
  mainBanner: {
    height: 180,
    marginHorizontal: theme.spacing.l,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: theme.spacing.l,
    position: 'relative',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
  },
  bannerTitle: {
    fontSize: 28,
    color: '#FFF',
    fontFamily: theme.typography.fontFamily.bold,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    fontSize: 42,
    color: '#FFF',
    fontWeight: '900',
    marginTop: -10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  zeroFeesBox: {
    backgroundColor: '#F0F8E8',
    marginHorizontal: theme.spacing.l,
    borderRadius: 16,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: '#CFD8DC',
  },
  zeroFeesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zeroFeesPrice: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2E7D32',
    marginRight: 20,
    width: 100,
  },
  backToTopSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  backToTopBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backToTopText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
  },
  promoBanner: {
    marginHorizontal: theme.spacing.l,
    marginBottom: 32,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 24,
    overflow: 'hidden',
  },
  promoTextCol: {
    flex: 1,
  },
  promoBrand: {
    fontSize: 14,
    color: '#FFF',
    fontFamily: theme.typography.fontFamily.bold,
    opacity: 0.8,
  },
  promoTitle: {
    fontSize: 22,
    color: '#FFF',
    fontFamily: theme.typography.fontFamily.bold,
    marginVertical: 4,
    lineHeight: 26,
  },
  promoTag: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 16,
  },
  promoBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  promoBtnText: {
    color: '#000',
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
  },
  promoImg: {
    width: 100,
    height: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#333',
    marginBottom: 16,
  },
  gridSection: {
    paddingHorizontal: theme.spacing.l,
    marginBottom: 32,
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridCard: {
    width: (width - 48) / 2,
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    padding: theme.spacing.m,
    marginBottom: 16,
    alignItems: 'center',
  },
  offZoneSection: {
    marginBottom: 32,
  },
  offZoneHeader: {
    paddingHorizontal: theme.spacing.l,
    marginBottom: 16,
  },
  offZoneTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  offZoneSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  seeAllCard: {
    width: (width - 48) / 3,
    height: 200,
    backgroundColor: '#E91E63',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 24,
  },
  seeAllText: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: 16,
  },
  seeAllCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: 10,
    height: 40,
  },
  gridImage: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  gridFooter: {
    alignItems: 'center',
  },
  gridStarts: {
    fontSize: 10,
    color: '#666',
  },
  gridPrice: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 20,
    left: theme.spacing.l,
    right: theme.spacing.l,
    backgroundColor: theme.colors.secondary,
    borderRadius: 16,
    height: 70,
    padding: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 10,
  },
  freeDeliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scooterIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  freeDeliveryInfo: {
    flex: 1,
  },
  freeTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFF',
  },
  freeSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
});
