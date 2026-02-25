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
import { useRoute, useNavigation, useIsFocused } from '@react-navigation/native';
import { theme } from '../theme';
import { ProductCard } from '../components/ProductCard';
import { api } from '../services/api';
import { ActivityIndicator, RefreshControl } from 'react-native';

export const ProductListScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { categoryName } = route.params as { categoryName: string };
  
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get('/products', {
        params: { category: categoryName }
      });
      setProducts(data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    if (isFocused) {
      fetchProducts();
    }
  }, [isFocused, categoryName]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

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
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={[styles.listContent, products.length === 0 && { flex: 1, justifyContent: 'center' }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found in this category.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
               <ProductCard product={{
                 id: item.id,
                 name: item.name,
                 weight: item.unit || '1 Pack',
                 price: item.price / 100,
                 originalPrice: item.original_price ? item.original_price / 100 : undefined,
                 image: item.image_url,
                 deliveryTime: '8 mins',
                 discountTag: item.original_price ? `${Math.round((1 - (item.price / item.original_price)) * 100)}%` : undefined
               }} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontFamily: theme.typography.fontFamily.medium,
  },
});
