import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, FlatList, ActivityIndicator,
  TextInput, Image, Dimensions, ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';
import { useGroceryCartStore } from '../store/useGroceryCartStore';

const { width } = Dimensions.get('window');
const CARD_W = (width - 34) / 2;   // 12px padding each side, 10px gap

const SORT_OPTIONS = ['Default', 'Price: Low', 'Price: High', 'Discount'];

// ─── Inline mini product card ─────────────────────────────────────────────────
const MiniCard = React.memo(({ item }: { item: any }) => {
  const productId = String(item.id);
  const qty = useGroceryCartStore(s => s.items.find(i => i.productId === productId)?.quantity ?? 0);
  const addItem    = useGroceryCartStore(s => s.addItem);
  const updateQty  = useGroceryCartStore(s => s.updateQty);
  const removeItem = useGroceryCartStore(s => s.removeItem);

  const discPct = item.original_price
    ? Math.round((1 - item.price / item.original_price) * 100) : 0;

  const handleAdd = () =>
    addItem({ productId, name: item.name, price: Number(item.price), image: item.image_url, unit: item.unit });
  const handleInc = () => updateQty(productId, qty + 1);
  const handleDec = () => qty <= 1 ? removeItem(productId) : updateQty(productId, qty - 1);

  return (
    <View style={mc.card}>
      <View style={mc.imgWrap}>
        {discPct > 0 && (
          <View style={mc.discBadge}>
            <Text style={mc.discText}>{discPct}%{'\n'}OFF</Text>
          </View>
        )}
        <Image
          source={{ uri: item.image_url || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=60' }}
          style={mc.img}
          resizeMode="contain"
        />
        <View style={mc.addWrap}>
          {qty === 0 ? (
            <TouchableOpacity style={mc.addBtn} onPress={handleAdd} activeOpacity={0.85}>
              <Text style={mc.addText}>ADD +</Text>
            </TouchableOpacity>
          ) : (
            <View style={mc.stepper}>
              <TouchableOpacity style={mc.stepBtn} onPress={handleDec}>
                <Text style={mc.stepBtnText}>{qty === 1 ? '🗑' : '−'}</Text>
              </TouchableOpacity>
              <Text style={mc.stepNum}>{qty}</Text>
              <TouchableOpacity style={mc.stepBtn} onPress={handleInc}>
                <Text style={mc.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      <View style={mc.info}>
        <Text style={mc.name} numberOfLines={2}>{item.name}</Text>
        <Text style={mc.unit} numberOfLines={1}>{item.unit || '1 pack'}</Text>
        <View style={mc.priceRow}>
          <Text style={mc.price}>
            {'\u20B9'}{(item.price / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          {item.original_price ? (
            <Text style={mc.mrp}>
              {'\u20B9'}{(item.original_price / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
});

const mc = StyleSheet.create({
  card:     { width: CARD_W, backgroundColor: '#FFF', borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#EBEBEB', overflow: 'hidden' },
  imgWrap:  { width: '100%', aspectRatio: 1, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  img:      { width: '75%', height: '75%' },
  discBadge:{ position: 'absolute', top: 8, left: 8, backgroundColor: '#1B5E20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  discText: { color: '#FFF', fontSize: 10, fontWeight: '900', textAlign: 'center', lineHeight: 13 },
  addWrap:  { position: 'absolute', bottom: 8, right: 8 },
  addBtn:   { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addText:  { color: '#FFF', fontSize: 11, fontWeight: '900' },
  stepper:  { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, borderRadius: 8, overflow: 'hidden' },
  stepBtn:  { paddingHorizontal: 9, paddingVertical: 6 },
  stepBtnText:{ color: '#FFF', fontSize: 14, fontWeight: '900' },
  stepNum:  { color: '#FFF', fontSize: 13, fontWeight: '900', minWidth: 20, textAlign: 'center' },
  info:     { padding: 10 },
  name:     { fontSize: 13, fontWeight: '700', color: '#0D1B14', marginBottom: 2, lineHeight: 17 },
  unit:     { fontSize: 11, color: '#9E9E9E', marginBottom: 6 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  price:    { fontSize: 14, fontWeight: '900', color: '#0D1B14' },
  mrp:      { fontSize: 11, color: '#BDBDBD', textDecorationLine: 'line-through' },
});
// ─────────────────────────────────────────────────────────────────────────────

export const ProductListScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { categoryName = 'Products' } = route.params ?? {};
  const [products, setProducts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Default');
  const cartItems = useGroceryCartStore(s => s.items);
  const cartTotal = useGroceryCartStore(s => s.total);

  const apply = useCallback((list: any[], q: string, srt: string) => {
    let out = list.filter(p => !q.trim() || p.name?.toLowerCase().includes(q.toLowerCase()));
    if (srt === 'Price: Low')  out = [...out].sort((a, b) => a.price - b.price);
    if (srt === 'Price: High') out = [...out].sort((a, b) => b.price - a.price);
    if (srt === 'Discount')    out = [...out].sort((a, b) => {
      const da = a.original_price ? (1 - a.price / a.original_price) : 0;
      const db = b.original_price ? (1 - b.price / b.original_price) : 0;
      return db - da;
    });
    setFiltered(out);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/products', { params: { category: categoryName } });
        const list = Array.isArray(data) ? data : [];
        setProducts(list);
        apply(list, '', 'Default');
      } catch { setProducts([]); setFiltered([]); }
      finally { setLoading(false); }
    })();
  }, [categoryName]);

  useEffect(() => { apply(products, search, sort); }, [search, sort, products, apply]);

  const renderItem = ({ item }: { item: any }) => <MiniCard item={item} />;
  const keyExtract = (item: any) => String(item.id);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={s.headerMid}>
          <Text style={s.headerTitle} numberOfLines={1}>{categoryName}</Text>
          {!loading && <Text style={s.headerSub}>{filtered.length} items</Text>}
        </View>
      </View>

      {/* Search */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder={`Search in ${categoryName}…`}
          placeholderTextColor="#9E9E9E"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={s.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Sort chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.sortScroll} contentContainerStyle={s.sortContent}>
        {SORT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt}
            style={[s.sortChip, sort === opt && s.sortChipActive]}
            onPress={() => setSort(opt)}
          >
            <Text style={[s.sortChipText, sort === opt && s.sortChipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🔍</Text>
          <Text style={s.emptyTitle}>
            {search ? `No results for "${search}"` : 'No products found'}
          </Text>
          {search && (
            <TouchableOpacity style={s.clearSearchBtn} onPress={() => setSearch('')}>
              <Text style={s.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={keyExtract}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: cartItems.length > 0 ? 80 : 20 }} />}
        />
      )}

      {/* Sticky cart bar */}
      {cartItems.length > 0 && (
        <TouchableOpacity
          style={s.cartBar}
          onPress={() => navigation.navigate('InstamartTab', { screen: 'GroceryCart' })}
          activeOpacity={0.92}
        >
          <View style={s.cartBarLeft}>
            <View style={s.cartBarBadge}>
              <Text style={s.cartBarBadgeText}>{cartItems.length}</Text>
            </View>
            <Text style={s.cartBarLabel}>item{cartItems.length !== 1 ? 's' : ''} in cart</Text>
          </View>
          <Text style={s.cartBarCta}>
            View Cart  {'\u20B9'}{(cartTotal() / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })} →
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#F5F7FA' },

  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEB' },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  backArrow:  { fontSize: 26, color: '#0D1B14', marginTop: -2 },
  headerMid:  { flex: 1 },
  headerTitle:{ fontSize: 17, fontWeight: '800', color: '#0D1B14' },
  headerSub:  { fontSize: 11, color: '#9E9E9E', marginTop: 1 },

  searchBar:  { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F7F7', marginHorizontal: 12, marginVertical: 10, height: 42, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#EBEBEB' },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput:{ flex: 1, fontSize: 13, color: '#0D1B14' },
  clearIcon:  { fontSize: 14, color: '#9E9E9E', paddingHorizontal: 4 },

  sortScroll: { maxHeight: 44, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEB' },
  sortContent:{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  sortChip:   { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD', backgroundColor: '#FFF' },
  sortChipActive:    { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sortChipText:      { fontSize: 12, fontWeight: '600', color: '#666' },
  sortChipTextActive:{ color: '#FFF' },

  grid:   { paddingHorizontal: 12, paddingTop: 8 },
  row:    { justifyContent: 'space-between' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  empty:         { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji:    { fontSize: 48, marginBottom: 16 },
  emptyTitle:    { fontSize: 17, fontWeight: '800', color: '#0D1B14', textAlign: 'center' },
  clearSearchBtn:{ marginTop: 20, backgroundColor: theme.colors.primary, paddingHorizontal: 24, paddingVertical: 11, borderRadius: 25 },
  clearSearchText:{ color: '#FFF', fontSize: 13, fontWeight: '700' },

  cartBar:          { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: theme.colors.primary, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  cartBarLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartBarBadge:     { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F5A826', alignItems: 'center', justifyContent: 'center' },
  cartBarBadgeText: { fontSize: 12, fontWeight: '900', color: '#0D1B14' },
  cartBarLabel:     { color: '#FFF', fontSize: 13, fontWeight: '600' },
  cartBarCta:       { color: '#F5A826', fontSize: 13, fontWeight: '800' },
});
