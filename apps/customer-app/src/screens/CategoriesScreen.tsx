import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { BottomTabs } from '../components/BottomTabs';

interface CategoryItem {
  id: string;
  name: string;
  image: string;
}

interface Section {
  title: string;
  items: CategoryItem[];
}

const SECTIONS: Section[] = [
  {
    title: 'Grocery & Kitchen',
    items: [
      { id: '1', name: 'Fruits & Vegetables', image: 'https://cdn-icons-png.flaticon.com/512/2329/2329865.png' },
      { id: '2', name: 'Dairy, Bread & Eggs', image: 'https://cdn-icons-png.flaticon.com/512/3050/3050161.png' },
      { id: '3', name: 'Atta, Rice, Oil & Dals', image: 'https://cdn-icons-png.flaticon.com/512/2621/2621814.png' },
      { id: '4', name: 'Meat, Fish & Eggs', image: 'https://cdn-icons-png.flaticon.com/512/1046/1046769.png' },
      { id: '5', name: 'Masala & Dry Fruits', image: 'https://cdn-icons-png.flaticon.com/512/2403/2403334.png' },
      { id: '6', name: 'Breakfast & Sauces', image: 'https://cdn-icons-png.flaticon.com/512/2821/2821811.png' },
      { id: '7', name: 'Packaged Food', image: 'https://cdn-icons-png.flaticon.com/512/2769/2769578.png' },
    ],
  },
  {
    title: 'Snacks & Drinks',
    items: [
      { id: '8', name: 'Tea, Coffee & More', image: 'https://cdn-icons-png.flaticon.com/512/3504/3504787.png' },
      { id: '9', name: 'Ice Creams & More', image: 'https://cdn-icons-png.flaticon.com/512/938/938063.png' },
      { id: '10', name: 'Frozen Food', image: 'https://cdn-icons-png.flaticon.com/512/2954/2954848.png' },
      { id: '11', name: 'Sweet Cravings', image: 'https://cdn-icons-png.flaticon.com/512/3419/3419213.png' },
      { id: '12', name: 'Cold Drinks & Juices', image: 'https://cdn-icons-png.flaticon.com/512/3075/3075908.png' },
      { id: '13', name: 'Munchies', image: 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png' },
      { id: '14', name: 'Biscuits & Cookies', image: 'https://cdn-icons-png.flaticon.com/512/541/541732.png' },
    ],
  },
  {
    title: 'Beauty & Personal Care',
    items: [
      { id: '15', name: 'Skincare', image: 'https://cdn-icons-png.flaticon.com/512/3163/3163195.png' },
      { id: '16', name: 'Makeup & Beauty', image: 'https://cdn-icons-png.flaticon.com/512/1940/1940922.png' },
      { id: '17', name: 'Bath & Body', image: 'https://cdn-icons-png.flaticon.com/512/3163/3163155.png' },
      { id: '18', name: 'Haircare', image: 'https://cdn-icons-png.flaticon.com/512/3163/3163229.png' },
    ],
  },
];

export const CategoriesScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Categories</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.icon}>🤍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.icon}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.grid}>
              {section.items.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.gridItem}
                  onPress={() => (navigation as any).navigate('ProductList', { categoryName: item.name })}
                >
                  <View style={styles.iconContainer}>
                    <Image source={{ uri: item.image }} style={styles.categoryImg} />
                  </View>
                  <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabs activeTab="Categories" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconBtn: {
    marginLeft: 20,
  },
  icon: {
    fontSize: 22,
  },
  content: {
    padding: theme.spacing.l,
  },
  section: {
    marginBottom: 32,
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
  gridItem: {
    width: '25%',
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryImg: {
    width: 45,
    height: 45,
  },
  categoryName: {
    fontSize: 11,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#333',
    textAlign: 'center',
    lineHeight: 14,
  },
});
