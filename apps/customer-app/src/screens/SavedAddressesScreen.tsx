/**
 * SavedAddressesScreen.tsx
 * Spec §8.1 #23 — Manage saved delivery addresses.
 * GET /api/addresses  PATCH /api/addresses/:id  DELETE /api/addresses/:id
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  pincode: string;
  landmark?: string;
  is_default: boolean;
}

const LABEL_ICONS: Record<string, string> = {
  home: '🏠', work: '💼', other: '📍',
};

export const SavedAddressesScreen = () => {
  const navigation = useNavigation<any>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/addresses');
      setAddresses(Array.isArray(data) ? data : data.addresses ?? []);
    } catch (e) {
      console.error('[Addresses]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAddresses(); }, []));

  const setDefault = async (id: string) => {
    try {
      await api.patch(`/addresses/${id}`, { is_default: true });
      setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
    } catch {}
  };

  const deleteAddress = (id: string) => {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/addresses/${id}`);
            setAddresses(prev => prev.filter(a => a.id !== id));
          } catch {}
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: Address }) => (
    <View style={[styles.card, item.is_default && styles.cardDefault]}>
      <View style={styles.cardLeft}>
        <View style={styles.iconWrap}>
          <Text style={styles.addrIcon}>{LABEL_ICONS[item.label] ?? '📍'}</Text>
        </View>
        <View style={styles.addrInfo}>
          <View style={styles.labelRow}>
            <Text style={styles.addrLabel}>{item.label.charAt(0).toUpperCase() + item.label.slice(1)}</Text>
            {item.is_default && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Default</Text></View>}
          </View>
          <Text style={styles.addrLine} numberOfLines={2}>
            {item.line1}{item.line2 ? `, ${item.line2}` : ''}
          </Text>
          <Text style={styles.addrCity}>{item.city} — {item.pincode}</Text>
          {item.landmark && <Text style={styles.addrLandmark}>📌 {item.landmark}</Text>}
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('AddAddress', { address: item })}
        >
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        {!item.is_default && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => setDefault(item.id)}>
            <Text style={styles.actionBtnText}>Set Default</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => deleteAddress(item.id)}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddAddress')}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={a => a.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAddresses(); }} tintColor={theme.colors.primary} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No saved addresses</Text>
              <Text style={styles.emptySubtitle}>Add your home or work address for faster checkout</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddAddress')}>
                <Text style={styles.addBtnText}>Add New Address</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: theme.colors.text.primary },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },
  addText: { color: '#163D26', fontWeight: '700', fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: theme.colors.border,
  },
  cardDefault: { borderColor: '#163D26', borderWidth: 1.5 },
  cardLeft: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#163D2610',
    alignItems: 'center', justifyContent: 'center',
  },
  addrIcon: { fontSize: 20 },
  addrInfo: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  addrLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
  defaultBadge: {
    backgroundColor: '#163D26', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  defaultText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  addrLine: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 18 },
  addrCity: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },
  addrLandmark: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 12 },
  actionBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary },
  deleteText: { fontSize: 12, fontWeight: '600', color: '#DC3545', paddingVertical: 6 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 24 },
  addBtn: { backgroundColor: '#163D26', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
