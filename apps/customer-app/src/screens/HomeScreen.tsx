import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

// ── Types ─────────────────────────────────────────────────────────────────
interface Store {
  id: string;
  name: string;
  type: string;
  distance: number;
  rating: number;
  image_url?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

// ── Skeleton Card ─────────────────────────────────────────────────────────
const SkeletonCard = ({ opacity }: { opacity: Animated.Value }) => (
  <Animated.View style={[styles.skeletonCard, { opacity }]}>
    <View style={styles.skeletonImage} />
    <View style={styles.skeletonContent}>
      <View style={[styles.skeletonLine, { width: '60%' }]} />
      <View style={[styles.skeletonLine, { width: '40%', marginTop: 8 }]} />
    </View>
  </Animated.View>
);

const SkeletonList = () => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 700, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.ease, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  return (
    <View style={styles.list}>
      {[1, 2, 3].map((k) => <SkeletonCard key={k} opacity={pulse} />)}
    </View>
  );
};

// ── Store Card ─────────────────────────────────────────────────────────────
const StoreCard = ({ item, onPress }: { item: Store; onPress: () => void }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        <Image
          source={{ uri: item.image_url || `https://picsum.photos/seed/${item.id}/400/200` }}
          style={styles.image}
        />
        <View style={styles.content}>
          <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.storeType}>{item.type}  •  {item.distance} km away</Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>★ {item.rating}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────
const FOOD_CATEGORIES: Category[] = [
  { id: 'North',  name: 'North', icon: '🏰' },
  { id: 'South',  name: 'South', icon: '🥥' },
  { id: 'West',   name: 'West',  icon: '🎡' },
  { id: 'East',   name: 'East',  icon: '🏮' },
];

const GROCERY_CATEGORIES: Category[] = [
  { id: 'Staples',   name: 'Staples',  icon: '🌾' },
  { id: 'Fresh',     name: 'Fresh',    icon: '🥦' },
  { id: 'Snacks',    name: 'Snacks',   icon: '🍪' },
  { id: 'Household', name: 'Home',     icon: '🧻' },
];

export const HomeScreen = () => {
  const [stores, setStores]             = useState<Store[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeMode, setActiveMode]     = useState<'food' | 'grocery'>('food');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);

  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);

  // Mode switcher press animation
  const foodScale    = useRef(new Animated.Value(1)).current;
  const groceryScale = useRef(new Animated.Value(1)).current;

  const animateMode = (mode: 'food' | 'grocery') => {
    const target = mode === 'food' ? foodScale : groceryScale;
    Animated.sequence([
      Animated.timing(target, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(target, { toValue: 1, useNativeDriver: true, speed: 40 }),
    ]).start();
  };

  // Single fetch, re-runs when mode/region changes
  useEffect(() => {
    let cancelled = false;
    const fetchStores = async () => {
      setLoading(true);
      try {
        const region = selectedRegion ? `&region=${selectedRegion}` : '';
        const { data } = await api.get(`/stores?type=${activeMode}${region}`);
        if (!cancelled) setStores(data);
      } catch (err) {
        console.error('Fetch stores failed', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStores();
    return () => { cancelled = true; };
  }, [activeMode, selectedRegion]);

  const categories = activeMode === 'food' ? FOOD_CATEGORIES : GROCERY_CATEGORIES;

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.categoryItem, selectedRegion === item.id && styles.selectedCategory]}
      onPress={() => setSelectedRegion(item.id === selectedRegion ? null : item.id)}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[styles.categoryName, selectedRegion === item.id && styles.selectedCategoryText]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.name || 'there'} 👋</Text>
            <Text style={styles.subtitle}>What are you craving today?</Text>
          </View>
        </View>

        {/* Mode Switcher */}
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={[styles.modeBtn, activeMode === 'food' && styles.activeModeBtn]}
            onPress={() => { animateMode('food'); setActiveMode('food'); setSelectedRegion(null); }}
            activeOpacity={0.9}
          >
            <Animated.Text
              style={[styles.modeText, activeMode === 'food' && styles.activeModeText,
                { transform: [{ scale: foodScale }] }]}
            >
              🥘  Food
            </Animated.Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeBtn, activeMode === 'grocery' && styles.activeModeBtn]}
            onPress={() => { animateMode('grocery'); setActiveMode('grocery'); setSelectedRegion(null); }}
            activeOpacity={0.9}
          >
            <Animated.Text
              style={[styles.modeText, activeMode === 'grocery' && styles.activeModeText,
                { transform: [{ scale: groceryScale }] }]}
            >
              🛒  Grocery
            </Animated.Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Category Strip ──────────────────────────────────────────── */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* ── Store List ──────────────────────────────────────────────── */}
      {loading ? (
        <SkeletonList />
      ) : stores.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>No stores found nearby.</Text>
        </View>
      ) : (
        <FlatList
          data={stores}
          renderItem={({ item }) => (
            <StoreCard
              item={item}
              onPress={() =>
                (navigation as any).navigate('Store', { storeId: item.id, name: item.name })
              }
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  greeting: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xl,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.s,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 4,
    borderRadius: theme.borderRadius.m,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: theme.spacing.s + 2,
    alignItems: 'center',
    borderRadius: theme.borderRadius.s,
  },
  activeModeBtn: {
    backgroundColor: theme.colors.background,
    ...theme.shadows.card,
  },
  modeText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.s,
    color: theme.colors.text.secondary,
  },
  activeModeText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  categoryContainer: {
    backgroundColor: theme.colors.background,
    paddingBottom: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  categoryList: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.m,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedCategory: {
    backgroundColor: theme.colors.primary + '12',
    borderColor: theme.colors.primary,
  },
  categoryIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
  },
  selectedCategoryText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  list: {
    padding: theme.spacing.m,
    paddingBottom: 40,
  },
  // Store Card
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.m,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  image: {
    height: 160,
    width: '100%',
  },
  content: {
    padding: theme.spacing.m,
    position: 'relative',
  },
  storeName: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.l,
    color: theme.colors.text.primary,
    marginBottom: 2,
    paddingRight: 60,
  },
  storeType: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  ratingBadge: {
    position: 'absolute',
    right: theme.spacing.m,
    top: theme.spacing.m,
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.s,
  },
  ratingText: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.bold,
  },
  // Skeleton
  skeletonCard: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.m,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  skeletonImage: {
    height: 160,
    backgroundColor: '#E8EAED',
  },
  skeletonContent: {
    padding: theme.spacing.m,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#E8EAED',
    borderRadius: 7,
  },
  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.m,
  },
  emptyText: {
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.m,
  },
});
