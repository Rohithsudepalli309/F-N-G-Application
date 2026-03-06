import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TouchableNativeFeedback,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { theme } from '../theme';
import { useCartStore } from '../store/useCartStore';

const { width } = Dimensions.get('window');

const CARD_W = (width - 48) / 3;

interface Product {
  id: string;
  name: string;
  weight: string;
  price: number;
  originalPrice?: number;
  discountTag?: string;
  image: string;
  deliveryTime: string;
}

export const ProductCard = ({ product }: { product: Product }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const decrementFromCart = useCartStore((state) => state.decrementFromCart);
  const cartItems = useCartStore((state) => state.items);

  const qty = cartItems.find((i: any) => i.productId === product.id)?.quantity || 0;

  // 3D press animation
  const pressAnim = useRef(new Animated.Value(1)).current;
  const animateIn = () => Animated.spring(pressAnim, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const animateOut = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const handleAdd = () => {
    addToCart('default-store', {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  const handleDecrement = () => decrementFromCart(product.id);

  const discount = product.originalPrice
    ? Math.round(product.originalPrice - product.price)
    : null;

  return (
    <Animated.View style={[styles.card, { transform: [{ scale: pressAnim }] }]}>

      {/* ── 3D IMAGE CONTAINER ───────────────────────────────── */}
      <View style={styles.imageShadowWrap}>
        <View style={styles.imageContainer}>

          {/* Glossy top-left shimmer */}
          <View style={styles.glossOverlay} />

          <Image
            source={{ uri: product.image }}
            style={styles.image}
            resizeMode="contain"
          />

          {/* Favourite */}
          <TouchableOpacity style={styles.favBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.favIcon}>🤍</Text>
          </TouchableOpacity>

          {/* ADD / QTY pill — floats over the image box bottom edge */}
          <View style={styles.addBtnWrap}>
            {qty === 0 ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleAdd}
                onPressIn={animateIn}
                onPressOut={animateOut}
                activeOpacity={0.85}
              >
                <Text style={styles.addText}>ADD</Text>
                <Text style={styles.addPlus}>+</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyContainer}>
                <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={handleAdd}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── PRICE ROW ─────────────────────────────────────────── */}
      <View style={styles.priceRow}>
        <View style={styles.pricePill}>
          <Text style={styles.priceText}>₹{product.price}</Text>
        </View>
        {product.originalPrice ? (
          <Text style={styles.mrp}>₹{product.originalPrice}</Text>
        ) : null}
      </View>

      {discount ? (
        <Text style={styles.discountText}>₹{discount} OFF</Text>
      ) : null}

      {/* Dashed separator ─ */}
      <View style={styles.dashed} />

      {/* ── NAME & WEIGHT ─────────────────────────────────────── */}
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.weight} numberOfLines={1}>{product.weight}</Text>

      <View style={styles.deliveryRow}>
        <Text style={styles.bolt}>⚡</Text>
        <Text style={styles.deliveryTime}>{product.deliveryTime}</Text>
      </View>
    </Animated.View>
  );
};

/* ─────────────────────────────────────────────────────────────── STYLES ── */
const styles = StyleSheet.create({
  /* Outer card */
  card: {
    width: CARD_W,
    marginRight: 10,
    marginBottom: 22,
    backgroundColor: '#FFF',
  },

  /* 3-D shadow wrap: gives depth beneath the image box */
  imageShadowWrap: {
    borderRadius: 14,
    // iOS multi-layer shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    // Android elevation
    elevation: 6,
    backgroundColor: '#FFF',
    marginBottom: 12,
  },

  /* The actual image box */
  imageContainer: {
    width: '100%',
    aspectRatio: 0.88,
    backgroundColor: '#F4F6F8',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  /* Top-left gloss shimmer to fake 3D surface */
  glossOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '55%',
    height: '30%',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderBottomRightRadius: 50,
    zIndex: 2,
  },

  image: {
    width: '78%',
    height: '78%',
    zIndex: 1,
  },

  /* Heart icon */
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 5,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 20,
    padding: 3,
  },
  favIcon: { fontSize: 14 },

  /* ADD button wrapper — pokes out of the image box */
  addBtnWrap: {
    position: 'absolute',
    bottom: -14,
    alignSelf: 'center',
    zIndex: 10,
  },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#D32F2F',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    // 3D button shadow
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 5,
  },
  addText: {
    color: '#D32F2F',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  addPlus: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 2,
  },

  /* QTY stepper */
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    shadowColor: '#D32F2F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 9, paddingVertical: 5 },
  qtyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  qtyText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    minWidth: 16,
    textAlign: 'center',
  },

  /* Price */
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  pricePill: {
    backgroundColor: '#388E3C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    marginRight: 6,
    // Subtle 3D depth on the green pill
    shadowColor: '#388E3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  priceText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFF',
  },
  mrp: {
    fontSize: 11,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  discountText: {
    fontSize: 10,
    color: '#388E3C',
    fontFamily: theme.typography.fontFamily.bold,
    paddingHorizontal: 2,
    marginTop: 2,
  },

  /* Dashed separator */
  dashed: {
    borderStyle: 'dashed',
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    marginVertical: 7,
  },

  /* Name / Weight / Delivery */
  name: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#212121',
    paddingHorizontal: 2,
    lineHeight: 14,
    height: 30,
  },
  weight: {
    fontSize: 10,
    color: '#757575',
    paddingHorizontal: 2,
    marginTop: 1,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 4,
  },
  bolt: { fontSize: 10, marginRight: 2 },
  deliveryTime: {
    fontSize: 9,
    color: '#757575',
    fontFamily: theme.typography.fontFamily.medium,
  },
});
