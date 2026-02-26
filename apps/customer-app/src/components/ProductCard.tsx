import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../theme';
import { useCartStore } from '../store/useCartStore';

const { width } = Dimensions.get('window');

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
  const removeFromCart = useCartStore((state) => state.removeFromCart);
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

  const handleIncrement = () => {
    addToCart('default-store', {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  const handleDecrement = () => {
    decrementFromCart(product.id);
  };

  return (
    <View style={styles.card}>
      {/* 1. Image Container */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
        <TouchableOpacity style={styles.favBtn}>
           <Text style={styles.favIcon}>🤍</Text>
        </TouchableOpacity>
        
        {/* ADD Button or Quantity Selector */}
        <View style={styles.addButtonWrapper}>
          {qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addText}>ADD</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.qtyContainer}>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleDecrement}>
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={handleIncrement}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* 2. Price Section */}
      <View style={styles.priceSection}>
        <View style={styles.priceRow}>
          <View style={styles.currPricePill}>
             <Text style={styles.currPriceText}>₹{product.price}</Text>
          </View>
          {product.originalPrice && <Text style={styles.oldPrice}>₹{product.originalPrice}</Text>}
        </View>
        {product.discountTag && (
          <Text style={styles.discountTag}>{product.discountTag} OFF</Text>
        )}
      </View>

      <View style={styles.dashedSeparator} />

      {/* 3. Product Info */}
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.weight} numberOfLines={1}>{product.weight}</Text>

      {/* 4. Delivery Speed */}
      <View style={styles.deliveryRow}>
        <Text style={styles.bolt}>⚡</Text>
        <Text style={styles.deliveryTime}>{product.deliveryTime}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: (width - 48) / 3,
    marginRight: 10,
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.85,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  image: {
    width: '80%',
    height: '80%',
  },
  favBtn: {
    position: 'absolute',
    top: 6,
    right: 8,
    zIndex: 10,
  },
  favIcon: {
    fontSize: 16,
    color: '#E91E63',
  },
  addButtonWrapper: {
    position: 'absolute',
    bottom: -10,
    right: 8,
    zIndex: 10,
  },
  addBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E91E63',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  addText: {
    color: '#E91E63',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    fontWeight: '900',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E91E63',
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  qtyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  qtyText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    minWidth: 16,
    textAlign: 'center',
  },
  priceSection: {
    paddingHorizontal: 2,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  currPricePill: {
    backgroundColor: '#388E3C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  currPriceText: {
    fontSize: 12,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFF',
  },
  oldPrice: {
    fontSize: 12,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  discountTag: {
    fontSize: 10,
    color: '#388E3C',
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: 1,
  },
  dashedSeparator: {
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    marginVertical: 8,
  },
  name: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#212121',
    paddingHorizontal: 2,
    height: 32,
    lineHeight: 14,
  },
  weight: {
    fontSize: 10,
    color: '#757575',
    paddingHorizontal: 2,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 4,
  },
  bolt: {
    fontSize: 10,
    color: '#757575',
    marginRight: 2,
  },
  deliveryTime: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#757575',
  }
});
