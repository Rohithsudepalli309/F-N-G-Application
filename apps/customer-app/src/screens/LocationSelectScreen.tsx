import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';

const MOCK_ADDRESSES = [
  { id: '1', name: 'Home', address: '123, Jubilee Hills, Hyderabad' },
  { id: '2', name: 'Office', address: 'Tech Park, Madhapur, Hyderabad' },
  { id: '3', name: 'Other', address: 'Street 5, Banjara Hills, Hyderabad' },
];

export const LocationSelectScreen = () => {
  const [search, setSearch] = useState('');
  const navigation = useNavigation();
  const updateUser = useAuthStore((state) => state.updateUser);

  const handleSelect = async (address: string) => {
    try {
      await api.put('/auth/profile', { address });
      updateUser({ address });
      navigation.goBack();
    } catch (e) {
      console.error('Failed to save address', e);
      // Still update local state for immediate UX
      updateUser({ address });
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Location</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Search for area, street name..."
            placeholderTextColor={theme.colors.text.secondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Current Location UI */}
      <TouchableOpacity 
        style={styles.currentLocation}
        onPress={() => handleSelect('Current Location (Hyderabad)')}
      >
        <Text style={styles.gpsIcon}>📍</Text>
        <View>
          <Text style={styles.currentText}>Use current location</Text>
          <Text style={styles.gpsSubtext}>Using GPS</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Saved Addresses */}
      <FlatList
        data={MOCK_ADDRESSES.filter(a => a.address.toLowerCase().includes(search.toLowerCase()))}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.addressItem}
            onPress={() => handleSelect(item.address)}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.itemIcon}>{item.name === 'Home' ? '🏠' : item.name === 'Office' ? '💼' : '📍'}</Text>
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressName}>{item.name}</Text>
              <Text style={styles.addressDetail} numberOfLines={1}>{item.address}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListHeaderComponent={<Text style={styles.sectionTitle}>SAVED ADDRESSES</Text>}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    padding: theme.spacing.s,
    marginRight: theme.spacing.s,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  title: {
    fontSize: theme.typography.size.l,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  searchContainer: {
    padding: theme.spacing.m,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    height: 50,
  },
  searchIcon: {
    marginRight: theme.spacing.s,
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.m,
    color: theme.colors.text.primary,
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.l,
  },
  gpsIcon: {
    fontSize: 24,
    marginRight: theme.spacing.m,
    color: theme.colors.primary,
  },
  currentText: {
    fontSize: theme.typography.size.m,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.primary,
  },
  gpsSubtext: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.regular,
  },
  divider: {
    height: 8,
    backgroundColor: theme.colors.surface,
  },
  list: {
    padding: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: theme.typography.size.xs,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.m,
    letterSpacing: 1,
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  itemIcon: {
    fontSize: 18,
  },
  addressInfo: {
    flex: 1,
  },
  addressName: {
    fontSize: theme.typography.size.m,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  addressDetail: {
    fontSize: theme.typography.size.xs,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: 2,
  },
});
