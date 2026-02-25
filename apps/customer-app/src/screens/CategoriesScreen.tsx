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
    layout: 'grid-4', // Small icons
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
    title: 'Household Essentials',
    layout: 'grid-4',
    items: [
      { id: '15', name: 'Home Needs', image: 'https://cdn-icons-png.flaticon.com/512/3163/3163195.png' },
      { id: '16', name: 'Cleaning Essentials', image: 'https://cdn-icons-png.flaticon.com/512/1940/1940922.png' },
      { id: '17', name: 'Pet Care', image: 'https://cdn-icons-png.flaticon.com/512/3163/3163155.png' },
      { id: '18', name: 'Stationery', image: 'https://cdn-icons-png.flaticon.com/512/3163/3163229.png' },
    ],
  },
  {
    title: 'Shop by Store',
    layout: 'store-grid', // 3D elevated look
    items: [
      { id: 'st1', name: 'Gift Store', image: 'https://cdn-icons-png.flaticon.com/512/1041/1041355.png' },
      { id: 'st2', name: 'Ayush Store', image: 'https://cdn-icons-png.flaticon.com/512/862/862839.png' },
      { id: 'st3', name: 'Vitamin Store', image: 'https://cdn-icons-png.flaticon.com/512/2954/2954848.png' },
      { id: 'st4', name: 'Pooja Store', image: 'https://cdn-icons-png.flaticon.com/512/2769/2769578.png' },
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
                      <Image source={{ uri: item.image }} style={styles.itemImg} resizeMode="contain" />
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
    width: '80%',
    height: '80%',
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
