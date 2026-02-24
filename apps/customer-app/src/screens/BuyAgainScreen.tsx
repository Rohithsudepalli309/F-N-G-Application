import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { ProductCard } from '../components/ProductCard';
import { BottomTabs } from '../components/BottomTabs';

const RECENT_ITEMS = [
  { id: 'p1', name: 'Milk', weight: '500ml', price: 28, originalPrice: 30, discountTag: '₹2 OFF', image: 'https://cdn-icons-png.flaticon.com/512/3050/3050161.png', deliveryTime: '8 mins' },
  { id: 'p2', name: 'Bread', weight: '400g', price: 40, originalPrice: 45, discountTag: '₹5 OFF', image: 'https://cdn-icons-png.flaticon.com/512/3050/3050161.png', deliveryTime: '8 mins' },
];

export const BuyAgainScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buy Again</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoBox}>
          <Text style={styles.infoEmoji}>🛍️</Text>
          <Text style={styles.infoTitle}>Your Recent Staples</Text>
          <Text style={styles.infoSubtitle}>Quickly add your most-ordered items back to cart.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Ordered</Text>
          <View style={styles.grid}>
            {RECENT_ITEMS.map((item) => (
              <View key={item.id} style={styles.cardContainer}>
                 <ProductCard product={item} />
              </View>
            ))}
          </View>
        </View>

        {RECENT_ITEMS.length === 0 && (
          <View style={styles.emptyState}>
             <Text style={styles.emptyText}>No recent orders found.</Text>
          </View>
        )}
      </ScrollView>

      <BottomTabs activeTab="BuyAgain" />
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
  infoBox: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  infoSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});
