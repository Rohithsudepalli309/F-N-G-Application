import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Image } from 'react-native';
import { theme } from '../theme';
import { ProductCard } from '../components/ProductCard';
import { BottomTabs } from '../components/BottomTabs';

const FRESH_ITEMS = [
  { id: 'f1', name: 'Alphonso Mango', weight: '2 pcs', price: 299, originalPrice: 350, discountTag: '15% OFF', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329864.png', deliveryTime: '10 mins' },
  { id: 'f2', name: 'Fresh Strawberry', weight: '200g', price: 99, originalPrice: 120, discountTag: '₹21 OFF', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png', deliveryTime: '8 mins' },
  { id: 'f3', name: 'Organic Spinach', weight: '250g', price: 25, originalPrice: 30, discountTag: '₹5 OFF', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329866.png', deliveryTime: '8 mins' },
  { id: 'f4', name: 'Farm Eggs', weight: '6 pcs', price: 48, originalPrice: 55, discountTag: '₹7 OFF', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329867.png', deliveryTime: '8 mins' },
];

export const FreshScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fresh Produce</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroBox}>
          <Image source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2329/2329864.png' }} style={styles.heroImg} />
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Farm to Fork</Text>
            <Text style={styles.heroSubtitle}>Delivering nutrients at lightning speed.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organic Selections</Text>
          <View style={styles.grid}>
            {FRESH_ITEMS.map((item) => (
              <View key={item.id} style={styles.cardContainer}>
                 <ProductCard product={item} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomTabs activeTab="Fresh" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  heroBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  heroImg: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#2E7D32',
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#333',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  cardContainer: {
    width: '50%',
    padding: 8,
  },
});
