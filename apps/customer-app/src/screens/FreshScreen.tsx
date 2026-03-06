import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  Image, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { theme } from '../theme';
import { ProductCard } from '../components/ProductCard';
import { BottomTabs } from '../components/BottomTabs';
import { api } from '../services/api';

interface FreshProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  weight?: string;
  discountTag?: string;
  deliveryTime?: string;
}

export const FreshScreen = () => {
  const [products, setProducts] = useState<FreshProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFreshProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/products', { params: { category: 'Fresh' } });
      const raw: any[] = data.products ?? data ?? [];
      const mapped: FreshProduct[] = raw.map((p: any) => ({
        id: String(p.id),
        name: p.name,
        price: p.price,
        originalPrice: p.original_price ?? undefined,
        image: p.image_url ?? p.image ?? '',
        weight: p.unit,
        discountTag:
          p.original_price && p.price < p.original_price
            ? `${Math.round((1 - p.price / p.original_price) * 100)}% OFF`
            : undefined,
        deliveryTime: '10 mins',
      }));
      setProducts(mapped);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to load fresh produce');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreshProducts();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fresh Produce</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroBox}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2329/2329864.png' }}
            style={styles.heroImg}
          />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Farm to Fork</Text>
            <Text style={styles.heroSubtitle}>Delivering nutrients at lightning speed.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organic Selections</Text>

          {loading && (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading fresh produce…</Text>
            </View>
          )}

          {!loading && error != null && (
            <View style={styles.centerBox}>
              <Text style={styles.stateEmoji}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchFreshProducts}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && error == null && products.length === 0 && (
            <View style={styles.centerBox}>
              <Text style={styles.stateEmoji}>🌱</Text>
              <Text style={styles.emptyText}>No fresh products right now. Check back soon!</Text>
            </View>
          )}

          {!loading && error == null && products.length > 0 && (
            <View style={styles.grid}>
              {products.map((item) => (
                <View key={item.id} style={styles.cardContainer}>
                  <ProductCard product={item} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <BottomTabs activeTab="Fresh" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  heroBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroImg: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#2E7D32',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#333',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  cardContainer: {
    width: '50%',
    padding: 8,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  stateEmoji: {
    fontSize: 42,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
