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
           <Text style={styles.favIcon}>❤️</Text>
        </TouchableOpacity>
        
        {/* ADD Button or Quantity Selector */}
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

      {/* 2. Price Section */}
      <View style={styles.priceRow}>
        <View style={styles.priceTags}>
          <View style={styles.priceContainer}>
             <Text style={styles.currPrice}>₹{product.price}</Text>
             {product.originalPrice && <Text style={styles.oldPrice}>₹{product.originalPrice}</Text>}
          </View>
          {product.discountTag && (
            <Text style={styles.discountTag}>{product.discountTag} OFF</Text>
          )}
        </View>
      </View>

      {/* 3. Product Info */}
      <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.weight}>{product.weight}</Text>

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
    marginRight: 12,
    marginBottom: 20,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 8,
  },
  image: {
    width: '85%',
    height: '85%',
  },
  favBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  favIcon: {
    fontSize: 14,
  },
  addBtn: {
    position: 'absolute',
    bottom: -15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#339233', // Green like Zepto secondary ADD
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 6,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addText: {
    color: '#339233',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 13,
  },
  qtyContainer: {
    position: 'absolute',
    bottom: -15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#339233',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  qtyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
  },
  qtyText: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: theme.typography.fontFamily.bold,
    minWidth: 20,
    textAlign: 'center',
  },
  priceRow: {
    marginTop: 22,
    paddingHorizontal: 4,
  },
  priceTags: {
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  currPrice: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
    marginRight: 4,
    backgroundColor: '#F0F4F7',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  oldPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountTag: {
    fontSize: 11,
    color: '#108D10',
    fontFamily: theme.typography.fontFamily.bold,
  },
  name: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#333',
    marginTop: 4,
    paddingHorizontal: 4,
    height: 36,
  },
  weight: {
    fontSize: 11,
    color: '#666',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 6,
  },
  bolt: {
    fontSize: 10,
    marginRight: 2,
  },
  deliveryTime: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#666',
  }
});
