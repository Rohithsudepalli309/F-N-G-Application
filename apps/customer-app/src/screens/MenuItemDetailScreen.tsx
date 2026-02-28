/**
 * MenuItemDetailScreen.tsx
 * Spec §8.1 #9 — Full dish detail with photo, description, addons, quantity control.
 * Receives item data from parent via route params (no extra API call needed).
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCartStore } from '../store/useCartStore';
import { theme } from '../theme';

interface Addon {
  id: string;
  name: string;
  price: number; // paise
}

interface AddonGroup {
  title: string;
  multiSelect: boolean;
  options: Addon[];
}

interface RouteParams {
  item: {
    id: string;
    name: string;
    description: string;
    price: number;     // paise
    mrp?: number;
    image_url?: string;
    is_veg: boolean;
    is_available: boolean;
    rating?: number;
    calories?: string;
    addon_groups?: AddonGroup[];
    restaurant_id?: string;
    store_id?: string;
  };
}

const VegBadge = ({ isVeg }: { isVeg: boolean }) => (
  <View style={[styles.vegBadge, { borderColor: isVeg ? '#1A7A3C' : '#DC3545' }]}>
    <View style={[styles.vegDot, { backgroundColor: isVeg ? '#1A7A3C' : '#DC3545' }]} />
  </View>
);

export const MenuItemDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { item } = (route.params as RouteParams);

  const { addItem, updateQuantity, items: cartItems } = useCartStore();

  const cartItem = cartItems.find(ci => ci.productId === item.id);
  const cartQty = cartItem?.quantity ?? 0;

  const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({});

  const toggleAddon = (groupTitle: string, addonId: string, multiSelect: boolean) => {
    setSelectedAddons(prev => {
      const current = prev[groupTitle] ?? [];
      if (multiSelect) {
        return {
          ...prev,
          [groupTitle]: current.includes(addonId)
            ? current.filter(id => id !== addonId)
            : [...current, addonId],
        };
      }
      return { ...prev, [groupTitle]: current[0] === addonId ? [] : [addonId] };
    });
  };

  const addonTotal = (item.addon_groups ?? []).reduce((total, group) => {
    const ids = selectedAddons[group.title] ?? [];
    return total + group.options
      .filter(o => ids.includes(o.id))
      .reduce((s, o) => s + o.price, 0);
  }, 0);

  const finalPrice = item.price + addonTotal;
  const discount = item.mrp ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0;

  const handleAddToCart = () => {
    addItem({
      productId: item.id,
      name: item.name,
      price: finalPrice,
      storeId: item.restaurant_id ?? item.store_id ?? 'default',
      image: item.image_url,
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Hero image with back button */}
      <View style={styles.heroContainer}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={styles.heroImage} />
          : <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <Text style={styles.heroPlaceholderText}>🍽️</Text>
            </View>
        }
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        {discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discount}% OFF</Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <VegBadge isVeg={item.is_veg} />
            <Text style={styles.itemName}>{item.name}</Text>
          </View>

          <View style={styles.metaRow}>
            {item.rating != null && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★ {item.rating.toFixed(1)}</Text>
              </View>
            )}
            {item.calories && (
              <Text style={styles.calories}>🔥 {item.calories}</Text>
            )}
            {!item.is_available && (
              <View style={styles.unavailableBadge}>
                <Text style={styles.unavailableText}>Currently Unavailable</Text>
              </View>
            )}
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{(finalPrice / 100).toFixed(0)}</Text>
            {item.mrp && item.mrp > item.price && (
              <Text style={styles.mrp}>₹{(item.mrp / 100).toFixed(0)}</Text>
            )}
          </View>

          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : null}
        </View>

        {/* Addon Groups */}
        {(item.addon_groups ?? []).map(group => (
          <View key={group.title} style={styles.addonGroup}>
            <View style={styles.addonGroupHeader}>
              <Text style={styles.addonGroupTitle}>{group.title}</Text>
              <Text style={styles.addonGroupHint}>
                {group.multiSelect ? 'Select multiple' : 'Select one'}
              </Text>
            </View>
            {group.options.map(option => {
              const isSelected = (selectedAddons[group.title] ?? []).includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.addonOption, isSelected && styles.addonOptionSelected]}
                  onPress={() => toggleAddon(group.title, option.id, group.multiSelect)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.addonCheck, isSelected && styles.addonCheckFilled]}>
                    {isSelected && <Text style={styles.addonCheckMark}>✓</Text>}
                  </View>
                  <Text style={styles.addonName}>{option.name}</Text>
                  {option.price > 0 && (
                    <Text style={styles.addonPrice}>+₹{(option.price / 100).toFixed(0)}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.bottomBar}>
        {cartQty > 0 ? (
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.id, cartQty - 1)}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyCount}>{cartQty}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.id, cartQty + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addBtn, !item.is_available && styles.addBtnDisabled]}
            onPress={handleAddToCart}
            disabled={!item.is_available}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>
              Add to Cart — ₹{(finalPrice / 100).toFixed(0)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },

  heroContainer: { position: 'relative' },
  heroImage: { width: '100%', height: 260, resizeMode: 'cover' },
  heroPlaceholder: { backgroundColor: '#F0F4EF', alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { fontSize: 80 },
  backBtn: {
    position: 'absolute', top: 44, left: 16,
    backgroundColor: 'rgba(0,0,0,0.42)', borderRadius: 20,
    width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 20 },
  discountBadge: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: '#DC3545', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4,
  },
  discountText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  infoSection: { padding: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  vegBadge: { marginTop: 4, width: 18, height: 18, borderRadius: 3, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  vegDot: { width: 8, height: 8, borderRadius: 4 },
  itemName: { flex: 1, fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, lineHeight: 28 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
  ratingBadge: { backgroundColor: '#163D26', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ratingText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  calories: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '500' },
  unavailableBadge: { backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  unavailableText: { color: '#DC3545', fontWeight: '700', fontSize: 12 },

  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  price: { fontSize: 26, fontWeight: '800', color: '#163D26' },
  mrp: { fontSize: 16, color: theme.colors.text.secondary, textDecorationLine: 'line-through' },

  description: { fontSize: 14, color: theme.colors.text.secondary, lineHeight: 22 },

  addonGroup: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: theme.colors.surface,
    borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border,
  },
  addonGroupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, backgroundColor: '#163D2608',
  },
  addonGroupTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text.primary },
  addonGroupHint: { fontSize: 12, color: theme.colors.text.secondary },
  addonOption: {
    flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  addonOptionSelected: { backgroundColor: '#163D2606' },
  addonCheck: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center',
  },
  addonCheckFilled: { borderColor: '#163D26', backgroundColor: '#163D26' },
  addonCheckMark: { color: '#fff', fontSize: 12, fontWeight: '700' },
  addonName: { flex: 1, fontSize: 14, color: theme.colors.text.primary },
  addonPrice: { fontSize: 13, color: theme.colors.accent, fontWeight: '700' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: theme.colors.background, padding: 16,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  addBtn: {
    backgroundColor: '#F5A826', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#F5A826', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 6,
  },
  addBtnDisabled: { backgroundColor: '#D1D5DB' },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  qtyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24,
  },
  qtyBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#163D26',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { color: '#fff', fontSize: 24, fontWeight: '700', lineHeight: 28 },
  qtyCount: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, minWidth: 36, textAlign: 'center' },
});
