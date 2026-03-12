import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { theme } from '../theme';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';

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
  const [items, setItems]       = useState<RecentItem[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/orders');
      const orders = Array.isArray(data) ? data : (data.orders ?? []);
      setItems(extractItems(orders));
    } catch {
      setError('Could not load recent items. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buy Again</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoEmoji}>🛍️</Text>
          <Text style={styles.infoTitle}>Your Recent Staples</Text>
          <Text style={styles.infoSubtitle}>Quickly add your most-ordered items back to cart.</Text>
        </View>

        {loading && (
          <ActivityIndicator size="large" color={theme.colors?.primary ?? '#F97316'} style={{ marginTop: 32 }} />
        )}

        {!loading && error && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity onPress={loadItems} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
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
            <Text style={styles.emptyText}>No delivered orders yet — order something to see it here!</Text>
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
  infoBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoEmoji: {
    fontSize: 40,
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
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#F97316',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 14,
  },
});
