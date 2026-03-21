import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, SafeAreaView, StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme';
import { AppNavigationProp } from '../navigation/types';
import { ProductCard } from '../components/ProductCard';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
import { IMAGES } from '../assets/hq';

const { width } = Dimensions.get('window');

// --- Static data -----------------------------------------------------------
const BANNER_DATA = [
  {
    id: '1',
    bg: '#0C3B2E',
    tag: 'LIGHTNING DEAL',
    title: 'Grocery\nDelivered\nin 10 Mins',
    sub: 'Fresh produce at your door',
    badge: '40% OFF',
    badgeColor: '#F5A826',
    image: IMAGES.banner_fresh,
  },
  {
    id: '2',
    bg: '#1B3A5C',
    tag: 'TOP BRANDS',
    title: 'Munchies &\nSnacks',
    sub: 'Lays, Oreo, Kurkure & more',
    badge: '₹99 Store',
    badgeColor: '#E45F10',
    image: IMAGES.banner_snacks,
  },
  {
    id: '3',
    bg: '#4A1942',
    tag: 'DAILY ESSENTIALS',
    title: 'Dairy &\nBreakfast',
    sub: 'Milk, eggs, bread & butter',
    badge: '15% OFF',
    badgeColor: '#2E7D32',
    image: IMAGES.banner_dairy,
  },
];

const QUICK_CATS = [
  { id: '1', label: 'Fruits & Veg',  cat: 'Fruits & Vegetables',    image: IMAGES.fruits, bg: '#E8F5E9', color: '#2E7D32' },
  { id: '2', label: 'Dairy & Eggs',  cat: 'Dairy, Bread & Eggs',    image: IMAGES.dairy, bg: '#E3F2FD', color: '#1565C0' },
  { id: '3', label: 'Snacks',        cat: 'Munchies',               image: IMAGES.snacks, bg: '#FFF8E1', color: '#F57F17' },
  { id: '4', label: 'Beverages',     cat: 'Beverages',              image: IMAGES.beverages, bg: '#E8F5E9', color: '#1B5E20' },
  { id: '5', label: 'Breakfast',     cat: 'Breakfast & Sauces',     image: IMAGES.breakfast, bg: '#FBE9E7', color: '#BF360C' },
  { id: '6', label: 'Atta & Rice',   cat: 'Atta, Rice, Oil & Dals', image: IMAGES.atta_rice, bg: '#FFF3E0', color: '#E65100' },
  { id: '7', label: 'Cleaning',      cat: 'Cleaning Essentials',    image: IMAGES.cleaning, bg: '#F3E5F5', color: '#6A1B9A' },
  { id: '8', label: 'Personal Care', cat: 'Personal Care',          image: IMAGES.personal_care, bg: '#E0F7FA', color: '#006064' },
];

const OFFERS = [
  { id: 'o1', text: 'FREE delivery on orders above ₹299', img: IMAGES.icon_box },
  { id: 'o2', text: 'Use WELCOME50 — Flat ₹50 off',       img: IMAGES.icon_coin },
  { id: 'o3', text: 'Pay with UPI, get ₹20 cashback',       img: IMAGES.icon_coin },
];

const CATEGORY_GRID = [
  { id: 'g1', label: 'Fruits & Veg',    image: IMAGES.fruits, cat: 'Fruits & Vegetables' },
  { id: 'g2', label: 'Dairy & Eggs',    image: IMAGES.dairy, cat: 'Dairy, Bread & Eggs' },
  { id: 'g3', label: 'Snacks',          image: IMAGES.snacks, cat: 'Munchies' },
  { id: 'g4', label: 'Atta & Rice',     image: IMAGES.atta_rice, cat: 'Atta, Rice, Oil & Dals' },
  { id: 'g5', label: 'Beverages',       image: IMAGES.beverages, cat: 'Beverages' },
  { id: 'g6', label: 'Home & Cleaning', image: IMAGES.cleaning, cat: 'Cleaning Essentials' },
  { id: 'g7', label: 'Personal Care',   image: IMAGES.personal_care, cat: 'Personal Care' },
  { id: 'g8', label: 'Masala',          image: IMAGES.masala, cat: 'Masala & Spices' },
];

// --- Hero Banner Carousel --------------------------------------------------
const HeroBanner = ({ onShopNow }: { onShopNow: (cat: string) => void }) => {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const SLIDE_W = width - 32;

  useEffect(() => {
    const id = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % BANNER_DATA.length;
        scrollRef.current?.scrollTo({ x: next * SLIDE_W, animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, [SLIDE_W]);

  return (
    <View style={banner.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e =>
          setActive(Math.round(e.nativeEvent.contentOffset.x / SLIDE_W))
        }
      >
        {BANNER_DATA.map(b => (
          <TouchableOpacity
            key={b.id}
            activeOpacity={0.92}
            style={[banner.card, { backgroundColor: b.bg, width: SLIDE_W }]}
            onPress={() => onShopNow('Fruits & Vegetables')}
          >
            <View style={banner.left}>
              <View style={banner.tagPill}>
                <Text style={banner.tagText}>{b.tag}</Text>
              </View>
              <Text style={banner.title}>{b.title}</Text>
              <Text style={banner.sub}>{b.sub}</Text>
              <TouchableOpacity
                style={[banner.btn, { backgroundColor: b.badgeColor }]}
                onPress={() => onShopNow('Fruits & Vegetables')}
              >
                <Text style={banner.btnText}>Shop Now</Text>
              </TouchableOpacity>
            </View>
            <View style={banner.right}>
              <Image source={b.image} style={banner.img} resizeMode="cover" />
              <View style={[banner.badge, { backgroundColor: b.badgeColor }]}>
                <Text style={banner.badgeText}>{b.badge}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={banner.dots}>
        {BANNER_DATA.map((_, i) => (
          <View key={i} style={[banner.dot, i === active && banner.dotActive]} />
        ))}
      </View>
    </View>
  );
};

const banner = StyleSheet.create({
  wrap:      { marginHorizontal: 16, marginTop: 12 },
  card:      { borderRadius: 16, overflow: 'hidden', padding: 18, flexDirection: 'row', alignItems: 'center', height: 165 },
  left:      { flex: 1 },
  tagPill:   { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.18)' },
  tagText:   { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  title:     { color: '#FFF', fontSize: 22, fontWeight: '900', lineHeight: 26, letterSpacing: -0.5 },
  sub:       { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 5 },
  btn:       { marginTop: 12, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  btnText:   { color: '#FFF', fontSize: 12, fontWeight: '800' },
  right:     { width: 115, height: 130, borderRadius: 12, overflow: 'hidden', marginLeft: 8 },
  img:       { width: '100%', height: '100%' },
  badge:     { position: 'absolute', top: 6, right: 6, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  dots:      { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 5 },
  dot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: '#DDD' },
  dotActive: { width: 16, backgroundColor: theme.colors.primary },
});

// --- Section Header --------------------------------------------------------
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}
const SectionHeader = ({ title, subtitle, onSeeAll }: SectionHeaderProps) => (
  <View style={sh.row}>
    <View>
      <Text style={sh.title}>{title}</Text>
      {subtitle ? <Text style={sh.sub}>{subtitle}</Text> : null}
    </View>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={sh.seeAll}>See all →</Text>
      </TouchableOpacity>
    )}
  </View>
);
const sh = StyleSheet.create({
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#0D1B14', letterSpacing: -0.3 },
  sub:   { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  seeAll:{ fontSize: 13, fontWeight: '700', color: theme.colors.primary },
});

// --- Horizontal Product Row ------------------------------------------------
interface Product {
  id: string | number;
  name: string;
  price: number | string;
  original_price?: number | string;
  image_url: any;
  unit?: string;
}

interface ProductRowProps {
  products: Product[];
  loading: boolean;
  onSeeAll?: () => void;
}
const ProductRow = ({ products, loading, onSeeAll }: ProductRowProps) => {
  if (loading) {
    return (
      <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}
    >
      {products.map(p => {
        const discPct = p.original_price
          ? Math.round((1 - Number(p.price) / Number(p.original_price)) * 100)
          : 0;
        return (
          <ProductCard
            key={p.id}
            product={{
              id: String(p.id),
              name: p.name,
              weight: p.unit || '1 pack',
              price: Number(p.price),
              originalPrice: p.original_price ? Number(p.original_price) : undefined,
              image: p.image_url,
              deliveryTime: '10 mins',
              discountTag: discPct > 0 ? discPct.toString() + '% OFF' : undefined,
            }}
          />
        );
      })}
      {onSeeAll && (
        <TouchableOpacity style={pr.seeAllCard} onPress={onSeeAll}>
          <Image source={IMAGES.icon_box} style={pr.seeAllImg} resizeMode="contain" />
          <Text style={pr.seeAllText}>See{'\n'}All</Text>
          <Text style={pr.seeAllArrow}>→</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};
const pr = StyleSheet.create({
  seeAllCard:  { width: 110, height: 185, borderRadius: 14, backgroundColor: '#F0F7F2', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1.5, borderColor: theme.colors.primary, borderStyle: 'dashed' },
  seeAllImg:  { width: 32, height: 32, marginBottom: 6 },
  seeAllText:  { fontSize: 13, fontWeight: '800', color: theme.colors.primary, textAlign: 'center', lineHeight: 17 },
  seeAllArrow: { fontSize: 18, color: theme.colors.primary, marginTop: 4 },
});

// --- Main HomeScreen -------------------------------------------------------
export const HomeScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const user = useAuthStore(s => s.user);
  const scrollRef = useRef<ScrollView>(null);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any>(null); // Keeping any for now due to complex nested API response, but improved usage below
  const [offZoneProducts, setOffZoneProducts]   = useState<Product[]>([]);
  const [munchiesProducts, setMunchiesProducts] = useState<Product[]>([]);
  const [dairyProducts, setDairyProducts]       = useState<Product[]>([]);
  const [cleaningProducts, setCleaningProducts] = useState<Product[]>([]);
  const [offerIndex, setOfferIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setOfferIndex(i => (i + 1) % OFFERS.length), 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchHome = async () => {
      try {
        const [vegRes, munchRes, dairyRes, cleanRes] = await Promise.all([
          api.get('/products', { params: { category: 'Fruits & Vegetables' } }),
          api.get('/products', { params: { category: 'Munchies' } }),
          api.get('/products', { params: { category: 'Dairy, Bread & Eggs' } }),
          api.get('/products', { params: { category: 'Cleaning Essentials' } }),
        ]);
        if (Array.isArray(vegRes.data))   setOffZoneProducts(vegRes.data.slice(0, 8));
        if (Array.isArray(munchRes.data)) setMunchiesProducts(munchRes.data.slice(0, 8));
        if (Array.isArray(dairyRes.data)) setDairyProducts(dairyRes.data.slice(0, 8));
        if (Array.isArray(cleanRes.data)) setCleaningProducts(cleanRes.data.slice(0, 8));
      } catch (err) {
        console.error('[HomeScreen] fetch error:', err);
      } finally {
        setLoading(false);
      }
      try {
        const ordersRes = await api.get('/orders');
        const active = Array.isArray(ordersRes.data)
          ? ordersRes.data.find((o: any) =>
              ['placed', 'preparing', 'ready', 'pickup'].includes(o.status))
          : null;
        setActiveOrder(active || null);
      } catch {
        // not logged in — silently ignore
      }
    };
    fetchHome();
  }, []);

  const goTo = (screen: any, params?: any) => navigation.navigate(screen, params);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* STICKY HEADER */}
      <View style={s.header}>
        {/* Row 1: Location + Delivery badge + Avatar */}
        <View style={s.headerRow1}>
          <TouchableOpacity style={s.locationBtn} activeOpacity={0.8}>
            <View style={s.locationIcon}>
              <MaterialCommunityIcons name="map-marker" size={14} color={theme.colors.primary} />
            </View>
            <View style={s.locationTexts}>
              <Text style={s.locationLabel}>DELIVER TO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={s.locationName} numberOfLines={1}>
                  {user?.address?.split(',')[0] || 'Select location'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={14} color={theme.colors.primary} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={s.headerRight}>
            <View style={s.deliveryBadge}>
              <MaterialCommunityIcons name="clock-fast" size={12} color="#0D1B14" />
              <Text style={s.deliveryTime}>10 min</Text>
            </View>
            <TouchableOpacity style={s.avatarBtn} onPress={() => goTo('Settings')}>
              <View style={s.avatar}>
                <MaterialCommunityIcons name="account-circle" size={16} color={theme.colors.primary} />
              </View>
              <View style={s.profileMeta}>
                <Text style={s.profileLabel}>Profile</Text>
                <Text style={s.profileName} numberOfLines={1}>{user?.name?.split(' ')[0] ?? 'User'}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.refreshPill}>
          <MaterialCommunityIcons name="sparkles" size={12} color="#0B6E4F" />
          <Text style={s.refreshPillText}>UI Refresh Live</Text>
        </View>

        {/* Row 2: Search bar */}
        <TouchableOpacity style={s.searchBar} onPress={() => goTo('SearchTab')} activeOpacity={0.8}>
          <Image source={IMAGES.icon_search} style={s.searchIconImg} resizeMode="contain" />
          <Text style={s.searchPlaceholder}>Search "milk", "chips", "atta"…</Text>
          <View style={s.micBtn}>
            <Image source={IMAGES.icon_mic} style={{ width: 18, height: 18 }} resizeMode="contain" />
          </View>
        </TouchableOpacity>

        {/* Row 3: Offer ticker */}
        <View style={s.offerTicker}>
          <Image source={OFFERS[offerIndex].img} style={s.offerIconImg} resizeMode="contain" />
          <Text style={s.offerText}>{OFFERS[offerIndex].text}</Text>
        </View>
      </View>

      {/* SCROLL BODY */}
      <ScrollView ref={scrollRef} style={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Active order live tracker */}
        {activeOrder && (
          <TouchableOpacity
            style={s.liveOrder}
            onPress={() => goTo('OrderTracking', { orderId: activeOrder.id })}
          >
            <View style={s.liveOrderLeft}>
              <Image
                source={activeOrder.status === 'pickup'
                  ? IMAGES.icon_bike
                  : activeOrder.status === 'ready'
                  ? IMAGES.icon_box
                  : IMAGES.icon_box}
                style={s.liveOrderImg}
                resizeMode="contain"
              />
              <View>
                <Text style={s.liveOrderTitle}>
                  {activeOrder.status === 'pickup'
                    ? 'Driver on the way!'
                    : activeOrder.status === 'ready'
                    ? 'Order ready for pickup'
                    : 'Preparing your order'}
                </Text>
                <Text style={s.liveOrderSub}>Tap to track live</Text>
              </View>
            </View>
            <View style={s.trackPill}>
              <Text style={s.trackText}>TRACK</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Hero banner */}
        <HeroBanner onShopNow={cat => goTo('ProductList', { categoryName: cat })} />

        {/* Quick category pills */}
        <View style={{ marginTop: 20 }}>
          <SectionHeader title="Shop by Category" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.quickCatRow}
          >
            {QUICK_CATS.map(q => (
              <TouchableOpacity
                key={q.id}
                style={[s.quickCat, { backgroundColor: q.bg }]}
                onPress={() => goTo('ProductList', { categoryName: q.cat })}
                activeOpacity={0.8}
              >
                <Image source={q.image} style={s.quickCatImg} resizeMode="cover" />
                <Text style={[s.quickCatLabel, { color: q.color }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 4x2 category image grid */}
        <View style={s.catGridSection}>
          <View style={s.catGrid}>
            {CATEGORY_GRID.map(g => (
              <TouchableOpacity
                key={g.id}
                style={s.catGridCard}
                onPress={() => g.cat ? goTo('ProductList', { categoryName: g.cat }) : undefined}
                activeOpacity={0.85}
              >
                <View style={s.catGridImgWrap}>
                  <Image source={g.image} style={s.catGridImg} resizeMode="cover" />
                  <View style={s.catGridOverlay} />
                </View>
                <Text style={s.catGridLabel} numberOfLines={2}>{g.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Deal strip */}
        <View style={s.dealStrip}>
          <View style={s.dealStripLeft}>
            <Text style={s.dealStripTag}>TODAY'S DEAL</Text>
            <Text style={s.dealStripTitle}>50% OFF on{'\n'}Fruits & Veggies</Text>
          </View>
          <View style={s.dealStripRight}>
            <Image
              source={IMAGES.fruits}
              style={s.dealStripImg}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={s.dealStripBtn}
              onPress={() => goTo('ProductList', { categoryName: 'Fruits & Vegetables' })}
            >
              <Text style={s.dealStripBtnText}>Grab Deal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fruits & Vegetables */}
        <View style={s.section}>
          <SectionHeader
            title="Fruits & Vegetables"
            subtitle="Fresh, farm-to-table daily"
            onSeeAll={() => goTo('ProductList', { categoryName: 'Fruits & Vegetables' })}
          />
          <ProductRow
            products={offZoneProducts}
            loading={loading}
            onSeeAll={() => goTo('ProductList', { categoryName: 'Fruits & Vegetables' })}
          />
        </View>

        {/* Zero fee bar */}
        <View style={s.zeroFeeBar}>
          <Image source={IMAGES.icon_bike} style={s.zeroFeeIconImg} resizeMode="contain" />
          <Text style={s.zeroFeeText}>FREE delivery  ·  Zero handling fee  ·  Zero surge pricing</Text>
        </View>

        {/* Munchies & Snacks */}
        <View style={s.section}>
          <SectionHeader
            title="Munchies & Snacks"
            subtitle="Crispy, crunchy & yum!"
            onSeeAll={() => goTo('ProductList', { categoryName: 'Munchies' })}
          />
          <ProductRow
            products={munchiesProducts}
            loading={loading}
            onSeeAll={() => goTo('ProductList', { categoryName: 'Munchies' })}
          />
        </View>

        {/* Promo pair */}
        <View style={s.promoRow}>
          <TouchableOpacity
            style={[s.promoCard, { backgroundColor: '#E8F5E9' }]}
            onPress={() => goTo('ProductList', { categoryName: 'Dairy, Bread & Eggs' })}
          >
            <Text style={s.promoTitle}>Dairy & Eggs</Text>
            <Text style={s.promoSub}>Fresh every morning</Text>
            <Text style={s.promoDiscount}>15% OFF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.promoCard, { backgroundColor: '#FFF8E1' }]}
            onPress={() => goTo('ProductList', { categoryName: 'Cleaning Essentials' })}
          >
            <Text style={s.promoTitle}>Home Care</Text>
            <Text style={s.promoSub}>Top brands, best prices</Text>
            <Text style={s.promoDiscount}>Up to 30% OFF</Text>
          </TouchableOpacity>
        </View>

        {/* Dairy & Breakfast */}
        <View style={s.section}>
          <SectionHeader
            title="Dairy & Breakfast"
            subtitle="Milk, eggs, bread & butter"
            onSeeAll={() => goTo('ProductList', { categoryName: 'Dairy, Bread & Eggs' })}
          />
          <ProductRow
            products={dairyProducts}
            loading={loading}
            onSeeAll={() => goTo('ProductList', { categoryName: 'Dairy, Bread & Eggs' })}
          />
        </View>

        {/* Home & Cleaning */}
        <View style={s.section}>
          <SectionHeader
            title="Home & Cleaning"
            subtitle="Sparkling clean every day"
            onSeeAll={() => goTo('ProductList', { categoryName: 'Cleaning Essentials' })}
          />
          <ProductRow
            products={cleaningProducts}
            loading={loading}
            onSeeAll={() => goTo('ProductList', { categoryName: 'Cleaning Essentials' })}
          />
        </View>

        {/* Trust footer */}
        <View style={s.trustSection}>
          <Text style={s.trustTitle}>Why customers trust us</Text>
          <View style={s.trustGrid}>
            {[
              { img: IMAGES.fruits, label: '100% Fresh', sub: 'Daily sourced', bg: '#ECFDF3' },
              { img: IMAGES.icon_bike, label: '10 Min Delivery', sub: 'Quick dispatch', bg: '#EFF6FF' },
              { img: IMAGES.icon_coin, label: 'Best Prices', sub: 'Great value deals', bg: '#FFF7ED' },
              { img: IMAGES.icon_box, label: 'Easy Returns', sub: 'Simple refunds', bg: '#F5F3FF' },
            ].map(t => (
              <View key={t.label} style={s.trustCard}>
                <View style={[s.trustIconWrap, { backgroundColor: t.bg }]}>
                  <Image source={t.img} style={s.trustImg} resizeMode="contain" />
                </View>
                <Text style={s.trustLabel}>{t.label}</Text>
                <Text style={s.trustSub}>{t.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles ----------------------------------------------------------------
const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F5F7FA' },
  scroll: { flex: 1 },

  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF3',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    zIndex: 10,
  },
  headerRow1:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  locationBtn:   { flexDirection: 'row', alignItems: 'center', flex: 1, backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E6ECF5', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 9 },
  locationIcon:  { width: 24, height: 24, borderRadius: 12, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  locationTexts: { flex: 1 },
  locationLabel: { fontSize: 10, color: '#8A94A6', fontWeight: '700', letterSpacing: 0.35 },
  locationName:  { fontSize: 13, fontWeight: '800', color: '#0D1B14', maxWidth: width * 0.34 },
  chevron:       { fontSize: 11, color: theme.colors.primary, fontWeight: '900' },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEFC2', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 16, gap: 3, borderWidth: 1, borderColor: '#FAD76A' },
  deliveryBoltImg: { width: 14, height: 14, marginRight: 3, tintColor: '#0D1B14' },
  deliveryTime:  { color: '#0D1B14', fontSize: 11, fontWeight: '900' },
  avatarBtn:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E6ECF5', borderRadius: 12, paddingVertical: 5, paddingHorizontal: 7, gap: 5, maxWidth: 118 },
  avatar:        { width: 26, height: 26, borderRadius: 13, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: theme.colors.primary, fontSize: 13, fontWeight: '900' },
  profileMeta:   { flex: 1 },
  profileLabel:  { fontSize: 8, color: '#8A94A6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.35 },
  profileName:   { fontSize: 11, color: '#0D1B14', fontWeight: '800' },
  refreshPill:   { alignSelf: 'flex-start', marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#EAF8F1', borderWidth: 1, borderColor: '#CDEEDD', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  refreshPillText: { fontSize: 11, color: '#0B6E4F', fontWeight: '800' },

  searchBar:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F7F7', marginHorizontal: 16, marginBottom: 10, height: 44, borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#EBEBEB' },
  searchIconImg:     { width: 18, height: 18, marginRight: 8 },
  searchPlaceholder: { flex: 1, fontSize: 13, color: '#9E9E9E', fontWeight: '500' },
  micBtn:            { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F4EF', alignItems: 'center', justifyContent: 'center' },

  offerTicker: { backgroundColor: theme.colors.primary, paddingHorizontal: 16, paddingVertical: 7, flexDirection: 'row', alignItems: 'center' },
  offerIconImg: { width: 16, height: 16, marginRight: 8, tintColor: '#FFF' },
  offerText:   { color: '#FFFFFF', fontSize: 11, fontWeight: '600', flex: 1 },

  liveOrder:      { marginHorizontal: 16, marginTop: 14, backgroundColor: '#0D1B14', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4 },
  liveOrderLeft:  { flexDirection: 'row', alignItems: 'center', flex: 1 },
  liveOrderImg:   { width: 30, height: 30, marginRight: 12 },
  liveOrderTitle: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  liveOrderSub:   { color: '#9E9E9E', fontSize: 11, marginTop: 2 },
  trackPill:      { backgroundColor: '#F5A826', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  trackText:      { color: '#0D1B14', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  quickCatRow:   { paddingHorizontal: 16, paddingBottom: 4, gap: 8 },
  quickCat:      { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 12, minWidth: 72 },
  quickCatImg:   { width: 44, height: 44, borderRadius: 10, marginBottom: 6, overflow: 'hidden' } as any,
  quickCatLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },

  catGridSection:  { marginHorizontal: 16, marginTop: 20, marginBottom: 4 },
  catGrid:         { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  catGridCard:     { width: (width - 52) / 4, marginBottom: 10, alignItems: 'center' },
  catGridImgWrap:  { width: (width - 52) / 4, height: (width - 52) / 4, borderRadius: 14, overflow: 'hidden' },
  catGridImg:      { width: '100%', height: '100%' },
  catGridOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.12)' },
  catGridLabel:    { fontSize: 10, fontWeight: '700', color: '#0D1B14', textAlign: 'center', marginTop: 5, lineHeight: 13 },

  dealStrip:       { marginHorizontal: 16, marginTop: 20, backgroundColor: theme.colors.primary, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
  dealStripLeft:   { flex: 1 },
  dealStripTag:    { color: '#F5A826', fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  dealStripTitle:  { color: '#FFF', fontSize: 20, fontWeight: '900', lineHeight: 24 },
  dealStripRight:  { alignItems: 'center' },
  dealStripImg:    { width: 70, height: 70, borderRadius: 12, marginBottom: 8 },
  dealStripBtn:    { backgroundColor: '#F5A826', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  dealStripBtnText:{ color: '#0D1B14', fontSize: 12, fontWeight: '900' },

  section: { marginTop: 24, backgroundColor: '#FFFFFF', paddingTop: 16, paddingBottom: 4 },

  zeroFeeBar:  { backgroundColor: '#E8F5E9', paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center' },
  zeroFeeIconImg: { width: 20, height: 20, marginRight: 8 },
  zeroFeeText: { fontSize: 12, fontWeight: '700', color: '#2E7D32', flex: 1 },

  promoRow:      { flexDirection: 'row', paddingHorizontal: 16, marginTop: 16, gap: 12 },
  promoCard:     { flex: 1, borderRadius: 14, padding: 14 },
  promoTitle:    { fontSize: 13, fontWeight: '800', color: '#0D1B14' },
  promoSub:      { fontSize: 11, color: '#6B7280', marginTop: 3 },
  promoDiscount: { fontSize: 13, fontWeight: '900', color: theme.colors.primary, marginTop: 6 },

  trustSection: { backgroundColor: '#FFFFFF', marginTop: 16, marginHorizontal: 16, borderRadius: 16, paddingHorizontal: 12, paddingTop: 14, paddingBottom: 12, borderWidth: 1, borderColor: '#EAF0F6' },
  trustTitle: { fontSize: 13, fontWeight: '800', color: '#0D1B14', marginBottom: 10, paddingHorizontal: 4 },
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  trustCard: { width: '48.5%', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: '#EEF2F6', backgroundColor: '#FCFDFE', alignItems: 'center' },
  trustIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  trustImg: { width: 18, height: 18 },
  trustLabel: { fontSize: 11, fontWeight: '800', color: '#0D1B14', textAlign: 'center' },
  trustSub: { fontSize: 10, color: '#738093', textAlign: 'center', marginTop: 2, lineHeight: 13 },
});
