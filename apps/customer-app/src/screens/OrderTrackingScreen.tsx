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
  pending:          'Awaiting payment',
  placed:           'Order confirmed',
  confirmed:        'Payment confirmed',
  preparing:        'Preparing your order',
  ready:            'Ready for pickup',
  assigned:         'Driver assigned',
  pickup:           'Driver picking up',
  out_for_delivery: 'Out for delivery',
  delivered:        'Delivered!',
  cancelled:        'Cancelled',
};

export const OrderTrackingScreen = () => {
  const route = useRoute();
  // SAFE NAVIGATION: Ensure orderId defaults nicely and matches the expected format
  const params = route.params as { orderId: string } | undefined;
  const orderId = params?.orderId || 'DEMO-ORDER-000';

  const [status, setStatus] = useState<OrderStatus>('placed');
  const [driverLocation, setDriverLocation] = useState<LocationPayload | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView>(null);

  const calcDistanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const rLat1 = toRad(aLat);
    const rLat2 = toRad(bLat);
    const h =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
  };

  // ── Fallback polling ──────────────────────────────────────────────────────
  const pollOrder = useCallback(async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      const order = data?.order;
      if (!order) return;

      setStatus(order.status);

      const dest = order.delivery_address;
      if (dest && typeof dest.lat === 'number' && typeof dest.lng === 'number') {
        setDestination({ lat: dest.lat, lng: dest.lng });
      }

      if (order.driver?.lat && order.driver?.lng) {
        const loc = { lat: order.driver.lat, lng: order.driver.lng, bearing: 0 };
        setDriverLocation(loc);

        if (destination) {
          const km = calcDistanceKm(loc.lat, loc.lng, destination.lat, destination.lng);
          setEtaMinutes(Math.max(4, Math.round((km / 25) * 60)));
        }
      }
    } catch (e) {
      console.warn('[Poll] Failed to fetch order:', e);
    }
  }, [orderId, destination]);

  // ── Real-time socket (read-only for customer) ─────────────────────────────
  useOrderSocket({
    orderId,
    onStatusUpdate: ({ status }: StatusPayload) => setStatus(status),
    onLocationUpdate: (loc: LocationPayload) => {
      if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return;
      setDriverLocation(loc);

      if (destination) {
        const km = calcDistanceKm(loc.lat, loc.lng, destination.lat, destination.lng);
        setEtaMinutes(Math.max(4, Math.round((km / 25) * 60)));
      }

      // Animate map camera to driver position (SAFE CHECK)
      if (mapRef.current) {
        mapRef.current.animateCamera(
          { center: { latitude: loc.lat, longitude: loc.lng }, zoom: 16 },
          { duration: 800 }
        );
      }
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
          latitude: driverLocation?.lat ?? destination?.lat ?? 12.9716,
          longitude: driverLocation?.lng ?? destination?.lng ?? 77.5946,
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
        {destination && (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            title="Delivery destination"
            description="Your address"
            pinColor="#ef4444"
          />
        )}
      </MapView>

      {/* ── Status Card ──────────────────────────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.orderId}>Order #{orderId.slice(0, 8)}</Text>
        <Text style={styles.statusLabel}>{STATUS_LABELS[status]}</Text>
        {etaMinutes != null && !completed && (
          <Text style={styles.eta}>ETA: {etaMinutes} min</Text>
        )}
        {!driverLocation && !completed && (
          <Text style={styles.hint}>Waiting for driver to be assigned…</Text>
        )}
        {completed && (
          <Text style={styles.done}>Your order has been delivered. Enjoy!</Text>
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
  eta: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.size.m,
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium,
  },
});
