import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { ProductCard } from '../components/ProductCard';

// Generic Mock Data generator for specific categories
const getProductsForCategory = (categoryName: string) => {
  return [
    { id: 'p1', name: `${categoryName} Item 1`, weight: '500g', price: 120, originalPrice: 150, discountTag: '20% OFF', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329864.png', deliveryTime: '8 mins' },
    { id: 'p2', name: `${categoryName} Item 2`, weight: '1kg', price: 45, originalPrice: 60, discountTag: '₹15 OFF', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png', deliveryTime: '8 mins' },
    { id: 'p3', name: `${categoryName} Item 3`, weight: '250g', price: 85, originalPrice: 100, discountTag: '15% OFF', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329866.png', deliveryTime: '8 mins' },
    { id: 'p4', name: `${categoryName} Item 4`, weight: '400g', price: 210, originalPrice: 250, discountTag: '₹40 OFF', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329867.png', deliveryTime: '8 mins' },
    { id: 'p5', name: `${categoryName} Item 5`, weight: '1 Pack', price: 55, originalPrice: 75, discountTag: '₹20 OFF', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329868.png', deliveryTime: '8 mins' },
    { id: 'p6', name: `${categoryName} Item 6`, weight: '1 pc', price: 19, originalPrice: 25, discountTag: '24% OFF', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329869.png', deliveryTime: '8 mins' },
  ];
};

export const ProductListScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { categoryName } = route.params as { categoryName: string };
  const products = getProductsForCategory(categoryName);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{categoryName}</Text>
            <Text style={styles.headerSubtitle}>{products.length} Items</Text>
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Text style={{ fontSize: 20 }}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Bar Placeholder */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar}>
        {['Relevance', 'Price: Low to High', 'Price: High to Low', 'Discount'].map((filter, i) => (
          <TouchableOpacity key={filter} style={[styles.filterChip, i === 0 && styles.activeFilter]}>
            <Text style={[styles.filterText, i === 0 && styles.activeFilterText]}>{filter}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Product Grid */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cardContainer}>
             <ProductCard product={item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  backArrow: {
    fontSize: 24,
    color: '#000',
    marginTop: -4,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    fontFamily: theme.typography.fontFamily.medium,
  },
  searchBtn: {
    padding: 8,
  },
  filterBar: {
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxHeight: 60,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  activeFilter: {
    backgroundColor: '#F0F8E8',
    borderColor: '#2E7D32',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontFamily: theme.typography.fontFamily.medium,
  },
  activeFilterText: {
    color: '#2E7D32',
    fontFamily: theme.typography.fontFamily.bold,
  },
  listContent: {
    padding: 8,
  },
  cardContainer: {
    flex: 1,
    padding: 8,
  },
});
