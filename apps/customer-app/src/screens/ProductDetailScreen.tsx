import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { useCartStore } from '../store/useCartStore';

const { width } = Dimensions.get('window');

export const ProductDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { product } = route.params; // Expects a product object

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const { addToCart, decrementFromCart, items: cartItems } = useCartStore();
  const cartItem = cartItems.find(ci => ci.productId === String(product.id));
  const qty = cartItem?.quantity ?? 0;

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const { data } = await api.get(`/personalization/recommendations/${product.id}`);
        setRecommendations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecs();
  }, [product.id]);

  const handleAdd = () => {
    addToCart('default-store', {
      productId: String(product.id),
      name: product.name,
      price: product.price,
      quantity: 1,
    });
  };

  const handleDecrement = () => decrementFromCart(String(product.id));

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="share-variant" size={22} color="#444" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialCommunityIcons name="heart-outline" size={22} color="#444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image */}
        <View style={styles.imageSection}>
          <Image
            source={typeof product.image === 'number' ? product.image : { uri: product.image || product.image_url }}
            style={styles.image}
            resizeMode="contain"
          />
          {product.discountTag && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{product.discountTag}</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoSection}>
          <Text style={styles.brand}>{product.brand?.toUpperCase() || 'PREMIUM'}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.delivery}>⚡ 10 MINS DELIVERY</Text>

          {/* Weight Selection (Mock) */}
          <View style={styles.weightSection}>
            <Text style={styles.sectionTitle}>Select Variant</Text>
            <TouchableOpacity style={styles.weightRow}>
              <Text style={styles.weightLabel}>{product.weight || product.unit || '1 pack'}</Text>
              <Text style={styles.priceSmall}>₹{(product.price / 100).toLocaleString('en-IN')}</Text>
              <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Pricing */}
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.currency}>₹</Text>
              <Text style={styles.priceValue}>{(product.price / 100).toLocaleString('en-IN')}</Text>
              {product.originalPrice && (
                <Text style={styles.mrp}>MRP: ₹{(product.originalPrice / 100).toLocaleString('en-IN')}</Text>
              )}
            </View>
            <Text style={styles.taxLabel}>(Inclusive of all taxes)</Text>
          </View>
        </View>

        {/* Product Details (Static example) */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Product Details</Text>
          <View style={styles.detailItem}>
            <Text style={styles.detailKey}>Shelf Life</Text>
            <Text style={styles.detailValue}>6 Months</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailKey}>Manufacturer</Text>
            <Text style={styles.detailValue}>{product.brand || 'Premium Brand Ltd.'}</Text>
          </View>
          <Text style={styles.description}>
            {product.description || 'Highly accurate and premium quality product sourced directly from the manufacturer to ensure freshness and authenticity.'}
          </Text>
        </View>

        {/* Frequently Bought Together */}
        <View style={styles.recommendations}>
          <Text style={styles.recommendationTitle}>Frequently Bought Together</Text>
          {loadingRecs ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
          ) : recommendations.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recScroll}>
              {recommendations.map(item => (
                <ProductCard
                  key={item.id}
                  product={{
                    id: String(item.id),
                    name: item.name,
                    brand: item.brand,
                    weight: item.unit || '1 pack',
                    price: item.price,
                    originalPrice: item.original_price,
                    image: item.image_url,
                    deliveryTime: '10 mins',
                  }}
                />
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.noRecs}>No recommendations available for this product.</Text>
          )}
        </View>
      </ScrollView>

      {/* Floating Add to Cart */}
      <View style={styles.footer}>
        {qty === 0 ? (
          <TouchableOpacity style={styles.mainAddBtn} onPress={handleAdd}>
            <Text style={styles.mainAddText}>ADD TO BASKET</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.stepper}>
            <TouchableOpacity style={styles.stepperBtn} onPress={handleDecrement}>
              <Text style={styles.stepperBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperVal}>{qty} in basket</Text>
            <TouchableOpacity style={styles.stepperBtn} onPress={handleAdd}>
              <Text style={styles.stepperBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 10, alignItems: 'center' },
  backBtn: { padding: 8 },
  headerActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8 },
  
  imageSection: { width: '100%', aspectRatio: 1.2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', position: 'relative' },
  image: { width: '80%', height: '80%' },
  discountBadge: { position: 'absolute', top: 20, left: 20, backgroundColor: '#E45F10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  discountText: { color: '#FFF', fontWeight: '800', fontSize: 12 },

  infoSection: { padding: 16 },
  brand: { fontSize: 14, color: '#84C225', fontWeight: '800', letterSpacing: 1 },
  name: { fontSize: 20, fontWeight: '700', color: '#222', marginTop: 4 },
  delivery: { fontSize: 12, fontWeight: '800', color: '#6A6A6A', marginTop: 8, backgroundColor: '#F0F0F0', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },

  weightSection: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#222', marginBottom: 12 },
  weightRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#84C225', borderRadius: 8, backgroundColor: '#F0F7F2' },
  weightLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#222' },
  priceSmall: { fontSize: 14, fontWeight: '800', marginRight: 12, color: '#222' },

  priceContainer: { marginTop: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline' },
  currency: { fontSize: 18, fontWeight: '800', color: '#222' },
  priceValue: { fontSize: 28, fontWeight: '900', color: '#222', marginLeft: 2 },
  mrp: { fontSize: 14, color: '#999', textDecorationLine: 'line-through', marginLeft: 12 },
  taxLabel: { fontSize: 11, color: '#999', marginTop: 4 },

  detailsSection: { padding: 16 },
  detailItem: { flexDirection: 'row', marginBottom: 8 },
  detailKey: { width: 120, fontSize: 13, color: '#999' },
  detailValue: { flex: 1, fontSize: 13, color: '#222', fontWeight: '500' },
  description: { fontSize: 13, color: '#666', lineHeight: 20, marginTop: 12 },

  recommendations: { padding: 16, backgroundColor: '#F9F9F9', marginTop: 8 },
  recommendationTitle: { fontSize: 16, fontWeight: '800', color: '#222', marginBottom: 16 },
  recScroll: { marginHorizontal: -16, paddingHorizontal: 16 },
  noRecs: { fontSize: 13, color: '#999', fontStyle: 'italic', marginTop: 10 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  mainAddBtn: { backgroundColor: '#84C225', paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  mainAddText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  stepper: { flexDirection: 'row', backgroundColor: '#84C225', borderRadius: 8, height: 54, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  stepperBtn: { padding: 10 },
  stepperBtnText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  stepperVal: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
