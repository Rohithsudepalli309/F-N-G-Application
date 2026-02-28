/**
 * OrderConfirmedScreen.tsx
 * Spec §8.1 #14 — Post-payment success screen
 * Shown after Razorpay payment captured. Animates a checkmark, shows order ID,
 * estimated time, and CTA to track or go home.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { theme } from '../theme';

export const OrderConfirmedScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = (route.params as { orderId?: string; totalAmount?: number; eta?: number }) || {};
  const orderId = params.orderId || `FNG-${Date.now()}`;
  const totalAmount = params.totalAmount || 0;
  const eta = params.eta || 25;

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleTrack = () => {
    navigation.replace('OrderTracking', { orderId });
  };

  const handleHome = () => {
    navigation.dispatch(
      CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.container}>
        {/* Animated checkmark circle */}
        <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.checkIcon}>✓</Text>
        </Animated.View>

        <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: slideAnim }] }}>
          <Text style={styles.title}>Order Placed! 🎉</Text>
          <Text style={styles.subtitle}>Your order has been confirmed and{'\n'}the restaurant is preparing it.</Text>

          {/* Order info card */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Order ID</Text>
              <Text style={styles.cardValue}>{orderId}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Total Paid</Text>
              <Text style={[styles.cardValue, styles.amount]}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Estimated Delivery</Text>
              <View style={styles.etaPill}>
                <Text style={styles.etaText}>{eta} min</Text>
              </View>
            </View>
          </View>

          {/* Steps timeline */}
          <View style={styles.timeline}>
            {[
              { icon: '✅', label: 'Order Confirmed', done: true },
              { icon: '🍳', label: 'Restaurant Preparing', done: false },
              { icon: '🛵', label: 'Agent Pickup', done: false },
              { icon: '📦', label: 'Out for Delivery', done: false },
            ].map((step, i) => (
              <View key={i} style={styles.timelineRow}>
                <Text style={styles.timelineIcon}>{step.icon}</Text>
                <Text style={[styles.timelineLabel, step.done && styles.timelineDone]}>
                  {step.label}
                </Text>
                {step.done && <Text style={styles.timelineTick}>✓</Text>}
              </View>
            ))}
          </View>

          {/* CTAs */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleTrack} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Track Your Order →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleHome} activeOpacity={0.75}>
            <Text style={styles.secondaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },

  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#163D26',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    shadowColor: '#163D26',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 12,
  },
  checkIcon: { color: '#fff', fontSize: 48, fontWeight: '700', lineHeight: 56 },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  cardLabel: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '500' },
  cardValue: { fontSize: 14, color: theme.colors.text.primary, fontWeight: '700' },
  amount: { color: '#163D26', fontSize: 16 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 10 },
  etaPill: {
    backgroundColor: '#163D26',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  etaText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  timeline: { width: '100%', marginBottom: 28 },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  timelineIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  timelineLabel: { flex: 1, fontSize: 14, color: theme.colors.text.secondary, fontWeight: '500' },
  timelineDone: { color: '#163D26', fontWeight: '700' },
  timelineTick: { color: '#1A7A3C', fontWeight: '700', fontSize: 16 },

  primaryBtn: {
    width: '100%',
    backgroundColor: '#F5A826',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#F5A826',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  secondaryBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  secondaryBtnText: { color: theme.colors.text.secondary, fontWeight: '600', fontSize: 15 },
});
