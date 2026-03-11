import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';
import { useCartStore } from '../store/useCartStore';
import { useLivePrices } from '../hooks/useLivePrices';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  category: string;
  image_url?: string;
  is_veg?: boolean;
  is_available?: boolean;
  rating?: number;
  calories?: number;
  addon_groups?: any[];
}

type PriceFlash = 'up' | 'down';

// --- Animated Price Row ------------------------------------------------------------------------------─
const PriceCell = ({ item, flash }: { item: Product; flash?: PriceFlash }) => {
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!flash) return;
    bgAnim.setValue(1);
    Animated.timing(bgAnim, {
      toValue: 0,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [flash, item.price]);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'rgba(0,0,0,0)',
      flash === 'up' ? 'rgba(220,53,69,0.12)' : 'rgba(40,167,69,0.12)',
    ],
  });

  return (
    <Animated.View style={[styles.priceRow, { backgroundColor: bgColor, borderRadius: 6, paddingHorizontal: 4 }]}>
      <Text style={[
        styles.itemPrice,
        flash === 'up'   && styles.priceUp,
        flash === 'down' && styles.priceDown,
      ]}>
        ₹{(item.price / 100).toLocaleString('en-IN')}
      </Text>
      {flash && (
        <Text style={[styles.trend, flash === 'up' ? styles.priceUp : styles.priceDown]}>
          {flash === 'up' ? '▲ Surge' : '▼ Drop'}
        </Text>
      )}
    </Animated.View>
  );
};

// --- Product Row ------------------------------------------------------------------------------------------
const ProductRow = ({
  item,
  flash,
  qty,
  onAdd,
  onItemPress,
}: {
  item: Product;
  flash?: PriceFlash;
  qty: number;
  onAdd: () => void;
  onItemPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    onAdd();
  };

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity style={styles.itemInfo} onPress={onItemPress} activeOpacity={0.7}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <PriceCell item={item} flash={flash} />
        <Text style={styles.itemCategory}>{item.category}</Text>
      </TouchableOpacity>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.addButton, qty > 0 && styles.addButtonActive]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          {qty > 0 ? (
            <Text style={[styles.addButtonText, styles.addButtonTextActive]}>{qty} ✓</Text>
          ) : (
            <Text style={styles.addButtonText}>ADD</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// --- Store Screen ---------------------------------------------------------------------------------------─
export const StoreScreen = () => {
  const [products, setProducts]   = useState<Product[]>([]);
  const [highlights, setHighlights] = useState<Record<string, PriceFlash>>({});

  const route      = useRoute();
  const navigation = useNavigation();
  const { storeId, name } = route.params as { storeId: string; name: string };

  const addToCart  = useCartStore((state) => state.addToCart);
  const cartItems  = useCartStore((state) => state.items);

  // Cart bar slide-up animation
  const cartBarAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(cartBarAnim, {
      toValue: cartItems.length > 0 ? 1 : 0,
      useNativeDriver: true,
      speed: 14,
      bounciness: 6,
    }).start();
  }, [cartItems.length]);

  useEffect(() => {
    api.get(`/products?storeId=${storeId}`)
      .then(({ data }) => setProducts(data))
      .catch(console.error);
  }, [storeId]);

  // Live price updates
  const onPriceUpdate = React.useCallback((payload: any) => {
    setProducts((prev) =>
      prev.map((p) => {
        const update = payload.updates.find((u: any) => u.productId === p.id);
        if (!update) return p;

        const factor   = 1 + parseFloat(update.fluctuation);
        const newPrice = Math.round(p.price * factor);
        const direction: PriceFlash = parseFloat(update.fluctuation) > 0 ? 'up' : 'down';

        setHighlights((h) => ({ ...h, [p.id]: direction }));
        setTimeout(() => {
          setHighlights((h) => {
            const next = { ...h };
            delete next[p.id];
            return next;
          });
        }, 2000);

        return { ...p, price: newPrice };
      })
    );
  }, []);

  useLivePrices({ onPriceUpdate });

  const getQtyInCart = (productId: string) =>
    cartItems.filter((i: any) => i.productId === productId).reduce((s: number, i: any) => s + i.quantity, 0);

  const cartBarTranslate = cartBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const totalItems = cartItems.reduce((s: number, i: any) => s + i.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.storeTitle} numberOfLines={1}>{name}</Text>
          <Text style={styles.storeSubtitle}>
            {products.length > 0 ? `${products.length} items available` : 'Loading menu…'}
          </Text>
        </View>
      </View>

      <FlatList
        data={products}
        renderItem={({ item }) => (
          <ProductRow
            item={item}
            flash={highlights[item.id]}
            qty={getQtyInCart(item.id)}
            onAdd={() => addToCart(storeId, { productId: item.id, name: item.name, price: item.price, quantity: 1 })}
            onItemPress={() => (navigation as any).navigate('MenuItemDetail', { item: { ...item, store_id: storeId } })}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Cart Bar */}
      {cartItems.length > 0 && (
        <Animated.View
          style={[styles.cartBar, { transform: [{ translateY: cartBarTranslate }] }]}
        >
          <TouchableOpacity
            style={styles.cartBarInner}
            onPress={() => (navigation as any).navigate('Cart')}
            activeOpacity={0.9}
          >
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{totalItems}</Text>
            </View>
            <Text style={styles.cartText}>View Cart</Text>
            <Text style={styles.cartArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

// --- Styles ------------------------------------------------------------------------------------------------─
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backBtn: { padding: 6, marginRight: 8 },
  backBtnText: { fontSize: 22, color: theme.colors.text.primary, fontWeight: '600' },
  storeTitle: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xl,
    color: theme.colors.text.primary,
  },
  storeSubtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  list: {
    paddingBottom: 120, // Enough room so cart bar doesn't cover last item
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface,
  },
  itemInfo: {
    flex: 1,
    marginRight: theme.spacing.m,
  },
  itemName: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.m,
    color: theme.colors.text.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  itemPrice: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.m,
    color: theme.colors.text.primary,
  },
  priceUp: {
    color: theme.colors.error || '#DC3545',
  },
  priceDown: {
    color: theme.colors.success,
  },
  trend: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
  },
  itemCategory: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    marginTop: 3,
  },
  addButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    minWidth: 64,
    alignItems: 'center',
  },
  addButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  addButtonText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.s,
  },
  addButtonTextActive: {
    color: '#FFFFFF',
  },
  // Cart Bar
  cartBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: theme.spacing.m,
    right: theme.spacing.m,
    ...theme.shadows.card,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  cartBarInner: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xs,
  },
  cartText: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.m,
  },
  cartArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
  },
});
