/**
 * PaymentMethodsScreen.tsx
 * Spec §8.1 #24 — View and manage saved UPI IDs and cards.
 * GET /api/payment-methods
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, FlatList,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'wallet';
  identifier: string;  // UPI ID or masked card number
  provider?: string;   // GPay, PhonePe, Visa, etc.
  is_default: boolean;
}

const METHOD_ICONS: Record<string, string> = {
  upi: '📲', card: '💳', wallet: '👛',
  gpay: '🟦', phonepe: '🟣', paytm: '🔵',
  visa: '💳', mastercard: '💳',
};

const PROVIDER_COLORS: Record<string, string> = {
  gpay: '#4285F4', phonepe: '#5F259F', paytm: '#00BAF2',
  visa: '#1A1F71', mastercard: '#EB001B', default: '#163D26',
};

export const PaymentMethodsScreen = () => {
  const navigation = useNavigation<any>();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/payment-methods');
        setMethods(Array.isArray(data) ? data : data.methods ?? []);
      } catch {
        // Silently fallback — show empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const removeMethod = (id: string) => {
    Alert.alert('Remove Payment Method', 'Remove this from your saved methods?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/payment-methods/${id}`);
            setMethods(p => p.filter(m => m.id !== id));
          } catch {}
        }
      },
    ]);
  };

  const renderMethod = ({ item }: { item: PaymentMethod }) => {
    const providerKey = item.provider?.toLowerCase() ?? 'default';
    const color = PROVIDER_COLORS[providerKey] ?? PROVIDER_COLORS.default;
    return (
      <View style={[styles.card, item.is_default && styles.cardDefault]}>
        <View style={[styles.methodIconWrap, { backgroundColor: color + '18' }]}>
          <Text style={styles.methodIcon}>
            {METHOD_ICONS[providerKey] ?? METHOD_ICONS[item.type]}
          </Text>
        </View>
        <View style={styles.methodInfo}>
          <Text style={styles.methodProvider}>{item.provider ?? item.type.toUpperCase()}</Text>
          <Text style={styles.methodIdentifier}>{item.identifier}</Text>
          {item.is_default && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => removeMethod(item.id)} style={styles.removeBtn}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={methods}
          keyExtractor={m => m.id}
          renderItem={renderMethod}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.secureNote}>
              <Text style={styles.secureIcon}>🔒</Text>
              <Text style={styles.secureText}>Your payment data is encrypted and secured by Razorpay</Text>
            </View>
          }
          ListFooterComponent={
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>+ Add New Payment Method</Text>
            </TouchableOpacity>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No saved payment methods</Text>
              <Text style={styles.emptySubtitle}>
                Save UPI IDs and cards for faster checkout
              </Text>
            </View>
          }
        />
      )}

      {/* UPI options */}
      <View style={styles.upiSection}>
        <Text style={styles.upiTitle}>Supported UPI Apps</Text>
        <View style={styles.upiRow}>
          {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
            <View key={app} style={styles.upiChip}>
              <Text style={styles.upiChipText}>{app}</Text>
            </View>
          ))}
        </View>
      </View>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 20 },

  secureNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, marginBottom: 16,
  },
  secureIcon: { fontSize: 18 },
  secureText: { flex: 1, fontSize: 12, color: '#163D26', fontWeight: '500' },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  cardDefault: { borderColor: '#163D26' },
  methodIconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  methodIcon: { fontSize: 22 },
  methodInfo: { flex: 1 },
  methodProvider: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
  methodIdentifier: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },
  defaultBadge: {
    alignSelf: 'flex-start', backgroundColor: '#163D26',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4,
  },
  defaultText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  removeBtn: { padding: 6 },
  removeText: { color: '#DC3545', fontSize: 12, fontWeight: '600' },

  addBtn: {
    borderWidth: 2, borderColor: '#163D26', borderStyle: 'dashed',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  addBtnText: { color: '#163D26', fontWeight: '700', fontSize: 15 },

  empty: { alignItems: 'center', paddingTop: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: theme.colors.text.secondary, textAlign: 'center' },

  upiSection: {
    padding: 16, borderTopWidth: 1, borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  upiTitle: { fontSize: 12, color: theme.colors.text.secondary, fontWeight: '600', marginBottom: 10 },
  upiRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  upiChip: {
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border,
  },
  upiChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.text.secondary },
});
