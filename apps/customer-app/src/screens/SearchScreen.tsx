/**
 * SearchScreen.tsx
 * Spec §8.1 #7 — Search tab. Full-text search on stores + products.
 * API: GET /api/v1/search?q=...
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, StatusBar, SafeAreaView, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

const QUICK_CATEGORIES = [
  { id: 'fruits', label: 'Fruits & Veg', emoji: '🥦' },
  { id: 'dairy', label: 'Dairy', emoji: '🥛' },
  { id: 'snacks', label: 'Snacks', emoji: '🍿' },
  { id: 'beverages', label: 'Beverages', emoji: '🧃' },
  { id: 'personal', label: 'Personal Care', emoji: '🧴' },
  { id: 'household', label: 'Household', emoji: '🧹' },
];

interface SearchResult {
  id: string;
  name: string;
  type: 'store' | 'product';
  image?: string;
  price?: number;
  mrp?: number;
  storeId?: string;
  storeName?: string;
  category?: string;
}

export const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>(['Milk', 'Atta', 'Maggi', 'Coke']);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get('/search', { params: { q: q.trim() } });
      // data can be { stores: [], products: [] } or flat array
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        const stores = (data.stores || []).map((s: any) => ({ ...s, type: 'store' }));
        const products = (data.products || []).map((p: any) => ({ ...p, type: 'product' }));
        setResults([...stores, ...products]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 380);
  };

  const handleResultPress = (item: SearchResult) => {
    if (item.type === 'store') {
      navigation.navigate('Store', { storeId: item.id, storeName: item.name });
    } else {
      navigation.navigate('ProductList', { category: item.category, storeId: item.storeId });
    }
  };

  const renderResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity style={styles.resultCard} onPress={() => handleResultPress(item)} activeOpacity={0.8}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.resultImage} resizeMode="cover" />
      ) : (
        <View style={[styles.resultImage, styles.resultImagePlaceholder]}>
          <Text style={{ fontSize: 22 }}>{item.type === 'store' ? '🏪' : '📦'}</Text>
        </View>
      )}
      <View style={styles.resultInfo}>
        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
        {item.type === 'product' && (
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.price}</Text>
            {item.mrp && item.mrp > (item.price || 0) && (
              <Text style={styles.mrp}>₹{item.mrp}</Text>
            )}
          </View>
        )}
        {item.storeName && <Text style={styles.storeName}>{item.storeName}</Text>}
      </View>
      <Text style={styles.resultArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search stores, products…"
          placeholderTextColor={theme.colors.text.secondary}
          value={query}
          onChangeText={handleChange}
          returnKeyType="search"
          onSubmitEditing={() => runSearch(query)}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent / Quick categories */}
      {query.length === 0 && (
        <View>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <View style={styles.recentRow}>
            {recent.map((r) => (
              <TouchableOpacity key={r} style={styles.recentChip} onPress={() => { setQuery(r); runSearch(r); }}>
                <Text style={styles.recentText}>🕐 {r}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Browse Categories</Text>
          <View style={styles.categoryGrid}>
            {QUICK_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.catCard}
                onPress={() => { setQuery(c.label); runSearch(c.label); }}
              >
                <Text style={styles.catEmoji}>{c.emoji}</Text>
                <Text style={styles.catLabel}>{c.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          renderItem={renderResult}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* No results */}
      {!loading && query.length >= 2 && results.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>No results for "{query}"</Text>
          <Text style={styles.emptySubtitle}>Try a different keyword</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, paddingHorizontal: 14, height: 48,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: theme.colors.text.primary },
  clearBtn: { fontSize: 16, color: theme.colors.text.secondary, padding: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text.secondary, marginLeft: 16, marginTop: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  recentRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  recentChip: { paddingHorizontal: 12, paddingVertical: 7, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border },
  recentText: { fontSize: 13, color: theme.colors.text.primary },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, marginTop: 4 },
  catCard: { width: '30%', backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.borderRadius.m, padding: 14, alignItems: 'center' },
  catEmoji: { fontSize: 28 },
  catLabel: { fontSize: 11, fontWeight: '600', color: theme.colors.text.primary, marginTop: 6, textAlign: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 10 },
  loadingText: { color: theme.colors.text.secondary, fontSize: 14 },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  resultImage: { width: 56, height: 56, borderRadius: theme.borderRadius.s },
  resultImagePlaceholder: { backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center' },
  resultInfo: { flex: 1, marginLeft: 12 },
  resultName: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  price: { fontSize: 14, fontWeight: '700', color: theme.colors.primary },
  mrp: { fontSize: 12, color: theme.colors.text.secondary, textDecorationLine: 'line-through' },
  storeName: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  resultArrow: { fontSize: 22, color: theme.colors.text.secondary },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 6 },
});
