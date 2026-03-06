/**
 * InstamartHomeScreen.tsx
 * Spec §5.4.4 — Multi-section Instamart: Grocery · Fashion · Household · Tools · Daily Essentials
 * API: GET /api/v1/grocery/categories
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, FlatList, TextInput, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { useGroceryCartStore } from '../store/useGroceryCartStore';
import { theme } from '../theme';

type Section = 'grocery' | 'fashion' | 'household' | 'tools' | 'daily';

interface Category {
  id: string;
  name: string;
  image: string;
  count: number;
  section: Section;
}

const SECTIONS: { key: Section; label: string; emoji: string; color: string }[] = [
  { key: 'grocery',   label: 'Grocery',          emoji: '🛒', color: '#f97316' },
  { key: 'daily',     label: 'Daily Essentials',  emoji: '⚡', color: '#ef4444' },
  { key: 'household', label: 'Household',         emoji: '🏠', color: '#3b82f6' },
  { key: 'fashion',   label: 'Fashion',           emoji: '👗', color: '#a855f7' },
  { key: 'tools',     label: 'Tools & Hardware',  emoji: '🔧', color: '#10b981' },
];

const FALLBACK_CATEGORIES: Category[] = [
  // ── Grocery ────────────────────────────────────────────────────────────
  { id: 'c01', section: 'grocery', name: 'Fruits & Vegetables',    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=75', count: 120 },
  { id: 'c02', section: 'grocery', name: 'Dairy, Bread & Eggs',    image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&q=75', count: 105 },
  { id: 'c03', section: 'grocery', name: 'Snacks & Munchies',      image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=300&q=75', count: 145 },
  { id: 'c04', section: 'grocery', name: 'Beverages',              image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=300&q=75', count: 120 },
  { id: 'c05', section: 'grocery', name: 'Bakery & Biscuits',      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=75', count: 78 },
  { id: 'c06', section: 'grocery', name: 'Atta, Rice, Oil & Dals', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=75', count: 200 },
  { id: 'c07', section: 'grocery', name: 'Masala & Spices',        image: 'https://images.unsplash.com/photo-1506802913710-b2985dcd0c20?w=300&q=75', count: 130 },
  { id: 'c08', section: 'grocery', name: 'Frozen & Instant Food',  image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&q=75', count: 65 },
  { id: 'c09', section: 'grocery', name: 'Breakfast & Sauces',     image: 'https://images.unsplash.com/photo-1504556074145-e0b78def9474?w=300&q=75', count: 108 },
  { id: 'c10', section: 'grocery', name: 'Baby Care',              image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&q=75', count: 60 },
  { id: 'c11', section: 'grocery', name: 'Pet Care',               image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&q=75', count: 45 },
  { id: 'c12', section: 'grocery', name: 'Meat, Fish & Eggs',      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=300&q=75', count: 90 },
  // ── Daily Essentials ──────────────────────────────────────────────────
  { id: 'd01', section: 'daily', name: 'Cleaning Essentials',       image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=75', count: 110 },
  { id: 'd02', section: 'daily', name: 'Personal Care',             image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300&q=75', count: 90 },
  { id: 'd03', section: 'daily', name: 'Laundry Detergents',        image: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=300&q=75', count: 42 },
  { id: 'd04', section: 'daily', name: 'Skincare & Haircare',       image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&q=75', count: 75 },
  { id: 'd05', section: 'daily', name: 'Toilet & Floor Cleaners',   image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300&q=75', count: 35 },
  { id: 'd06', section: 'daily', name: 'Tissue & Paper Products',   image: 'https://images.unsplash.com/photo-1584622651378-6a4f1e48ec66?w=300&q=75', count: 28 },
  // ── Household ─────────────────────────────────────────────────────────
  { id: 'h01', section: 'household', name: 'Kitchen Storage',        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300&q=75', count: 80 },
  { id: 'h02', section: 'household', name: 'Cookware & Pans',        image: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=300&q=75', count: 65 },
  { id: 'h03', section: 'household', name: 'Containers & Boxes',     image: 'https://images.unsplash.com/photo-1611690951566-b4a4f9fd7e4c?w=300&q=75', count: 55 },
  { id: 'h04', section: 'household', name: 'Brooms & Mops',          image: 'https://images.unsplash.com/photo-1584931423298-c576fda54bd2?w=300&q=75', count: 40 },
  { id: 'h05', section: 'household', name: 'Organizers & Shelves',   image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=75', count: 48 },
  { id: 'h06', section: 'household', name: 'Light Bulbs & Batteries',image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=75', count: 35 },
  // ── Tools ─────────────────────────────────────────────────────────────
  { id: 't01', section: 'tools', name: 'Hand Tools',                 image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&q=75', count: 70 },
  { id: 't02', section: 'tools', name: 'Adhesives & Tapes',          image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=300&q=75', count: 45 },
  { id: 't03', section: 'tools', name: 'Locks & Safety',             image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&q=75', count: 38 },
  { id: 't04', section: 'tools', name: 'Plumbing Fittings',          image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&q=75', count: 52 },
  { id: 't05', section: 'tools', name: 'Electrical Fittings',        image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=300&q=75', count: 60 },
  { id: 't06', section: 'tools', name: 'Power Tool Accessories',     image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&q=75', count: 42 },
  // ── Fashion ───────────────────────────────────────────────────────────
  { id: 'f01', section: 'fashion', name: "Men's T-Shirts",           image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&q=75', count: 200 },
  { id: 'f02', section: 'fashion', name: "Women's Kurtas",           image: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=300&q=75', count: 180 },
  { id: 'f03', section: 'fashion', name: 'Kids Clothing',            image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=300&q=75', count: 150 },
  { id: 'f04', section: 'fashion', name: 'Accessories & Belts',      image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=75', count: 95 },
  { id: 'f05', section: 'fashion', name: 'Footwear',                 image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=75', count: 120 },
  { id: 'f06', section: 'fashion', name: 'Innerwear & Socks',        image: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=300&q=75', count: 88 },
];

const SECTION_BANNERS: Record<Section, { title: string; sub: string; badge: string }> = {
  grocery:   { title: 'Delivery in ~28 mins',         sub: 'Fresh groceries · 5,000+ products',   badge: '🛒 Grocery' },
  daily:     { title: '⚡ Daily Essentials',           sub: 'Household must-haves at best prices', badge: '⚡ Daily' },
  household: { title: '🏠 Home & Kitchen',             sub: 'Cookware, storage & more',            badge: '🏠 Household' },
  tools:     { title: '🔧 Tools & Hardware',           sub: 'Fix it today, delivered fast',        badge: '🔧 Tools' },
  fashion:   { title: '👗 Fashion Delivered Fast',     sub: 'Clothing, Footwear & Accessories',    badge: '👗 Fashion' },
};

export const InstamartHomeScreen = () => {
  const navigation = useNavigation<any>();
  const [allCategories, setAllCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState<Section>('grocery');
  const cartItems = useGroceryCartStore((s) => s.items);
  const cartTotal = useGroceryCartStore((s) => s.total);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/grocery/categories');
        const cats = (data.categories ?? data) as Array<{
          id: string | number; name: string; image_url?: string; count?: number; section?: string;
        }>;
        if (Array.isArray(cats) && cats.length > 0) {
          setAllCategories(cats.map((c) => ({
            id: String(c.id),
            name: c.name,
            image: c.image_url ?? `https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=75`,
            count: c.count ?? 0,
            section: (c.section as Section) ?? 'grocery',
          })));
        }
      } catch {
        // silently use fallback
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const visibleCategories = useCallback(() => {
    const base = allCategories.filter((c) => c.section === activeSection);
    if (!search.trim()) return base;
    return base.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [allCategories, activeSection, search]);

  const activeMeta = SECTIONS.find((s) => s.key === activeSection)!;
  const banner = SECTION_BANNERS[activeSection];

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.catCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('InstamartCategory', { categoryId: item.id, categoryName: item.name })}
    >
      <Image source={{ uri: item.image }} style={styles.catImage} resizeMode="cover" />
      <View style={styles.catOverlay} />
      <View style={styles.catTextWrap}>
        <Text style={styles.catName} numberOfLines={2}>{item.name}</Text>
        {item.count > 0 && <Text style={styles.catCount}>{item.count} items</Text>}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{activeMeta.emoji} F&amp;G Instamart</Text>
          <Text style={styles.headerSub}>Under 40 mins · All categories</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('GroceryCart')}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text>🔍  </Text>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeMeta.label.toLowerCase()}…`}
          placeholderTextColor={theme.colors.text.secondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {SECTIONS.map((sec) => {
          const active = sec.key === activeSection;
          return (
            <TouchableOpacity
              key={sec.key}
              onPress={() => { setActiveSection(sec.key); setSearch(''); }}
              style={[styles.tab, active && { backgroundColor: sec.color, borderColor: sec.color }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabEmoji]}>{sec.emoji}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{sec.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Section Banner */}
        <View style={[styles.promiseBanner, { backgroundColor: activeMeta.color }]}>
          <Text style={styles.promiseEmoji}>{activeMeta.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.promiseTitle}>{banner.title}</Text>
            <Text style={styles.promiseSub}>{banner.sub}</Text>
          </View>
          <View style={styles.promiseBadgePill}>
            <Text style={styles.promiseBadgeText}>{banner.badge}</Text>
          </View>
        </View>

        {/* Categories grid */}
        <Text style={styles.sectionTitle}>Shop {activeMeta.label}</Text>
        {loading ? (
          <ActivityIndicator color={activeMeta.color} style={{ marginTop: 32 }} />
        ) : (
          <FlatList
            data={visibleCategories()}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={renderCategory}
            scrollEnabled={false}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={{ gap: 12 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No categories found</Text>
            }
          />
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky cart FAB */}
      {cartItems.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('GroceryCart')} activeOpacity={0.9}>
          <Text style={styles.fabText}>{cartItems.length} item{cartItems.length > 1 ? 's' : ''}  ·  ₹{(cartTotal() / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
          <Text style={styles.fabCta}>View Cart →</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: theme.colors.primary },
  headerSub: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  cartBtn: { position: 'relative', padding: 8 },
  cartIcon: { fontSize: 24 },
  cartBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: theme.colors.primary },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, paddingHorizontal: 14, height: 44, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.m, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 14, color: theme.colors.text.primary },
  tabsScroll: { maxHeight: 52 },
  tabsContent: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: '#FFF', gap: 4 },
  tabEmoji: { fontSize: 14 },
  tabLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary },
  tabLabelActive: { color: '#FFF' },
  promiseBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 8, borderRadius: theme.borderRadius.l, padding: 14, gap: 10 },
  promiseEmoji: { fontSize: 26 },
  promiseTitle: { fontSize: 14, fontWeight: '800', color: '#FFF' },
  promiseSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  promiseBadgePill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  promiseBadgeText: { fontSize: 11, fontWeight: '800', color: '#FFF' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: theme.colors.text.primary, marginLeft: 16, marginTop: 12, marginBottom: 8 },
  gridContainer: { paddingHorizontal: 16 },
  catCard: { flex: 1, height: 130, borderRadius: theme.borderRadius.l, overflow: 'hidden', position: 'relative' },
  catImage: { width: '100%', height: '100%' },
  catOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  catTextWrap: { position: 'absolute', bottom: 10, left: 10, right: 10 },
  catName: { fontSize: 13, fontWeight: '800', color: '#FFF', lineHeight: 17 },
  catCount: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  emptyText: { textAlign: 'center', color: theme.colors.text.secondary, marginTop: 32, fontSize: 14 },
  fab: { position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.l, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...theme.shadows.card },
  fabText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  fabCta: { color: theme.colors.accent, fontSize: 14, fontWeight: '800' },
});
