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
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const CARD_W = (width - 48) / 3;

interface Product {
  id: string;
  name: string;
  brand?: string;
  weight: string;
  weightOptions?: string[];
  price: number;
  originalPrice?: number;
  discountTag?: string;
  image: any;
  deliveryTime: string;
}

export const ProductCard = ({ product }: { product: Product }) => {
  const addToCart = useCartStore((state) => state.addToCart);
  const decrementFromCart = useCartStore((state) => state.decrementFromCart);
  const cartItems = useCartStore((state) => state.items);

  const qty = cartItems.find((i: any) => i.productId === product.id)?.quantity || 0;

  const handleAdd = () => {
    addToCart('default-store', {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  const handleDecrement = () => decrementFromCart(product.id);

  const navigation = useNavigation<any>();
  const handlePress = () => {
    navigation.navigate('ProductDetail', { product });
  };

  return (
    <View style={styles.card}>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        {/* ── IMAGE CONTAINER ─────────────────────────────────── */}
        <View style={styles.imageContainer}>
        {product.discountTag && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{product.discountTag}</Text>
          </View>
        )}
        <Image
          source={typeof product.image === 'number' ? product.image : { uri: product.image }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* ── BRAND & NAME ─────────────────────────────────────── */}
      <View style={styles.infoContainer}>
        {product.brand && (
          <Text style={styles.brandText}>{product.brand.toUpperCase()}</Text>
        )}
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        
        {/* ── WEIGHT SELECTOR ─────────────────────────────────── */}
        <View style={styles.weightSelector}>
          <Text style={styles.weightText}>{product.weight}</Text>
          <Text style={styles.chevron}>▼</Text>
        </View>
      </View>
    </TouchableOpacity>

      {/* ── PRICE & ADD (Keep outside of main touchable) ─────── */}
      <View style={[styles.infoContainer, { paddingTop: 0 }]}>
        <View style={styles.bottomRow}>
          <View style={styles.priceCol}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{(product.price / 100).toLocaleString('en-IN')}</Text>
              {product.originalPrice && (
                <Text style={styles.mrp}>₹{(product.originalPrice / 100).toLocaleString('en-IN')}</Text>
              )}
            </View>
            <View style={styles.deliveryRow}>
              <Text style={styles.deliveryTime}>⚡ {product.deliveryTime}</Text>
            </View>
          </View>

          <View style={styles.actionCol}>
            {qty === 0 ? (
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
                <Text style={styles.addBtnText}>ADD</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.qtyStepper}>
                <TouchableOpacity style={styles.stepperBtn} onPress={handleDecrement}>
                  <Text style={styles.stepperText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyVal}>{qty}</Text>
                <TouchableOpacity style={styles.stepperBtn} onPress={handleAdd}>
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

/* ─────────────────────────────────────────────────────────────── STYLES ── */
const styles = StyleSheet.create({
  card: {
    width: (width - 48) / 2.2, // Slightly larger for better readability
    marginRight: 12,
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F2F2F2',
    overflow: 'hidden',
  },

  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    position: 'relative',
  },
  image: {
    width: '90%',
    height: '90%',
  },

  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#E45F10',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomRightRadius: 8,
    zIndex: 5,
  },
  discountBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '800',
  },

  infoContainer: {
    padding: 8,
    flex: 1,
  },
  brandText: {
    fontSize: 9,
    color: '#999',
    fontWeight: '700',
    marginBottom: 2,
  },
  name: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    lineHeight: 16,
    height: 32, // Exactly 2 lines
    marginBottom: 8,
  },

  weightSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F7F7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  weightText: {
    fontSize: 11,
    color: '#666',
  },
  chevron: {
    fontSize: 8,
    color: '#999',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceCol: {
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 13,
    fontWeight: '800',
    color: '#222',
    marginRight: 4,
  },
  mrp: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  deliveryRow: {
    marginTop: 2,
  },
  deliveryTime: {
    fontSize: 9,
    color: '#84C225',
    fontWeight: '700',
  },

  actionCol: {
    marginLeft: 4,
  },
  addBtn: {
    backgroundColor: '#F0F7F2',
    borderColor: '#84C225',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 55,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#84C225',
    fontSize: 11,
    fontWeight: '900',
  },

  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#84C225',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stepperText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  qtyVal: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
    minWidth: 14,
    textAlign: 'center',
  },
});
