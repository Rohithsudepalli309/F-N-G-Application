/**
 * FavoritesScreen.tsx
 * Spec §8.1 #30 — Saved / liked restaurants and dishes.
 * GET /api/users/favorites  DELETE /api/users/favorites/:restaurantId
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList,
  TouchableOpacity, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

interface FavRestaurant {
  id: string;
  name: string;
  cuisine_tags: string[];
  rating: number;
  delivery_time: number;
  image_url?: string;
  is_active: boolean;
}

export const FavoritesScreen = () => {
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<FavRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get('/users/favorites');
      setFavorites(Array.isArray(data) ? data : data.favorites ?? []);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchFavorites(); }, []));

  const removeFavorite = async (id: string) => {
    try {
      await api.delete(`/users/favorites/${id}`);
      setFavorites(p => p.filter(r => r.id !== id));
    } catch {}
  };

  const renderItem = ({ item }: { item: FavRestaurant }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('Store', { storeId: item.id })}
      activeOpacity={0.85}
    >
      <View style={styles.imageWrap}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={styles.restImage} />
          : <View style={[styles.restImage, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>🍽️</Text>
            </View>
        }
        {!item.is_active && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>Closed</Text>
          </View>
        )}
      </View>
      <View style={styles.restInfo}>
        <Text style={styles.restName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.restCuisine} numberOfLines={1}>
          {item.cuisine_tags?.join(', ') ?? 'Restaurant'}
        </Text>
        <View style={styles.metaRow}>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {item.rating?.toFixed(1) ?? '4.0'}</Text>
          </View>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.deliTime}>{item.delivery_time ?? 30} min</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.heartBtn} onPress={() => removeFavorite(item.id)}>
        <Text style={styles.heartIcon}>❤️</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favourites</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={r => r.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchFavorites(); }}
              tintColor={theme.colors.primary}
            />
          }
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🤍</Text>
              <Text style={styles.emptyTitle}>No favourites yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the ❤️ on any restaurant or dish to save it here
              </Text>
              <TouchableOpacity
                style={styles.browseBtn}
                onPress={() => navigation.navigate('HomeTab')}
              >
                <Text style={styles.browseBtnText}>Browse Restaurants</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: theme.colors.text.primary },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.colors.surface, borderRadius: 16, padding: 12, marginBottom: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  imageWrap: { position: 'relative' },
  restImage: { width: 72, height: 72, borderRadius: 12, resizeMode: 'cover' },
  imagePlaceholder: { backgroundColor: '#F0F4EF', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { fontSize: 30 },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  closedText: { color: '#fff', fontWeight: '700', fontSize: 12 },

  restInfo: { flex: 1 },
  restName: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 3 },
  restCuisine: { fontSize: 13, color: theme.colors.text.secondary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBadge: { backgroundColor: '#163D26', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  ratingText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  metaDot: { color: theme.colors.text.secondary },
  deliTime: { fontSize: 12, color: theme.colors.text.secondary, fontWeight: '500' },

  heartBtn: { padding: 8 },
  heartIcon: { fontSize: 22 },

  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  browseBtn: { backgroundColor: '#163D26', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
