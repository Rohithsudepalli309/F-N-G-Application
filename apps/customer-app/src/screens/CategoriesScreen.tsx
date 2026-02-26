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

const SECTIONS = [
  {
    title: 'Grocery & Kitchen',
    layout: 'grid-2', // Large cards
    items: [
      { id: '1', name: 'Fruits & Vegetables', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=300' },
      { id: '2', name: 'Dairy, Bread & Eggs', image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=300' },
      { id: '3', name: 'Atta, Rice, Oil & Dals', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300' },
      { id: '6', name: 'Breakfast & Sauces', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&q=80&w=300' },
      { id: '7', name: 'Packaged Food', image: 'https://images.unsplash.com/photo-1612170153139-6f881ff067e0?auto=format&fit=crop&q=80&w=300' },
      { id: '4', name: 'Meat, Fish & Eggs', image: 'https://images.unsplash.com/photo-1607623273573-74c43fb38883?auto=format&fit=crop&q=80&w=300' },
    ],
  },
  {
    title: 'Snacks & Drinks',
    layout: 'grid-4', // Small photos
    items: [
      { id: '8', name: 'Tea, Coffee & More', image: 'https://images.unsplash.com/photo-1544787219-7f47ccacb2e2?auto=format&fit=crop&q=80&w=300' },
      { id: '9', name: 'Ice Creams & More', image: 'https://images.unsplash.com/photo-1559703248-dcaaec9fab78?auto=format&fit=crop&q=80&w=300' },
      { id: '10', name: 'Frozen Food', image: 'https://images.unsplash.com/photo-1549488344-c1fbdbcfbe0d?auto=format&fit=crop&q=80&w=300' },
      { id: '11', name: 'Sweet Cravings', image: 'https://images.unsplash.com/photo-1581486518428-f682531cd9a2?auto=format&fit=crop&q=80&w=300' },
      { id: '12', name: 'Cold Drinks', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300' },
      { id: '13', name: 'Munchies', image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&q=80&w=300' },
      { id: '14', name: 'Biscuits', image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&q=80&w=300' },
    ],
  },
  {
    title: 'Household Essentials',
    layout: 'grid-4',
    items: [
      { id: '15', name: 'Home Needs', image: 'https://images.unsplash.com/photo-1583907659441-2aef2a1e360f?auto=format&fit=crop&q=80&w=300' },
      { id: '16', name: 'Cleaning', image: 'https://images.unsplash.com/photo-1584820927498-cafe2c1c7669?auto=format&fit=crop&q=80&w=300' },
      { id: '17', name: 'Pet Care', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=300' },
      { id: '18', name: 'Stationery', image: 'https://images.unsplash.com/photo-1503694978374-8a2fa686963a?auto=format&fit=crop&q=80&w=300' },
    ],
  },
  {
    title: 'Shop by Store',
    layout: 'store-grid', // Elevated photos
    items: [
      { id: 'st1', name: 'Gift Store', image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=300' },
      { id: 'st2', name: 'Ayush Store', image: 'https://images.unsplash.com/photo-1611078566367-ad82fe9e3fa6?auto=format&fit=crop&q=80&w=300' },
      { id: 'st3', name: 'Vitamin Store', image: 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&q=80&w=300' },
      { id: 'st4', name: 'Pooja Store', image: 'https://images.unsplash.com/photo-1605335150373-1bb3fa23bfe4?auto=format&fit=crop&q=80&w=300' },
    ],
  },
];

export const CategoriesScreen = () => {
  const navigation = useNavigation();
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* --- 1. Header (High-Fidelity Style) ------------------------------------─ */}
      <View style={styles.newHeader}>
        <View style={styles.headerTop}>
          <Text style={styles.headerText}>All Categories</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconBtn}>
               <Text style={styles.headerIconEmoji}>🤍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn}>
               <Text style={styles.headerIconEmoji}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- 2. Horizontal Sub-Header ------------------------------------------─ */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.subHeader}
          contentContainerStyle={styles.subHeaderContent}
        >
          {['Care', 'Sports', 'Books', 'Corner', 'Kitchen', 'Beauty', 'Fresh'].map((tag, i) => (
            <TouchableOpacity key={tag} style={[styles.subTag, i === 0 && styles.subTagActive]}>
              <Text style={[styles.subTagText, i === 0 && styles.subTagTextActive]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainContent}>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>{section.title}</Text>
            
            <View style={styles.sectionGrid}>
              {section.items.map((item) => {
                const isTwoCol = section.layout === 'grid-2';
                const isStore = section.layout === 'store-grid';

                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[
                      styles.itemCard, 
                      isTwoCol && styles.itemCardWide,
                      isStore && styles.storeCard
                    ]}
                    onPress={() => (navigation as any).navigate('ProductList', { categoryName: item.name })}
                  >
                    <View style={[
                      styles.imgWrapper, 
                      isTwoCol && styles.imgWrapperWide,
                      isStore && styles.storeImgWrapper
                    ]}>
                      <Image source={{ uri: item.image }} style={styles.itemImg} resizeMode="cover" />
                    </View>
                    <Text style={[styles.itemName, isTwoCol && styles.itemNameWide]} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>

      <BottomTabs activeTab="Categories" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  newHeader: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerText: {
    fontSize: 20,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  headerIconBtn: {
    marginLeft: 16,
  },
  headerIconEmoji: {
    fontSize: 22,
  },
  subHeader: {
    backgroundColor: '#FFF',
    paddingVertical: 10,
  },
  subHeaderContent: {
    paddingHorizontal: 14,
  },
  subTag: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  subTagActive: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  subTagText: {
    fontSize: 13,
    color: '#616161',
    fontWeight: 'bold',
  },
  subTagTextActive: {
    color: '#2E7D32',
  },
  mainContent: {
    paddingHorizontal: 14,
    paddingTop: 16,
    backgroundColor: '#F8FAF5',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
    marginBottom: 12,
  },
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  itemCard: {
    width: '25%',
    paddingHorizontal: 6,
    alignItems: 'center',
    marginBottom: 20,
  },
  itemCardWide: {
    width: '50%',
  },
  storeCard: {
    width: '25%',
  },
  imgWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imgWrapperWide: {
    borderRadius: 16,
    padding: 10,
  },
  storeImgWrapper: {
    backgroundColor: '#FFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  itemImg: {
    width: '82%',
    height: '82%',
    borderRadius: 8,
  },
  itemName: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#424242',
    textAlign: 'center',
    lineHeight: 13,
  },
  itemNameWide: {
    fontSize: 13,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
    marginTop: 4,
  },
});
