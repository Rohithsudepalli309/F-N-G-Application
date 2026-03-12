import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, TextInput, FlatList, ActivityIndicator,
  Keyboard, Dimensions, Image, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';
import { useGroceryCartStore } from '../store/useGroceryCartStore';

const { width } = Dimensions.get('window');
const CARD_W = (width - 34) / 2;

const TRENDING = ['Amul Milk', 'Potato Chips', 'Whole Wheat Bread', 'Farm Eggs', 'Atta 5kg', 'Maggi Noodles', 'Colgate Toothpaste', 'Basmati Rice'];
const POPULAR_CATS = [
  { name: 'Fruits & Vegetables', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=120&q=80', cat: 'Fruits & Vegetables'  },
  { name: 'Dairy, Bread & Eggs', img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=120&q=80', cat: 'Dairy, Bread & Eggs'   },
  { name: 'Snacks & Munchies',   img: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=120&q=80', cat: 'Munchies'              },
  { name: 'Cleaning Essentials', img: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=120&q=80', cat: 'Cleaning Essentials'  },
  { name: 'Beverages',           img: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=120&q=80', cat: 'Beverages'             },
  { name: 'Masala & Spices',     img: 'https://images.unsplash.com/photo-1506802913710-b2985dcd0c20?w=120&q=80', cat: 'Masala & Spices'      },
  { name: 'Personal Care',       img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120&q=80', cat: 'Personal Care'         },
  { name: 'Atta, Rice & Dal',    img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=120&q=80', cat: 'Atta, Rice, Oil & Dals' },
];

// ─── Inline mini product card ─────────────────────────────────────────────────
const MiniCard = React.memo(({ item }: { item: any }) => {
  const productId = String(item.id);
  const qty        = useGroceryCartStore(s => s.items.find(i => i.productId === productId)?.quantity ?? 0);
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
                <Text style={mc.stepBtnText}>{qty === 1 ? '×' : '−'}</Text>
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

export const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get('/products', { params: { search: q.trim() } });
      setResults(Array.isArray(data) ? data : []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const renderProduct = ({ item }: { item: any }) => <MiniCard item={item} />;
  const keyExtract    = (item: any) => String(item.id);

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Search header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={s.inputWrap}>
          <Text style={s.inputIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Search products, brands…"
            placeholderTextColor="#9E9E9E"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={() => doSearch(query)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
              <Text style={s.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Pre-search state */}
      {!searched && query.length === 0 && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <Text style={s.sectionTitle}>Trending Now</Text>
          <View style={s.trendingWrap}>
            {TRENDING.map(t => (
              <TouchableOpacity key={t} style={s.trendingPill} onPress={() => setQuery(t)}>
                <Text style={s.trendingText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.sectionTitle}>Browse Categories</Text>
          {POPULAR_CATS.map(c => (
            <TouchableOpacity
              key={c.name}
              style={s.catRow}
              onPress={() => navigation.navigate('ProductList', { categoryName: c.cat })}
            >
              <View style={s.catIcon}>
                <Image source={{ uri: c.img }} style={s.catThumb} resizeMode="cover" />
              </View>
              <Text style={s.catRowText}>{c.name}</Text>
              <Text style={s.catChev}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Loading */}
      {loading && (
        <View style={s.loader}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={s.loaderText}>Searching…</Text>
        </View>
      )}

      {/* Empty result */}
      {!loading && searched && results.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>😕</Text>
          <Text style={s.emptyTitle}>No results for "{query}"</Text>
          <Text style={s.emptySub}>Try different keywords or browse by category</Text>
          <View style={s.trendingWrap}>
            {TRENDING.slice(0, 4).map(t => (
              <TouchableOpacity key={t} style={s.trendingPill} onPress={() => setQuery(t)}>
                <Text style={s.trendingText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Results grid */}
      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={keyExtract}
          renderItem={renderProduct}
          numColumns={2}
          contentContainerStyle={s.grid}
          columnWrapperStyle={s.row}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => Keyboard.dismiss()}
          ListHeaderComponent={
            <Text style={s.resultCount}>{results.length} result{results.length !== 1 ? 's' : ''} for "{query}"</Text>
          }
          ListFooterComponent={<View style={{ height: 30 }} />}
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#F5F7FA' },

  header:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#EBEBEB', gap: 10 },
  backBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' },
  backArrow:{ fontSize: 26, color: '#0D1B14', marginTop: -2 },
  inputWrap:{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F7F7', height: 42, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#EBEBEB', gap: 8 },
  inputIcon:{ fontSize: 14 },
  input:    { flex: 1, fontSize: 14, color: '#0D1B14' },
  clearIcon:{ fontSize: 14, color: '#9E9E9E', paddingHorizontal: 4 },

  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#0D1B14', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 10 },

  trendingWrap: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  trendingPill: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, elevation: 1 },
  trendingText: { fontSize: 12, fontWeight: '600', color: '#333' },

  catRow:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  catIcon:   { width: 44, height: 44, borderRadius: 10, overflow: 'hidden', marginRight: 12 },
  catThumb:  { width: '100%', height: '100%' } as any,
  catRowText:{ flex: 1, fontSize: 14, fontWeight: '600', color: '#0D1B14' },
  catChev:   { fontSize: 22, color: '#BDBDBD' },

  loader:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: '#9E9E9E', fontSize: 13 },

  empty:      { padding: 32, alignItems: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: '#0D1B14', marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: '#9E9E9E', textAlign: 'center', marginBottom: 16 },

  grid:        { paddingHorizontal: 12, paddingTop: 4 },
  row:         { justifyContent: 'space-between' },
  resultCount: { fontSize: 13, color: '#9E9E9E', paddingVertical: 10, fontWeight: '500' },
});
