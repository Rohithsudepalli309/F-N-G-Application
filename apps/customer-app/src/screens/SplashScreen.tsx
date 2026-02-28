/**
 * SplashScreen.tsx
 * Spec §5.2.1 — F&G logo SVG, animated rings, brand wordmark.
 * Auto-navigates after 2.8s. Checks AsyncStorage flag for onboarding skip.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');
const RING_SIZE = width * 0.7;

export const SplashScreen = () => {
  const navigation = useNavigation<any>();

  // Animations
  const logoScale  = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(0.3)).current;
  const ring2Scale = useRef(new Animated.Value(0.3)).current;
  const ring1Opacity = useRef(new Animated.Value(0.7)).current;
  const ring2Opacity = useRef(new Animated.Value(0.5)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Phase 1: Logo appearance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 6 }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Phase 2: Rings pulse out
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(ring1Scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring2Scale, { toValue: 1.2, duration: 1100, useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ]),
    ]).start();

    // Phase 3: Wordmark slides up
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(wordmarkOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(wordmarkY, { toValue: 0, useNativeDriver: true, tension: 80 }),
      ]).start();
    }, 600);

    // Navigate after 2.8s
    const timer = setTimeout(async () => {
      try {
        const seen = await AsyncStorage.getItem('fng_onboarding_seen');
        navigation.replace(seen === 'true' ? 'Login' : 'Onboarding');
      } catch {
        navigation.replace('Onboarding');
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Pulsing rings */}
      <Animated.View style={[styles.ring, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
      <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />

      {/* Logo badge */}
      <Animated.View style={[styles.logoBadge, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <Text style={styles.logoInitials}>F&G</Text>
      </Animated.View>

      {/* Wordmark */}
      <Animated.View style={{ opacity: wordmarkOpacity, transform: [{ translateY: wordmarkY }], alignItems: 'center', marginTop: 28 }}>
        <Text style={styles.wordmark}>Food &amp; Grocery</Text>
        <Text style={styles.tagline}>Hyderabad's fastest delivery</Text>
      </Animated.View>

      {/* Bottom tagline */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Delivering happiness, fast.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(245,168,38,0.4)',
  },
  ring2: {
    width: RING_SIZE * 0.75,
    height: RING_SIZE * 0.75,
    borderRadius: (RING_SIZE * 0.75) / 2,
    borderColor: 'rgba(245,168,38,0.6)',
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.orange,
  },
  logoInitials: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  wordmark: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
