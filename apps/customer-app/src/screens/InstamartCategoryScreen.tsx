/**
 * InstamartCategoryScreen.tsx
 * Spec §5.4.4 — Product listing for a grocery category.
 * Real-time stock via Socket.IO grocery_stock_update event.
 * API: GET /api/v1/grocery/products?category=...
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, SafeAreaView, StatusBar, ActivityIndicator, TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { theme } from '../theme';

interface GroceryProduct {
  id: string;
  name: string;
  brand?: string;
  unit: string;
  price: number;
  mrp: number;
  image?: string;
  is_available: boolean;
  stock_quantity: number;
  discount?: number;
}

const ProductCard = ({ product, storeId }: { product: GroceryProduct; storeId: string }) => {
  const { addToCart, items, decrementFromCart } = useCartStore();
  const qty = items.find(i => i.productId === product.id)?.quantity || 0;

  const handleAdd = () => {
    addToCart(storeId, {
      productId: product.id,
      name: product.name,
      price: Math.round(product.price * 100), // store in paise
      quantity: 1,
    });
  };

  const discountPct = product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <View style={[pStyles.card, !product.is_available && pStyles.outOfStock]}>
      <View style={pStyles.imageWrap}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={pStyles.image} resizeMode="contain" />
        ) : (
          <View style={[pStyles.image, pStyles.imagePlaceholder]}>
            <Text style={{ fontSize: 32 }}>📦</Text>
          </View>
        )}
        {discountPct > 0 && (
          <View style={pStyles.discountBadge}>
            <Text style={pStyles.discountText}>{discountPct}% OFF</Text>
          </View>
        )}
        {!product.is_available && (
          <View style={pStyles.unavailableOverlay}>
            <Text style={pStyles.unavailableText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={pStyles.info}>
        {product.brand && <Text style={pStyles.brand} numberOfLines={1}>{product.brand}</Text>}
        <Text style={pStyles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={pStyles.unit}>{product.unit}</Text>

        <View style={pStyles.priceRow}>
          <Text style={pStyles.price}>₹{product.price}</Text>
          {product.mrp > product.price && (
            <Text style={pStyles.mrp}>₹{product.mrp}</Text>
          )}
        </View>

        {product.is_available ? (
          qty === 0 ? (
            <TouchableOpacity style={pStyles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
              <Text style={pStyles.addBtnText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={pStyles.stepper}>
              <TouchableOpacity style={pStyles.stepBtn} onPress={() => decrementFromCart(product.id)}>
                <Text style={pStyles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={pStyles.qtyText}>{qty}</Text>
              <TouchableOpacity style={pStyles.stepBtn} onPress={handleAdd}>
                <Text style={pStyles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={[pStyles.addBtn, pStyles.disabledBtn]}>
            <Text style={[pStyles.addBtnText, { color: theme.colors.text.secondary }]}>N/A</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export const InstamartCategoryScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { categoryId, categoryName } = route.params || {};
  const token = useAuthStore((s) => s.token);

  const [products, setProducts] = useState<GroceryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'discount'>('price_asc');
  const cartItems = useCartStore((s) => s.items);
  const cartTotal = useCartStore((s) => s.total);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get('/grocery/products', {
        params: { category: categoryName, sort: sortBy },
      });
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categoryName, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Real-time stock updates
  useEffect(() => {
    socketService.connect(token || undefined);
    socketService.on('grocery_stock_update', ({ itemId, available, stock_quantity }) => {
      setProducts((prev) =>
        prev.map((p) => p.id === itemId ? { ...p, is_available: available, stock_quantity } : p)
      );
    });
    return () => socketService.off('grocery_stock_update');
  }, [token]);

  const sorted = [...products].sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    const da = a.mrp > a.price ? ((a.mrp - a.price) / a.mrp) : 0;
    const db = b.mrp > b.price ? ((b.mrp - b.price) / b.mrp) : 0;
    return db - da;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{categoryName}</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Sort bar */}
      <View style={styles.sortRow}>
        {(['price_asc', 'price_desc', 'discount'] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.sortChip, sortBy === s && styles.sortChipActive]}
            onPress={() => setSortBy(s)}
          >
            <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>
              {s === 'price_asc' ? '↑ Price' : s === 'price_desc' ? '↓ Price' : '% Discount'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Products */}
      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => <ProductCard product={item} storeId={categoryId || 'instamart'} />}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 10 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🏪</Text>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      )}

      {/* Sticky cart bar */}
      {cartItems.length > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartBarLeft}>{cartItems.length} item{cartItems.length > 1 ? 's' : ''} · ₹{(cartTotal() / 100).toFixed(0)}</Text>
          <Text style={styles.cartBarRight}>View Cart →</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 22, fontWeight: '600', color: theme.colors.text.primary },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: theme.colors.text.primary, marginLeft: 6 },
  cartBtn: { position: 'relative', padding: 8 },
  cartIcon: { fontSize: 22 },
  cartBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: theme.colors.primary },
  sortRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  sortChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
  sortChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  sortText: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary },
  sortTextActive: { color: '#FFF' },
  grid: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: theme.colors.text.secondary, marginTop: 12 },
  cartBar: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.l, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cartBarLeft: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  cartBarRight: { color: theme.colors.accent, fontSize: 14, fontWeight: '800' },
});

const pStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#FFF', borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  outOfStock: { opacity: 0.6 },
  imageWrap: { position: 'relative', height: 100, backgroundColor: theme.colors.surface },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  discountBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: theme.colors.accent3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  discountText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
  unavailableOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  unavailableText: { color: '#FFF', fontWeight: '700', fontSize: 12 },
  info: { padding: 8 },
  brand: { fontSize: 10, color: theme.colors.text.secondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  name: { fontSize: 12, fontWeight: '700', color: theme.colors.text.primary, marginTop: 2, lineHeight: 16 },
  unit: { fontSize: 10, color: theme.colors.text.secondary, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  price: { fontSize: 14, fontWeight: '800', color: theme.colors.primary },
  mrp: { fontSize: 11, color: theme.colors.text.secondary, textDecorationLine: 'line-through' },
  addBtn: { marginTop: 6, height: 30, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.primary, borderRadius: theme.borderRadius.s, alignItems: 'center', justifyContent: 'center' },
  disabledBtn: { borderColor: theme.colors.border },
  addBtnText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.s, height: 30 },
  stepBtn: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  qtyText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
});
