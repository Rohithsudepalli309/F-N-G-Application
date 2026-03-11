import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
// 4 cards per row, 12px padding each side, 8px gap × 3 between 4 cards
const CARD_W = (width - 24 - 24) / 4;

interface SubCat {
  label: string;
  emoji: string;
  cat: string; // DB category to navigate to
}

interface Section {
  id: string;
  title: string;
  emoji: string;
  bg: string;
  headerColor: string;
  rows: SubCat[][];
}

const SECTIONS: Section[] = [
  {
    id: 's1',
    title: 'Fresh Items',
    emoji: '🌿',
    bg: '#E8F5E9',
    headerColor: '#2E7D32',
    rows: [
      [
        { label: 'Fresh\nVegetables',    emoji: '🥦', cat: 'Fruits & Vegetables' },
        { label: 'Fresh\nFruits',        emoji: '🍎', cat: 'Fruits & Vegetables' },
        { label: 'Dairy, Bread\n& Eggs', emoji: '🥛', cat: 'Dairy, Bread & Eggs' },
        { label: 'Meat &\nSeafood',      emoji: '🥩', cat: 'Meat & Seafood' },
      ],
    ],
  },
  {
    id: 's2',
    title: 'Grocery & Kitchen',
    emoji: '🫙',
    bg: '#FFF8E1',
    headerColor: '#E65100',
    rows: [
      [
        { label: 'Atta, Rice\n& Dal',    emoji: '🌾', cat: 'Atta, Rice, Oil & Dals' },
        { label: 'Masalas',              emoji: '🌶️',  cat: 'Masala & Spices' },
        { label: 'Oils &\nGhee',         emoji: '🫙',  cat: 'Atta, Rice, Oil & Dals' },
        { label: 'Cereals &\nBreakfast', emoji: '🥣',  cat: 'Breakfast & Sauces' },
      ],
    ],
  },
  {
    id: 's3',
    title: 'Snacks & Drinks',
    emoji: '🍟',
    bg: '#FCE4EC',
    headerColor: '#C62828',
    rows: [
      [
        { label: 'Cold Drinks\n& Juices',         emoji: '🥤', cat: 'Beverages' },
        { label: 'Ice Creams\n& Frozen',           emoji: '🍦', cat: 'Frozen & Instant Food' },
        { label: 'Chips &\nNamkeens',              emoji: '🍟', cat: 'Munchies' },
        { label: 'Chocolates',                     emoji: '🍫', cat: 'Munchies' },
      ],
      [
        { label: 'Biscuits\n& Cakes',              emoji: '🍪', cat: 'Munchies' },
        { label: 'Tea, Coffee\n& Milk Drinks',     emoji: '☕', cat: 'Beverages' },
        { label: 'Sauces &\nSpreads',              emoji: '🍅', cat: 'Breakfast & Sauces' },
        { label: 'Sweet\nCorner',                  emoji: '🍬', cat: 'Munchies' },
      ],
      [
        { label: 'Noodles,\nPasta',                emoji: '🍝', cat: 'Frozen & Instant Food' },
        { label: 'Frozen\nFood',                   emoji: '🧊', cat: 'Frozen & Instant Food' },
        { label: 'Dry Fruits\n& Seeds',            emoji: '🥜', cat: 'Atta, Rice, Oil & Dals' },
        { label: 'Energy\nDrinks',                 emoji: '⚡', cat: 'Beverages' },
      ],
    ],
  },
  {
    id: 's4',
    title: 'Beauty & Wellness',
    emoji: '✨',
    bg: '#F3E5F5',
    headerColor: '#6A1B9A',
    rows: [
      [
        { label: 'Bath &\nBody',          emoji: '🧴', cat: 'Personal Care' },
        { label: 'Haircare',              emoji: '💇', cat: 'Personal Care' },
        { label: 'Skincare',              emoji: '✨', cat: 'Personal Care' },
        { label: 'Makeup',                emoji: '💄', cat: 'Personal Care' },
      ],
      [
        { label: 'Feminine\nHygiene',     emoji: '🌸', cat: 'Personal Care' },
        { label: 'Sexual\nWellness',      emoji: '💊', cat: 'Personal Care' },
        { label: 'Health &\nPharma',      emoji: '🏥', cat: 'Personal Care' },
        { label: 'Babycare',              emoji: '🍼', cat: 'Personal Care' },
      ],
    ],
  },
  {
    id: 's5',
    title: 'Household & Lifestyle',
    emoji: '🏠',
    bg: '#E3F2FD',
    headerColor: '#1565C0',
    rows: [
      [
        { label: 'Home &\nKitchen',           emoji: '🏠', cat: 'Cleaning Essentials' },
        { label: 'Puja\nStore',               emoji: '🪔', cat: 'Cleaning Essentials' },
        { label: 'Cleaners &\nRepellents',    emoji: '🧹', cat: 'Cleaning Essentials' },
        { label: 'Toys &\nStationery',        emoji: '✏️', cat: '' },
      ],
      [
        { label: 'Electronics\n& Appliances', emoji: '📱', cat: '' },
        { label: 'Fashion',                   emoji: '👗', cat: '' },
        { label: 'Pet\nSupplies',             emoji: '🐾', cat: '' },
        { label: 'Sports &\nFitness',         emoji: '🏋️', cat: '' },
      ],
    ],
  },
];

const SubCatCard = ({ item, onPress }: { item: SubCat; onPress: () => void }) => (
  <TouchableOpacity style={card.wrap} onPress={onPress} activeOpacity={0.75}>
    <View style={card.circle}>
      <Text style={card.emoji}>{item.emoji}</Text>
    </View>
    <Text style={card.label} numberOfLines={2}>{item.label}</Text>
  </TouchableOpacity>
);

const card = StyleSheet.create({
  wrap:   { width: CARD_W, alignItems: 'center', marginBottom: 16 },
  circle: {
    width: CARD_W - 12,
    height: CARD_W - 12,
    borderRadius: (CARD_W - 12) / 2,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  emoji:  { fontSize: 26 },
  label:  { fontSize: 10, fontWeight: '600', color: '#333', textAlign: 'center', lineHeight: 13 },
});

export const CategoriesScreen = () => {
  const navigation = useNavigation<any>();

  const handleSubCat = (cat: string, label: string) => {
    if (!cat) return; // no matching DB category yet
    navigation.navigate('ProductList', { categoryName: cat });
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
              <Text style={s.sectionEmoji}>{section.emoji}</Text>
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
                      onPress={() => handleSubCat(item.cat, item.label)}
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
  sectionEmoji:  { fontSize: 18, marginRight: 8 },
  sectionTitle:  { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  rowsWrap:      { paddingHorizontal: 12 },
  row:           {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});

