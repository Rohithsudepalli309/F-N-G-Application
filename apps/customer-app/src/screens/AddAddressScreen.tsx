/**
 * AddAddressScreen.tsx
 * Spec §8.1 #12 — Add/Edit delivery address form.
 * POST /api/addresses
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

const ADDRESS_TYPES = [
  { id: 'home',   label: 'Home',   icon: '🏠' },
  { id: 'work',   label: 'Work',   icon: '💼' },
  { id: 'other',  label: 'Other',  icon: '📍' },
];

export const AddAddressScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const editAddress = (route.params as any)?.address;

  const [label, setLabel] = useState<string>(editAddress?.label ?? 'home');
  const [line1, setLine1] = useState(editAddress?.line1 ?? '');
  const [line2, setLine2] = useState(editAddress?.line2 ?? '');
  const [city, setCity] = useState(editAddress?.city ?? '');
  const [pincode, setPincode] = useState(editAddress?.pincode ?? '');
  const [landmark, setLandmark] = useState(editAddress?.landmark ?? '');
  const [lat, setLat] = useState<number>(editAddress?.lat ?? 17.385044);
  const [lng, setLng] = useState<number>(editAddress?.lng ?? 78.486671);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!line1.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert('Required fields', 'Please fill in flat/house, city, and pincode.');
      return;
    }
    if (!/^\d{6}$/.test(pincode)) {
      Alert.alert('Invalid Pincode', 'Pincode must be 6 digits.');
      return;
    }
    setSaving(true);
    try {
      if (editAddress?.id) {
        await api.put(`/addresses/${editAddress.id}`, { label, line1, line2, city, pincode, landmark, lat, lng });
      } else {
        await api.post('/addresses', { label, line1, line2, city, pincode, landmark, lat, lng });
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Could not save address. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editAddress ? 'Edit Address' : 'Add New Address'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        {/* Address type selector */}
        <Text style={styles.sectionLabel}>Address Type</Text>
        <View style={styles.typeRow}>
          {ADDRESS_TYPES.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeChip, label === t.id && styles.typeChipActive]}
              onPress={() => setLabel(t.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.typeIcon}>{t.icon}</Text>
              <Text style={[styles.typeLabel, label === t.id && styles.typeLabelActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Map placeholder (tap to pick location) */}
        <TouchableOpacity style={styles.mapBox} activeOpacity={0.85}>
          <Text style={styles.mapIcon}>📍</Text>
          <View>
            <Text style={styles.mapTitle}>Use Current Location</Text>
            <Text style={styles.mapSubtitle}>Tap to auto-fill your address</Text>
          </View>
          <Text style={styles.mapArrow}>›</Text>
        </TouchableOpacity>

        {/* Form fields */}
        <Text style={styles.sectionLabel}>Address Details</Text>

        <View style={styles.fieldGroup}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Flat / House No. *</Text>
            <TextInput
              style={styles.input}
              value={line1}
              onChangeText={setLine1}
              placeholder="e.g. Flat 402, Shanthi Apartments"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Street / Area</Text>
            <TextInput
              style={styles.input}
              value={line2}
              onChangeText={setLine2}
              placeholder="e.g. Indiranagar, Bengaluru"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>

          <View style={styles.rowFields}>
            <View style={[styles.field, { flex: 1.5 }]}>
              <Text style={styles.fieldLabel}>City *</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Hyderabad"
                placeholderTextColor={theme.colors.text.secondary}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>Pincode *</Text>
              <TextInput
                style={styles.input}
                value={pincode}
                onChangeText={setPincode}
                placeholder="500001"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Landmark (Optional)</Text>
            <TextInput
              style={styles.input}
              value={landmark}
              onChangeText={setLandmark}
              placeholder="e.g. Near Apollo Hospital"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>{editAddress ? 'Save Changes' : 'Save Address'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { padding: 16, paddingBottom: 40 },

  sectionLabel: {
    fontSize: 13, fontWeight: '700', color: theme.colors.text.secondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginTop: 8,
  },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
  },
  typeChipActive: { borderColor: '#163D26', backgroundColor: '#163D2610' },
  typeIcon: { fontSize: 18 },
  typeLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary },
  typeLabelActive: { color: '#163D26', fontWeight: '700' },

  mapBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    backgroundColor: '#F0FDF4', borderRadius: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#86EFAC',
  },
  mapIcon: { fontSize: 24 },
  mapTitle: { fontSize: 14, fontWeight: '700', color: '#163D26' },
  mapSubtitle: { fontSize: 12, color: '#4ADE80', marginTop: 2 },
  mapArrow: { marginLeft: 'auto', fontSize: 20, color: '#163D26' },

  fieldGroup: { gap: 4, marginBottom: 20 },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.text.secondary, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 15, color: theme.colors.text.primary, backgroundColor: theme.colors.surface,
  },
  rowFields: { flexDirection: 'row', gap: 12 },

  saveBtn: {
    backgroundColor: '#163D26', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
