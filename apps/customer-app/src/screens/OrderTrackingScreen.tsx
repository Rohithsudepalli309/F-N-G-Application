/**
 * OrderTrackingScreen.tsx  (full real-time version — Step 6)
 *
 * Rules enforced:
 *  - Customer reads socket events ONLY.
 *  - Falls back to REST polling if socket drops.
 *  - Google Maps shows live driver marker + static destination.
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';
import { useOrderSocket, LocationPayload, StatusPayload, OrderStatus } from '../hooks/useOrderSocket';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending:   '⏳ Awaiting payment',
  placed:    '✅ Order confirmed',
  preparing: '🍳 Preparing your order',
  ready:     '📦 Ready for pickup',
  pickup:    '🛵 Driver picked up',
  delivered: '🎉 Delivered!',
  cancelled: '❌ Cancelled',
};

export const OrderTrackingScreen = () => {
  const route = useRoute();
  const { orderId } = route.params as { orderId: string };

  const [status, setStatus] = useState<OrderStatus>('placed');
  const [driverLocation, setDriverLocation] = useState<LocationPayload | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  // ── Fallback polling ──────────────────────────────────────────────────────
  const pollOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setStatus(data.status);
      if (data.driver?.lat && data.driver?.lng) {
        setDriverLocation({ lat: data.driver.lat, lng: data.driver.lng, bearing: 0 });
      }
    } catch (e) {
      console.warn('[Poll] Failed to fetch order:', e);
    }
  }, [orderId]);

  // ── Real-time socket (read-only for customer) ─────────────────────────────
  useOrderSocket({
    orderId,
    onStatusUpdate: ({ status }: StatusPayload) => setStatus(status),
    onLocationUpdate: (loc: LocationPayload) => {
      setDriverLocation(loc);
      // Animate map camera to driver position
      mapRef.current?.animateCamera(
        { center: { latitude: loc.lat, longitude: loc.lng }, zoom: 16 },
        { duration: 800 }
      );
    },
    onCompleted: () => setCompleted(true),
    onFallbackPoll: pollOrder,
  });

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* ── Map ──────────────────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: driverLocation?.lat ?? 12.9716,
          longitude: driverLocation?.lng ?? 77.5946,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            title="Driver"
            description="Your delivery partner"
            rotation={driverLocation.bearing}
          />
        )}
      </MapView>

      {/* ── Status Card ──────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.orderId}>Order #{orderId.slice(0, 8)}</Text>
        <Text style={styles.statusLabel}>{STATUS_LABELS[status]}</Text>
        {!driverLocation && !completed && (
          <Text style={styles.hint}>Waiting for driver to be assigned…</Text>
        )}
        {completed && (
          <Text style={styles.done}>Your order has been delivered. Enjoy! 🎉</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map:       { flex: 1 },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.l,
    borderTopRightRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    ...theme.shadows.card,
  },
  orderId: {
    fontSize: theme.typography.size.s,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  statusLabel: {
    fontSize: theme.typography.size.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
  },
  hint: {
    marginTop: theme.spacing.s,
    fontSize: theme.typography.size.s,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  done: {
    marginTop: theme.spacing.s,
    fontSize: theme.typography.size.m,
    color: theme.colors.success,
    fontFamily: theme.typography.fontFamily.medium,
  },
});
