import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, TextInput, SafeAreaView, StatusBar, ActivityIndicator,
  FlatList, Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { useGroceryCartStore } from '../store/useGroceryCartStore';
import { theme } from '../theme';
import { IMAGES } from '../assets/hq';

const { width } = Dimensions.get('window');

type Section = 'grocery' | 'daily' | 'household' | 'tools' | 'fashion';

interface Category {
  id: string;
  name: string;
  image: any;
  count: number;
  section: Section;
}

const SECTIONS = [
  { key: 'grocery'   as Section, label: 'Grocery',         img: IMAGES.icon_box, bg: '#E8F5E9', active: '#163D26' },
  { key: 'daily'     as Section, label: 'Daily Essentials',img: IMAGES.cleaning, bg: '#FFF8E1', active: '#F57F17' },
  { key: 'household' as Section, label: 'Household',       img: IMAGES.icon_box, bg: '#E3F2FD', active: '#1565C0' },
  { key: 'tools'     as Section, label: 'Tools',           img: IMAGES.icon_box, bg: '#F3E5F5', active: '#6A1B9A' },
  { key: 'fashion'   as Section, label: 'Fashion',         img: IMAGES.personal_care,bg: '#FCE4EC', active: '#C62828' },
];

const FALLBACK: Category[] = [
  { id:'g1', section:'grocery',   name:'Fruits & Vegetables',    image: IMAGES.fruits, count:120 },
  { id:'g2', section:'grocery',   name:'Dairy, Bread & Eggs',    image: IMAGES.dairy, count:105 },
  { id:'g3', section:'grocery',   name:'Munchies',               image: IMAGES.snacks, count:14 },
  { id:'g4', section:'grocery',   name:'Beverages',              image: IMAGES.beverages, count:120 },
  { id:'g5', section:'grocery',   name:'Bakery & Biscuits',      image: IMAGES.snacks, count:78 },
  { id:'g6', section:'grocery',   name:'Atta, Rice, Oil & Dals', image: IMAGES.atta_rice, count:200 },
  { id:'g7', section:'grocery',   name:'Masala & Spices',        image: IMAGES.masala, count:130 },
  { id:'g8', section:'grocery',   name:'Frozen & Instant Food',  image: IMAGES.snacks, count:65 },
  { id:'g9', section:'grocery',   name:'Breakfast & Sauces',     image: IMAGES.breakfast, count:108 },
  { id:'g10',section:'grocery',   name:'Baby Care',              image: IMAGES.personal_care, count:60 },
  { id:'g11',section:'grocery',   name:'Pet Care',               image: IMAGES.snacks, count:45 },
  { id:'g12',section:'grocery',   name:'Meat, Fish & Eggs',      image: IMAGES.snacks, count:90 },
  { id:'d1', section:'daily',     name:'Cleaning Essentials',    image: IMAGES.cleaning, count:110 },
  { id:'d2', section:'daily',     name:'Personal Care',          image: IMAGES.personal_care, count:90 },
  { id:'d3', section:'daily',     name:'Laundry Detergents',     image: IMAGES.cleaning, count:42 },
  { id:'d4', section:'daily',     name:'Skincare & Haircare',    image: IMAGES.personal_care, count:75 },
  { id:'d5', section:'daily',     name:'Toilet & Floor Cleaners',image: IMAGES.cleaning, count:35 },
  { id:'h1', section:'household', name:'Kitchen Storage',        image: IMAGES.cleaning, count:80 },
  { id:'h2', section:'household', name:'Cookware & Pans',        image: IMAGES.cleaning, count:65 },
  { id:'h3', section:'household', name:'Containers & Boxes',     image: IMAGES.icon_box, count:55 },
  { id:'h4', section:'household', name:'Brooms & Mops',          image: IMAGES.cleaning, count:40 },
  { id:'h5', section:'household', name:'Organizers & Shelves',   image: IMAGES.icon_box, count:48 },
  { id:'t1', section:'tools',     name:'Hand Tools',             image: IMAGES.icon_box, count:70 },
  { id:'t2', section:'tools',     name:'Adhesives & Tapes',      image: IMAGES.icon_box, count:45 },
  { id:'t3', section:'tools',     name:'Locks & Safety',         image: IMAGES.icon_box, count:38 },
  { id:'t4', section:'tools',     name:'Electrical Fittings',    image: IMAGES.icon_box, count:60 },
  { id:'f1', section:'fashion',   name:"Men's T-Shirts",         image: IMAGES.personal_care, count:200 },
  { id:'f2', section:'fashion',   name:"Women's Kurtas",         image: IMAGES.personal_care, count:180 },
  { id:'f3', section:'fashion',   name:'Kids Clothing',          image: IMAGES.personal_care, count:150 },
  { id:'f4', section:'fashion',   name:'Footwear',               image: IMAGES.personal_care, count:120 },
  { id:'f5', section:'fashion',   name:'Accessories',             image: IMAGES.personal_care, count:95 },
];

const DEALS = [
  { id:'1', cat:'Fruits & Vegetables', tag:'Fresh Produce', pct:'40', bg:'#1B5E20', img: IMAGES.fruits },
  { id:'2', cat:'Munchies',            tag:'Snack Attack',  pct:'25', bg:'#B71C1C', img: IMAGES.snacks },
  { id:'3', cat:'Dairy, Bread & Eggs', tag:'Morning Must',  pct:'15', bg:'#1A237E', img: IMAGES.dairy },
];

const CARD_W = (width - 44) / 3;

export const InstamartHomeScreen = () => {
  const navigation = useNavigation<any>();
  const [categories, setCategories] = useState<Category[]>(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('grocery');
  const [dealIdx, setDealIdx] = useState(0);
  const dealRef = useRef<ScrollView>(null);
  const cartItems = useGroceryCartStore(s => s.items);
  const cartTotal = useGroceryCartStore(s => s.total);

  useEffect(() => {
    const id = setInterval(() => {
      setDealIdx(prev => {
        const next = (prev + 1) % DEALS.length;
        dealRef.current?.scrollTo({ x: next * (width - 32), animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/grocery/categories');
        const cats = (data.categories ?? data) as any[];
        if (Array.isArray(cats) && cats.length > 0) {
          setCategories(cats.map((c, i) => ({
            id: String(c.id ?? c._id ?? c.category_id ?? c.categoryId ?? i),
            name: c.name ?? c.category_name ?? '',
            image: c.image_url ?? c.imageUrl ?? c.image ?? 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=75',
            count: c.count ?? c.product_count ?? 0,
            section: (c.section as Section) ?? 'grocery',
          })));
        }
      } catch { /* use fallback */ }
      finally { setLoading(false); }
    })();
  }, []);

  const visible = useCallback(() => {
    const base = categories.filter(c => c.section === activeSection);
    if (!search.trim()) return base;
    return base.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [categories, activeSection, search]);

  const activeMeta = SECTIONS.find(s => s.key === activeSection)!;

  const renderCat = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[cat.card, { width: CARD_W }]}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('InstamartCategory', { categoryId: item.id, categoryName: item.name })}
    >
      <View style={cat.imgWrap}>
        <Image source={item.image} style={cat.img} resizeMode="cover" />
        <View style={cat.overlay} />
      </View>
      <Text style={cat.name} numberOfLines={2}>{item.name}</Text>
      {item.count > 0 && <Text style={cat.count}>{item.count}+ items</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.logo}>F&G</Text>
          <View style={s.logoTag}>
            <Text style={s.logoTagText}>instamart</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <View style={s.deliveryPill}>
            <Image source={IMAGES.icon_bike} style={s.deliveryImg} resizeMode="contain" />
            <Text style={s.deliveryText}>Under 40 min</Text>
          </View>
          <TouchableOpacity style={s.cartBtn} onPress={() => navigation.navigate('GroceryCart')}>
            <Image source={IMAGES.icon_box} style={s.cartImg} resizeMode="contain" />
            {cartItems.length > 0 && (
              <View style={s.cartBadge}>
                <Text style={s.cartBadgeText}>{cartItems.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchWrap}>
        <Image source={IMAGES.icon_search} style={s.searchIconImg} resizeMode="contain" />
        <TextInput
          style={s.searchInput}
          placeholder={`Search in ${activeMeta.label}…`}
          placeholderTextColor="#9E9E9E"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={s.clearBtn}>
            <Text style={s.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll} contentContainerStyle={s.tabsContent}>
        {SECTIONS.map(sec => {
          const active = sec.key === activeSection;
          return (
            <TouchableOpacity
              key={sec.key}
              onPress={() => { setActiveSection(sec.key); setSearch(''); }}
              style={[s.tab, active && { backgroundColor: sec.active, borderColor: sec.active }]}
              activeOpacity={0.8}
            >
              <Image source={sec.img} style={[s.tabImg, active && s.tabImgActive]} resizeMode="contain" />
              <Text style={[s.tabLabel, active && s.tabLabelActive]}>{sec.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cartItems.length > 0 ? 176 : 100 }}
      >

        {/* Deal banner carousel */}
        <View style={s.dealWrap}>
          <ScrollView
            ref={dealRef}
            horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setDealIdx(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
          >
            {DEALS.map(d => (
              <TouchableOpacity
                key={d.id}
                style={[s.dealCard, { backgroundColor: d.bg, width: width - 32 }]}
                onPress={() => navigation.navigate('ProductList', { categoryName: d.cat })}
                activeOpacity={0.9}
              >
                <View style={s.dealLeft}>
                  <Text style={s.dealTag}>{d.tag}</Text>
                  <Text style={s.dealPct}>{d.pct}%{'\n'}OFF</Text>
                  <TouchableOpacity
                    style={s.dealBtn}
                    onPress={() => navigation.navigate('ProductList', { categoryName: d.cat })}
                  >
                    <Text style={s.dealBtnText}>Shop Now</Text>
                  </TouchableOpacity>
                </View>
                <Image source={d.img} style={s.dealImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={s.dealDots}>
            {DEALS.map((_,i) => (
              <View key={i} style={[s.dealDot, i === dealIdx && s.dealDotActive]} />
            ))}
          </View>
        </View>

        {/* Brands strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.brandsStrip} contentContainerStyle={s.brandsStripContent}>
          {['Amul','Nestle','Haldiram','ITC','Britannia','Patanjali','MTR','Tata','Godrej','HUL'].map(b => (
            <View key={b} style={s.brandPill}>
              <Text style={s.brandText}>{b}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Category grid */}
        <View style={s.catSection}>
          <View style={s.catHeader}>
            <Text style={s.catTitle}>
              {activeMeta.label}
            </Text>
            {!search && <Text style={s.catCount}>{visible().length} categories</Text>}
          </View>
          {loading ? (
            <ActivityIndicator color={activeMeta.active} style={{ marginTop: 32, marginBottom: 32 }} />
          ) : (
            <FlatList
              data={visible()}
              keyExtractor={(it, idx) => it.id ?? String(idx)}
              numColumns={3}
              renderItem={renderCat}
              scrollEnabled={false}
              contentContainerStyle={s.grid}
              columnWrapperStyle={s.catRow}
              ListEmptyComponent={
                <Text style={s.emptyTxt}>No categories found for "{search}"</Text>
              }
            />
          )}
        </View>

        {/* Trust benefits */}
        <View style={s.promisesSection}>
          <Text style={s.promisesTitle}>Why shoppers love Instamart</Text>
          <View style={s.promisesGrid}>
            {[
              { img: IMAGES.fruits, t: '100% Fresh', s: 'Daily sourced produce', bg: '#ECFDF3' },
              { img: IMAGES.icon_bike, t: '10 Min Delivery', s: 'Lightning fast dispatch', bg: '#EFF6FF' },
              { img: IMAGES.icon_coin, t: 'Best Prices', s: 'Top savings every day', bg: '#FFF7ED' },
              { img: IMAGES.icon_box, t: 'Easy Returns', s: 'Hassle-free refunds', bg: '#F5F3FF' },
            ].map((p) => (
              <View key={p.t} style={s.promiseCard}>
                <View style={[s.promiseIconWrap, { backgroundColor: p.bg }]}>
                  <Image source={p.img} style={s.promiseImg} resizeMode="contain" />
                </View>
                <Text style={s.promiseTitle}>{p.t}</Text>
                <Text style={s.promiseSub}>{p.s}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* Sticky cart bar */}
      {cartItems.length > 0 && (
        <TouchableOpacity style={s.cartBar} onPress={() => navigation.navigate('GroceryCart')} activeOpacity={0.92}>
          <View style={s.cartBarLeft}>
            <View style={s.cartBarBadge}>
              <Text style={s.cartBarBadgeText}>{cartItems.length}</Text>
            </View>
            <Text style={s.cartBarLabel}>item{cartItems.length > 1 ? 's' : ''} in cart</Text>
          </View>
          <View style={s.cartBarRight}>
            <Text style={s.cartBarAmount}>
              {'\u20B9'}{(cartTotal() / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            <Text style={s.cartBarCta}> View Cart →</Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const cat = StyleSheet.create({
  card:    { alignItems: 'center', marginBottom: 4 },
  imgWrap: { width: '100%', aspectRatio: 1, borderRadius: 14, overflow: 'hidden', marginBottom: 6 },
  img:     { width: '100%', height: '100%' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.08)' },
  name:    { fontSize: 11, fontWeight: '700', color: '#0D1B14', textAlign: 'center', lineHeight: 14 },
  count:   { fontSize: 10, color: '#9E9E9E', marginTop: 2 },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEB' },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo:         { fontSize: 22, fontWeight: '900', color: theme.colors.primary, letterSpacing: -1 },
  logoTag:      { backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  logoTagText:  { color: '#FFF', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deliveryPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  deliveryEmoji:{ fontSize: 12 },
  deliveryImg:  { width: 16, height: 16 },
  deliveryText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  cartBtn:      { padding: 6, position: 'relative' },
  cartEmoji:    { fontSize: 24 },
  cartImg:      { width: 26, height: 26 },
  cartBadge:    { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#F5A826', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cartBadgeText:{ fontSize: 9, fontWeight: '900', color: '#0D1B14' },

  searchWrap:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F7F7', marginHorizontal: 16, marginVertical: 10, height: 44, borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: '#EBEBEB' },
  searchIconImg:{ width: 18, height: 18, marginRight: 8 },
  searchIcon:   { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#0D1B14' },
  clearBtn:    { padding: 4 },
  clearText:   { fontSize: 14, color: '#9E9E9E' },

  tabsScroll:  { maxHeight: 50, backgroundColor: '#FFF' },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  tab:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD', backgroundColor: '#FFF', gap: 5 },
  tabEmoji:     { fontSize: 13 },
  tabImg:       { width: 16, height: 16, tintColor: undefined },
  tabImgActive: { tintColor: '#FFF' },
  tabLabel:    { fontSize: 12, fontWeight: '600', color: '#666' },
  tabLabelActive:{ color: '#FFF' },

  dealWrap:      { marginHorizontal: 16, marginTop: 12 },
  dealCard:      { borderRadius: 16, overflow: 'hidden', height: 150, flexDirection: 'row', alignItems: 'center', padding: 18 },
  dealLeft:      { flex: 1 },
  dealTag:       { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  dealPct:       { color: '#FFF', fontSize: 36, fontWeight: '900', lineHeight: 38 },
  dealBtn:       { marginTop: 12, backgroundColor: '#F5A826', borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14, alignSelf: 'flex-start' },
  dealBtnText:   { color: '#0D1B14', fontSize: 12, fontWeight: '900' },
  dealImg:       { width: 130, height: 130, borderRadius: 12 },
  dealDots:      { flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 5 },
  dealDot:       { width: 5, height: 5, borderRadius: 3, backgroundColor: '#DDD' },
  dealDotActive: { width: 16, backgroundColor: theme.colors.primary },

  brandsStrip:       { maxHeight: 50, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEB' },
  brandsStripContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  brandPill:         { backgroundColor: '#F5F7FA', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#EBEBEB' },
  brandText:         { fontSize: 11, fontWeight: '700', color: '#333' },

  catSection:  { backgroundColor: '#FFF', marginTop: 8, paddingTop: 16, paddingBottom: 8 },
  catHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 14 },
  catTitle:    { fontSize: 17, fontWeight: '800', color: '#0D1B14' },
  catCount:    { fontSize: 12, color: '#9E9E9E' },
  grid:        { paddingHorizontal: 12, paddingTop: 4 },
  catRow:      { justifyContent: 'space-between', marginBottom: 10 },
  emptyTxt:    { textAlign: 'center', color: '#9E9E9E', padding: 24, fontSize: 13 },

  promisesSection: { backgroundColor: '#FFF', marginTop: 10, marginHorizontal: 16, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 14, borderWidth: 1, borderColor: '#EAF0F6' },
  promisesTitle: { fontSize: 13, fontWeight: '800', color: '#0D1B14', marginBottom: 10, paddingHorizontal: 4 },
  promisesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  promiseCard: { width: '48.5%', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: '#EEF2F6', backgroundColor: '#FCFDFE', alignItems: 'center' },
  promiseIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  promiseImg: { width: 18, height: 18 },
  promiseTitle: { fontSize: 11, fontWeight: '800', color: '#0D1B14', textAlign: 'center' },
  promiseSub: { fontSize: 10, color: '#738093', textAlign: 'center', marginTop: 2, lineHeight: 13 },

  cartBar:       { position: 'absolute', bottom: Platform.OS === 'ios' ? 16 : 74, left: 16, right: 16, backgroundColor: theme.colors.primary, borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  cartBarLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartBarBadge:  { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F5A826', alignItems: 'center', justifyContent: 'center' },
  cartBarBadgeText:{ fontSize: 13, fontWeight: '900', color: '#0D1B14' },
  cartBarLabel:  { color: '#FFF', fontSize: 13, fontWeight: '600' },
  cartBarRight:  { flexDirection: 'row', alignItems: 'center' },
  cartBarAmount: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  cartBarCta:    { color: '#F5A826', fontSize: 13, fontWeight: '800' },
});
