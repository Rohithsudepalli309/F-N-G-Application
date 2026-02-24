import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { theme } from '../theme';

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
  return (
    <View style={styles.card}>
      {/* 1. Image Container */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
        <TouchableOpacity style={styles.favBtn}>
           <Text style={styles.favIcon}>❤️</Text>
        </TouchableOpacity>
        
        {/* ADD Button (Overlay) */}
        <TouchableOpacity style={styles.addBtn}>
          <Text style={styles.addText}>ADD</Text>
        </TouchableOpacity>
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
    width: (width - 48) / 3, // 3 columns for horizontal/compact grids
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
    borderColor: '#E91E63', // Zepto Pink/Magenta
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
    color: '#E91E63',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: 13,
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
    backgroundColor: '#F0F4F7', // Rounded price background
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
    color: '#108D10', // Zepto Green
    fontFamily: theme.typography.fontFamily.bold,
  },
  name: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#333',
    marginTop: 4,
    paddingHorizontal: 4,
    height: 36, // Fixed height for alignment
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
