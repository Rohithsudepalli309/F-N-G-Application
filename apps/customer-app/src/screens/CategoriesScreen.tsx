import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Dimensions, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { IMAGES } from '../assets/hq';

const { width } = Dimensions.get('window');
// 4 cards per row, 12px padding each side, 8px gap × 3 between 4 cards
const CARD_W = (width - 24 - 24) / 4;

interface SubCat {
  label: string;
  image: any;       // HQ local asset handle
  cat: string;      // DB category to navigate to
  subCat?: string;  // optional DB sub_category for finer filtering
}

interface Section {
  id: string;
  title: string;
  bg: string;
  headerColor: string;
  rows: SubCat[][];
}

const SECTIONS: Section[] = [
  {
    id: 's1',
    title: 'Fresh Items',
    bg: '#E8F5E9',
    headerColor: '#2E7D32',
    rows: [
      [
        { label: 'Fresh\nVegetables',    image: IMAGES.fruits, cat: 'Fruits & Vegetables', subCat: 'Vegetables' },
        { label: 'Fresh\nFruits',        image: IMAGES.fruits, cat: 'Fruits & Vegetables', subCat: 'Fruits'     },
        { label: 'Dairy, Bread\n& Eggs', image: IMAGES.dairy, cat: 'Dairy, Bread & Eggs' },
        { label: 'Meat &\nSeafood',      image: IMAGES.snacks, cat: 'Meat & Seafood' },
      ],
    ],
  },
  {
    id: 's2',
    title: 'Grocery & Kitchen',
    bg: '#FFF8E1',
    headerColor: '#E65100',
    rows: [
      [
        { label: 'Atta, Rice\n& Dal',    image: IMAGES.atta_rice, cat: 'Atta, Rice, Oil & Dals' },
        { label: 'Masalas',              image: IMAGES.masala, cat: 'Masala & Spices' },
        { label: 'Oils &\nGhee',         image: IMAGES.atta_rice, cat: 'Atta, Rice, Oil & Dals', subCat: 'Oils & Ghee' },
        { label: 'Cereals &\nBreakfast', image: IMAGES.breakfast, cat: 'Breakfast & Sauces',    subCat: 'Cereals & Muesli' },
      ],
    ],
  },
  {
    id: 's3',
    title: 'Snacks & Drinks',
    bg: '#FCE4EC',
    headerColor: '#C62828',
    rows: [
      [
        { label: 'Cold Drinks\n& Juices',     image: IMAGES.beverages, cat: 'Beverages',             subCat: 'Cold Drinks'    },
        { label: 'Ice Creams\n& Frozen Dessert', image: IMAGES.snacks, cat: 'Frozen & Instant Food', subCat: 'Ice Creams'     },
        { label: 'Chips &\nNamkeens',          image: IMAGES.snacks, cat: 'Munchies',               subCat: 'Chips & Crisps' },
        { label: 'Chocolates',                 image: IMAGES.snacks, cat: 'Munchies',               subCat: 'Chocolates'     },
      ],
      [
        { label: 'Biscuits\n& Cakes',          image: IMAGES.snacks, cat: 'Munchies',            subCat: 'Biscuits & Cookies' },
        { label: 'Tea, Coffees\n& Milk Drinks', image: IMAGES.beverages, cat: 'Beverages',           subCat: 'Health Drinks'      },
        { label: 'Sauces &\nSpreads',          image: IMAGES.breakfast, cat: 'Breakfast & Sauces', subCat: 'Sauces & Spreads'   },
        { label: 'Sweet\nCorner',              image: IMAGES.snacks, cat: 'Munchies',            subCat: 'Chocolates'         },
      ],
      [
        { label: 'Noodles, Pasta,\nVermicelli', image: IMAGES.snacks, cat: 'Frozen & Instant Food', subCat: 'Noodles & Pasta' },
        { label: 'Frozen\nFood',               image: IMAGES.snacks, cat: 'Frozen & Instant Food', subCat: 'Frozen Snacks'   },
        { label: 'Dry Fruits\n& Seeds',        image: IMAGES.atta_rice, cat: 'Atta, Rice, Oil & Dals', subCat: 'Dals & Pulses'  },
        { label: 'Cold\nDrinks',               image: IMAGES.beverages, cat: 'Beverages',               subCat: 'Cold Drinks'    },
      ],
    ],
  },
  {
    id: 's4',
    title: 'Beauty & Wellness',
    bg: '#F3E5F5',
    headerColor: '#6A1B9A',
    rows: [
      [
        { label: 'Bath &\nBody',      image: IMAGES.personal_care, cat: 'Personal Care', subCat: 'Bath & Body' },
        { label: 'Haircare',          image: IMAGES.personal_care, cat: 'Personal Care', subCat: 'Hair Care'  },
        { label: 'Skincare',          image: IMAGES.personal_care, cat: 'Personal Care' },
        { label: 'Makeup',            image: IMAGES.personal_care, cat: 'Personal Care' },
      ],
      [
        { label: 'Feminine\nHygiene', image: IMAGES.personal_care, cat: 'Personal Care', subCat: 'Feminine Care' },
        { label: 'Sexual\nWellness',  image: IMAGES.personal_care, cat: 'Personal Care' },
        { label: 'Health &\nPharma',  image: IMAGES.personal_care, cat: 'Personal Care' },
        { label: 'Babycare',          image: IMAGES.personal_care, cat: 'Personal Care' },
      ],
    ],
  },
  {
    id: 's5',
    title: 'Household & Lifestyle',
    bg: '#E3F2FD',
    headerColor: '#1565C0',
    rows: [
      [
        { label: 'Home &\nKitchen',        image: IMAGES.cleaning, cat: 'Cleaning Essentials' },
        { label: 'Puja\nStore',            image: IMAGES.masala, cat: 'Cleaning Essentials' },
        { label: 'Cleaners &\nRepellents', image: IMAGES.cleaning, cat: 'Cleaning Essentials' },
        { label: 'Toys &\nStationary',     image: IMAGES.snacks, cat: '' },
      ],
      [
        { label: 'Electronics\n& Appliances', image: IMAGES.icon_box, cat: '' },
        { label: 'Fashion',                   image: IMAGES.personal_care, cat: '' },
        { label: 'Pet\nSupplies',             image: IMAGES.snacks, cat: '' },
        { label: 'Sports &\nFitness',         image: IMAGES.personal_care, cat: '' },
      ],
    ],
  },
];

const SubCatCard = ({ item, onPress }: { item: SubCat; onPress: () => void }) => (
  <TouchableOpacity style={card.wrap} onPress={onPress} activeOpacity={0.75}>
    <View style={card.imgWrap}>
      <Image source={item.image} style={card.img} resizeMode="cover" />
    </View>
    <Text style={card.label} numberOfLines={2}>{item.label}</Text>
  </TouchableOpacity>
);

const card = StyleSheet.create({
  wrap:    { width: CARD_W, alignItems: 'center', marginBottom: 16 },
  imgWrap: {
    width: CARD_W - 8,
    height: CARD_W - 8,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  img:   { width: '100%', height: '100%' },
  label: { fontSize: 10, fontWeight: '700', color: '#222', textAlign: 'center', lineHeight: 14 },
});

export const CategoriesScreen = () => {
  const navigation = useNavigation<any>();

  const handleSubCat = (cat: string, label: string, subCat?: string) => {
    if (!cat) return; // no matching DB category yet
    navigation.navigate('ProductList', {
      categoryName: cat,
      ...(subCat ? { subCategory: subCat } : {}),
    });
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>All Categories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SearchMain')} style={s.searchBtn}>
          <Image source={IMAGES.icon_search} style={{ width: 22, height: 22 }} resizeMode="contain" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {SECTIONS.map((section) => (
          <View key={section.id} style={s.section}>
            {/* Section header bar */}
            <View style={[s.sectionHeader, { backgroundColor: section.bg }]}>
              <Text style={[s.sectionTitle, { color: section.headerColor }]}>
                {section.title}
              </Text>
            </View>

            {/* Rows of 4 sub-category cards */}
            <View style={s.rowsWrap}>
              {section.rows.map((row, ri) => (
                <View key={ri} style={s.row}>
                  {row.map((item, ci) => (
                    <SubCatCard
                      key={`${section.id}-${ri}-${ci}`}
                      item={item}
                      onPress={() => handleSubCat(item.cat, item.label, item.subCat)}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#FAFAFA' },
  header:        {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerTitle:   { fontSize: 20, fontWeight: '800', color: '#0D1B14', letterSpacing: -0.4 },
  searchBtn:     { padding: 4 },
  scroll:        { paddingBottom: 16 },
  section:       { marginBottom: 8, backgroundColor: '#FFF', marginHorizontal: 0 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    marginBottom: 4,
  },
  sectionTitle:  { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  rowsWrap:      { paddingHorizontal: 12 },
  row:           {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});

