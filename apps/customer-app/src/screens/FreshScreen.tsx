import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Image, ActivityIndicator, TouchableOpacity, StatusBar, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';

const { width } = Dimensions.get('window');

const SUB_SECTIONS = [
  {
    key: 'Vegetables',
    title: 'Fresh Vegetables',
    sub: 'Tomatoes, Spinach, Onions & more',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=85',
    bg: '#E8F5E9', textColor: '#1B5E20',
  },
  {
    key: 'Fruits',
    title: 'Fresh Fruits',
    sub: 'Bananas, Apples, Mangoes & more',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&q=85',
    bg: '#FFF8E1', textColor: '#E65100',
  },
];

export const FreshScreen = () => {
  const navigation = useNavigation<any>();
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/products', {
          params: { category: 'Fruits & Vegetables' },
        });
        const list: any[] = Array.isArray(data) ? data : [];
        setTrending(list.slice(0, 8));
      } catch { /* silently use empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const goTo = (subCategory: string, title: string) =>
    navigation.navigate('ProductList', {
      categoryName: 'Fruits & Vegetables',
      subCategory,
      displayTitle: title,
    });

  return (
    <SafeAreaView style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity style={st.backBtn} onPress={() => navigation.goBack()}>
          <Text style={st.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={st.headerTitle}>Fresh Produce</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>

        {/* Hero banner */}
        <View style={st.heroBanner}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&q=85' }}
            style={st.heroImg}
            resizeMode="cover"
          />
          <View style={st.heroOverlay} />
          <View style={st.heroContent}>
            <Text style={st.heroBadge}>⚡ 10-MINUTE DELIVERY</Text>
            <Text style={st.heroTitle}>Farm Fresh{`\n`}Every Day</Text>
            <Text style={st.heroSub}>Sourced directly from farmers</Text>
          </View>
        </View>

        {/* Sub-section tiles */}
        <Text style={st.label}>Shop by Type</Text>
        <View style={st.tilesRow}>
          {SUB_SECTIONS.map(sec => (
            <TouchableOpacity
              key={sec.key}
              style={[st.tile, { backgroundColor: sec.bg }]}
              onPress={() => goTo(sec.key, sec.title)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: sec.image }} style={st.tileImg} resizeMode="cover" />
              <View style={st.tileMeta}>
                <Text style={[st.tileTitle, { color: sec.textColor }]}>{sec.title}</Text>
                <Text style={st.tileSub} numberOfLines={1}>{sec.sub}</Text>
                <Text style={[st.tileShop, { color: sec.textColor }]}>Shop →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending today */}
        <Text style={st.label}>Trending Today</Text>
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 24 }} />
        ) : trending.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={st.trendRow}>
            {trending.map(p => (
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
                  discountTag: p.original_price
                    ? Math.round((1 - p.price / p.original_price) * 100) + '% OFF'
                    : undefined,
                }}
              />
            ))}
          </ScrollView>
        ) : (
          <Text style={st.emptyText}>No fresh products right now. Check back soon!</Text>
        )}

        {/* Full browse buttons */}
        <View style={st.browseRow}>
          {SUB_SECTIONS.map(sec => (
            <TouchableOpacity
              key={sec.key}
              style={st.browseBtn}
              onPress={() => goTo(sec.key, sec.title)}
            >
              <Text style={st.browseBtnText}>All {sec.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const st = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#F7FAF7' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  backArrow:  { fontSize: 26, color: '#0D1B14', marginTop: -2 },
  headerTitle:{ fontSize: 18, fontWeight: '800', color: '#0D1B14' },
  scroll:     { paddingBottom: 24 },

  heroBanner: { height: 200, marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden' },
  heroImg:    { width: '100%', height: '100%', position: 'absolute' },
  heroOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  heroContent:{ padding: 20, justifyContent: 'flex-end', flex: 1 },
  heroBadge:  { fontSize: 10, fontWeight: '800', color: '#A5D6A7', letterSpacing: 1, marginBottom: 6 },
  heroTitle:  { fontSize: 28, fontWeight: '900', color: '#FFF', lineHeight: 32, marginBottom: 4 },
  heroSub:    { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  label:      { fontSize: 16, fontWeight: '800', color: '#0D1B14', marginHorizontal: 16, marginTop: 24, marginBottom: 12 },

  tilesRow:   { paddingHorizontal: 16, gap: 12 },
  tile:       { borderRadius: 16, overflow: 'hidden', height: 140, marginBottom: 0 },
  tileImg:    { ...StyleSheet.absoluteFillObject, opacity: 0.35 },
  tileMeta:   { padding: 18, justifyContent: 'flex-end', flex: 1 },
  tileTitle:  { fontSize: 20, fontWeight: '900', marginBottom: 3 },
  tileSub:    { fontSize: 12, color: '#555', marginBottom: 8 },
  tileShop:   { fontSize: 13, fontWeight: '800' },

  trendRow:   { paddingHorizontal: 16, paddingBottom: 4 },
  emptyText:  { marginHorizontal: 16, color: '#9E9E9E', fontSize: 13 },

  browseRow:  { flexDirection: 'row', marginHorizontal: 16, marginTop: 20, gap: 12 },
  browseBtn:  { flex: 1, backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  browseBtnText: { color: '#FFF', fontSize: 13, fontWeight: '800' },
});
