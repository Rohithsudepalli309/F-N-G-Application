/**
 * ProfileScreen.tsx — Driver profile + logout.
 * Shows driver info fetched from the auth store (no extra API call needed).
 */
import React, {useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuthStore} from '../store/useAuthStore';
import {disconnectSocket} from '../services/socket';
import type {RootStackParamList} from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const VEHICLE_LABELS: Record<string, string> = {
  bike:    '🏍️ Bike',
  bicycle: '🚲 Bicycle',
  car:     '🚗 Car',
};

export default function ProfileScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const {driver, logout}  = useAuthStore();
  const [loading, setLoading] = useState(false);

  function handleLogout(): void {
    Alert.alert(
      'Log Out',
      'You will stop receiving orders. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            setLoading(true);
            disconnectSocket();
            logout();
            navigation.reset({index: 0, routes: [{name: 'Auth'}]});
          },
        },
      ],
    );
  }

  if (!driver) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#F97316" />
      </View>
    );
  }

  const initials = driver.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* ── Avatar ── */}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.name}>{driver.name}</Text>
          <Text style={styles.phone}>{driver.phone}</Text>
        </View>
      </View>

      {/* ── Details ── */}
      <View style={styles.section}>
        <Row label="Vehicle" value={VEHICLE_LABELS[driver.vehicleType] ?? driver.vehicleType} />
        <Row label="Status"  value={driver.isOnline ? '🟢 Online' : '🔴 Offline'} />
        <Row label="Driver ID" value={`#${driver.id}`} />
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, loading && styles.btnDisabled]}
        onPress={handleLogout}
        disabled={loading}
        accessibilityRole="button">
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({label, value}: {label: string; value: string}): React.JSX.Element {
  return (
    <View style={rowStyles.container}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  container: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6'},
  label:     {fontSize: 14, color: '#6B7280'},
  value:     {fontSize: 14, fontWeight: '500', color: '#111827'},
});

const styles = StyleSheet.create({
  container:  {flex: 1, backgroundColor: '#F9FAFB'},
  content:    {padding: 16},
  center:     {flex: 1, justifyContent: 'center', alignItems: 'center'},
  avatarRow:  {flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8},
  avatar:     {width: 56, height: 56, borderRadius: 28, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center', marginRight: 12},
  initials:   {fontSize: 22, fontWeight: '700', color: '#fff'},
  nameBlock:  {flex: 1},
  name:       {fontSize: 18, fontWeight: '700', color: '#111827'},
  phone:      {fontSize: 13, color: '#6B7280', marginTop: 2},
  section:    {backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4},
  logoutBtn:  {backgroundColor: '#FEE2E2', borderRadius: 10, paddingVertical: 14, alignItems: 'center'},
  btnDisabled:{opacity: 0.6},
  logoutText: {color: '#DC2626', fontSize: 16, fontWeight: '600'},
});
