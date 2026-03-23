import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, TouchableOpacity, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';
import { StatusBar } from 'react-native';

interface RecentItem {
  id: string;
  name: string;
  weight: string;
  price: number;
  originalPrice?: number;
  discountTag?: string;
  image: string;
  deliveryTime: string;
}

const DEFAULT_IMAGE = 'https://cdn-icons-png.flaticon.com/512/3050/3050161.png';

/** Flatten delivered orders → unique items (deduped by name, most recent wins). */
function extractItems(orders: any[]): RecentItem[] {
  const seen = new Map<string, RecentItem>();
  const delivered = orders.filter((o: any) => o.status === 'delivered');

  for (const order of delivered) {
    for (const item of order.items ?? []) {
      const key = item.name?.toLowerCase() ?? item.product_id ?? String(item.id);
      if (!seen.has(key)) {
        seen.set(key, {
          id:            String(item.product_id ?? item.id),
          name:          item.name ?? 'Item',
          weight:        item.weight ?? '',
          price:         Number(item.price),
          originalPrice: item.original_price ? Number(item.original_price) : undefined,
          discountTag:   undefined,
          image:         item.image_url ?? DEFAULT_IMAGE,
          deliveryTime:  '15 mins',
        });
      }
    }
  }

  return Array.from(seen.values()).slice(0, 20);
}

export const BuyAgainScreen = () => {
  const navigation = useNavigation<any>();
  const [items, setItems]       = useState<RecentItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/personalization/past-purchases');
      const formattedItems = (data || []).map((p: any) => ({
        id: String(p.id),
        name: p.name,
        brand: p.brand,
        weight: p.unit || '1 unit',
        price: p.price,
        originalPrice: p.original_price,
        image: p.image_url,
        deliveryTime: '10 mins',
      }));
      setItems(formattedItems);
    } catch (err) {
      setError('Could not load your past favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Buy Again</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Image 
            source={{ uri: 'https://img.icons8.com/color/96/shopping-bag--v1.png' }} 
            style={styles.infoImg} 
            resizeMode="contain" 
          />
          <Text style={styles.infoTitle}>Your Favorites</Text>
          <Text style={styles.infoSubtitle}>Quickly restock the items you order most frequently.</Text>
        </View>

        {loading && (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 32 }} />
        )}

        {!loading && error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity onPress={loadItems} style={styles.retryBtn}>
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Ordered</Text>
            <View style={styles.grid}>
              {items.map((item) => (
                <View key={item.id} style={styles.cardContainer}>
                  <ProductCard product={item} />
                </View>
              ))}
            </View>
          </View>
        )}

        {!loading && !error && items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>You haven't ordered anything yet!</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('HomeFeed')}
              style={styles.retryBtn}
            >
              <Text style={styles.retryText}>START SHOPPING</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: '#000' },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  infoBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoImg: {
    width: 64,
    height: 64,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
