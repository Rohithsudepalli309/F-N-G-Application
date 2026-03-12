import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Dimensions, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
// 4 cards per row, 12px padding each side, 8px gap × 3 between 4 cards
const CARD_W = (width - 24 - 24) / 4;

interface SubCat {
  label: string;
  image: string;    // HQ Unsplash image URL
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
        { label: 'Fresh\nVegetables',    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=80', cat: 'Fruits & Vegetables', subCat: 'Vegetables' },
        { label: 'Fresh\nFruits',        image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&q=80', cat: 'Fruits & Vegetables', subCat: 'Fruits'     },
        { label: 'Dairy, Bread\n& Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=200&q=80', cat: 'Dairy, Bread & Eggs' },
        { label: 'Meat &\nSeafood',      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&q=80', cat: 'Meat & Seafood' },
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
        { label: 'Atta, Rice\n& Dal',    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&q=80', cat: 'Atta, Rice, Oil & Dals' },
        { label: 'Masalas',              image: 'https://images.unsplash.com/photo-1506802913710-b2985dcd0c20?w=200&q=80', cat: 'Masala & Spices' },
        { label: 'Oils &\nGhee',         image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=200&q=80', cat: 'Atta, Rice, Oil & Dals', subCat: 'Oils & Ghee' },
        { label: 'Cereals &\nBreakfast', image: 'https://images.unsplash.com/photo-1533920379810-6bedac9c1d22?w=200&q=80', cat: 'Breakfast & Sauces',    subCat: 'Cereals & Muesli' },
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
        { label: 'Cold Drinks\n& Juices',     image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=200&q=80', cat: 'Beverages',             subCat: 'Cold Drinks'    },
        { label: 'Ice Creams\n& Frozen',       image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=200&q=80', cat: 'Frozen & Instant Food', subCat: 'Ice Creams'     },
        { label: 'Chips &\nNamkeens',          image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=200&q=80', cat: 'Munchies',               subCat: 'Chips & Crisps' },
        { label: 'Chocolates',                 image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=200&q=80', cat: 'Munchies',               subCat: 'Chocolates'     },
      ],
      [
        { label: 'Biscuits\n& Cakes',          image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80', cat: 'Munchies',            subCat: 'Biscuits & Cookies' },
        { label: 'Tea, Coffee\n& Milk Drinks', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=200&q=80', cat: 'Beverages',           subCat: 'Health Drinks'      },
        { label: 'Sauces &\nSpreads',          image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&q=80', cat: 'Breakfast & Sauces', subCat: 'Sauces & Spreads'   },
        { label: 'Sweet\nCorner',              image: 'https://images.unsplash.com/photo-1583395838144-2b890f63e34a?w=200&q=80', cat: 'Munchies',            subCat: 'Chocolates'         },
      ],
      [
        { label: 'Noodles,\nPasta',            image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200&q=80', cat: 'Frozen & Instant Food', subCat: 'Noodles & Pasta' },
        { label: 'Frozen\nFood',               image: 'https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=200&q=80', cat: 'Frozen & Instant Food', subCat: 'Frozen Snacks'   },
        { label: 'Dry Fruits\n& Seeds',        image: 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=200&q=80', cat: 'Atta, Rice, Oil & Dals', subCat: 'Dals & Pulses'  },
        { label: 'Energy\nDrinks',             image: 'https://images.unsplash.com/photo-1622540796758-a14fd81bdc23?w=200&q=80', cat: 'Beverages',               subCat: 'Energy Drinks'  },
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
        { label: 'Bath &\nBody',      image: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=200&q=80', cat: 'Personal Care', subCat: 'Bath & Body' },
        { label: 'Haircare',          image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80', cat: 'Personal Care', subCat: 'Hair Care'  },
        { label: 'Skincare',          image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&q=80', cat: 'Personal Care' },
        { label: 'Makeup',            image: 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?w=200&q=80', cat: 'Personal Care' },
      ],
      [
        { label: 'Feminine\nHygiene', image: 'https://images.unsplash.com/photo-1565402170291-8491f14678db?w=200&q=80', cat: 'Personal Care', subCat: 'Feminine Care' },
        { label: 'Sexual\nWellness',  image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200&q=80', cat: 'Personal Care' },
        { label: 'Health &\nPharma',  image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&q=80', cat: 'Personal Care' },
        { label: 'Babycare',          image: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=200&q=80', cat: 'Personal Care' },
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
        { label: 'Home &\nKitchen',        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=80', cat: 'Cleaning Essentials' },
        { label: 'Puja\nStore',            image: 'https://images.unsplash.com/photo-1605289982774-9a6fef564df8?w=200&q=80', cat: 'Cleaning Essentials' },
        { label: 'Cleaners &\nRepellents', image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200&q=80', cat: 'Cleaning Essentials' },
        { label: 'Toys &\nStationery',     image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=80', cat: '' },
      ],
      [
        { label: 'Electronics\n& Appliances', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=200&q=80', cat: '' },
        { label: 'Fashion',                   image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&q=80', cat: '' },
        { label: 'Pet\nSupplies',             image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&q=80', cat: '' },
        { label: 'Sports &\nFitness',         image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=80', cat: '' },
      ],
    ],
  },
];

const SubCatCard = ({ item, onPress }: { item: SubCat; onPress: () => void }) => (
  <TouchableOpacity style={card.wrap} onPress={onPress} activeOpacity={0.75}>
    <View style={card.imgWrap}>
      <Image source={{ uri: item.image }} style={card.img} resizeMode="cover" />
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
          <Text style={{ fontSize: 18 }}>🔍</Text>
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

