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
    marginRight: 10,
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 6,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  image: {
    width: '90%',
    height: '90%',
  },
  favBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
  },
  favIcon: {
    fontSize: 12,
  },
  addBtn: {
    position: 'absolute',
    bottom: -12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2E7D32',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
  },
  addText: {
    color: '#2E7D32',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 12,
    fontWeight: '900',
  },
  qtyContainer: {
    position: 'absolute',
    bottom: -12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32', // F&G Brand Green
    borderRadius: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    overflow: 'hidden',
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  qtyBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qtyText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    minWidth: 16,
    textAlign: 'center',
  },
  priceRow: {
    marginTop: 16,
    paddingHorizontal: 2,
  },
  priceTags: {
    marginBottom: 0,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currPrice: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
    marginRight: 4,
  },
  oldPrice: {
    fontSize: 10,
    color: '#757575',
    textDecorationLine: 'line-through',
  },
  discountTag: {
    fontSize: 9,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginTop: 1,
  },
  name: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#212121',
    marginTop: 2,
    paddingHorizontal: 2,
    height: 28,
    lineHeight: 14,
  },
  weight: {
    fontSize: 10,
    color: '#757575',
    paddingHorizontal: 2,
    marginTop: 0,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 4,
  },
  bolt: {
    fontSize: 9,
    marginRight: 2,
  },
  deliveryTime: {
    fontSize: 9,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#757575',
    fontWeight: 'bold',
  }
});
