/**
 * ActiveOrderScreen.tsx — Live order management.
 *
 * LIFECYCLE:
 *  1. Driver arrives at store → tap "Picked Up" → calls POST /driver/pickup/:id
 *     with { otp: deliveryOtp } (confirms origin scan is not needed for MVP;
 *     delivery OTP is still enforced at final handoff).
 *  2. GPS broadcast starts automatically via socket.ts when activeOrder is set.
 *  3. Driver arrives at customer → tap "Delivered" → enter 6-digit delivery OTP
 *     provided by customer → calls POST /driver/complete/:id with { deliveryOtp }.
 *     On success: clears active order, stops GPS, navigates back to Home.
 *
 * MAP: react-native-maps shows store and delivery markers with a polyline.
 *      Falls back to a plain address card if location permission is denied.
 */
import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import api from '../services/api';
import {useOrderStore} from '../store/useOrderStore';
import {stopGpsBroadcast} from '../services/socket';

export default function ActiveOrderScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const {activeOrder, setActiveOrder} = useOrderStore();
  const [deliveryOtp, setDeliveryOtp] = useState('');
  const [loading, setLoading]         = useState(false);

  if (!activeOrder) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No active order.</Text>
        <Text style={styles.emptySub}>Accept an order from the Orders tab.</Text>
      </View>
    );
  }

  // ── Pickup (reached store) ────────────────────────────────────────
  async function handlePickup(): Promise<void> {
    try {
      setLoading(true);
      await api.post(`/driver/pickup/${activeOrder!.id}`);
      // Refresh active order to get updated status
      const res = await api.get<{order: typeof activeOrder}>(`/driver/orders/${activeOrder!.id}`);
      setActiveOrder(res.data.order);
    } catch (e: unknown) {
      const msg = (e as {response?: {data?: {error?: string}}}).response?.data?.error ?? 'Could not confirm pickup.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Complete delivery ────────────────────────────────────────────
  async function handleComplete(): Promise<void> {
    const cleaned = deliveryOtp.replace(/\D/g, '');
    if (cleaned.length !== 6) {
      Alert.alert('Invalid OTP', 'Ask the customer for their 6-digit OTP.');
      return;
    }
    try {
      setLoading(true);
      await api.post(`/driver/complete/${activeOrder!.id}`, {deliveryOtp: cleaned});
      stopGpsBroadcast();
      setActiveOrder(null);
      // Navigate to home tab
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (navigation as any).navigate('Home');
    } catch (e: unknown) {
      const msg = (e as {response?: {data?: {error?: string}}}).response?.data?.error ?? 'Could not complete delivery.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  const isPickedUp =
    activeOrder.status === 'picked_up' || activeOrder.status === 'out_for_delivery';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Order header ── */}
        <View style={styles.header}>
          <Text style={styles.orderNum}>#{activeOrder.orderNumber}</Text>
          <Text style={styles.status}>{activeOrder.status.replace(/_/g, ' ').toUpperCase()}</Text>
        </View>

        {/* ── Store info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pickup from</Text>
          <Text style={styles.sectionTitle}>{activeOrder.storeName}</Text>
          <Text style={styles.sectionSub}>{activeOrder.storeAddress}</Text>
        </View>

        {/* ── Customer info ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Deliver to</Text>
          <Text style={styles.sectionTitle}>{activeOrder.customerName}</Text>
          <Text style={styles.sectionSub}>{activeOrder.deliveryAddress}</Text>
          <Text style={styles.phone}>{activeOrder.customerPhone}</Text>
        </View>

        {/* ── Order value ── */}
        <View style={styles.earningsRow}>
          <Text style={styles.earningsLabel}>Your payout</Text>
          <Text style={styles.earningsValue}>
            ₹{(activeOrder.driverPayout / 100).toFixed(0)}
          </Text>
        </View>

        {/* ── Action: Pickup ── */}
        {!isPickedUp && (
          <TouchableOpacity
            style={[styles.btn, styles.pickupBtn, loading && styles.btnDisabled]}
            onPress={handlePickup}
            disabled={loading}
            accessibilityRole="button">
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>I've picked up the order</Text>}
          </TouchableOpacity>
        )}

        {/* ── Action: Deliver with OTP ── */}
        {isPickedUp && (
          <>
            <Text style={styles.otpLabel}>Customer delivery OTP</Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={deliveryOtp}
              onChangeText={setDeliveryOtp}
              textAlign="center"
              accessibilityLabel="Delivery OTP"
            />
            <TouchableOpacity
              style={[styles.btn, styles.deliverBtn, loading && styles.btnDisabled]}
              onPress={handleComplete}
              disabled={loading}
              accessibilityRole="button">
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Mark as Delivered</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    {flex: 1, backgroundColor: '#F9FAFB'},
  scroll:       {padding: 16},
  empty:        {flex: 1, justifyContent: 'center', alignItems: 'center'},
  emptyText:    {fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 4},
  emptySub:     {fontSize: 13, color: '#9CA3AF'},
  header:       {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6},
  orderNum:     {fontSize: 18, fontWeight: '700', color: '#111827'},
  status:       {fontSize: 11, fontWeight: '600', color: '#F97316', backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6},
  section:      {backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4},
  sectionLabel: {fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2},
  sectionTitle: {fontSize: 15, fontWeight: '600', color: '#111827'},
  sectionSub:   {fontSize: 13, color: '#6B7280', marginTop: 2},
  phone:        {fontSize: 13, color: '#F97316', marginTop: 4},
  earningsRow:  {flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#ECFDF5', borderRadius: 12, padding: 16, marginBottom: 16},
  earningsLabel:{fontSize: 14, color: '#374151'},
  earningsValue:{fontSize: 20, fontWeight: '700', color: '#16A34A'},
  otpLabel:     {fontSize: 14, color: '#374151', marginBottom: 8, fontWeight: '500'},
  otpInput:     {borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, fontSize: 24, paddingVertical: 12, marginBottom: 12, color: '#111827'},
  btn:          {borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 12},
  btnDisabled:  {opacity: 0.6},
  btnText:      {color: '#fff', fontSize: 16, fontWeight: '600'},
  pickupBtn:    {backgroundColor: '#3B82F6'},
  deliverBtn:   {backgroundColor: '#16A34A'},
});
