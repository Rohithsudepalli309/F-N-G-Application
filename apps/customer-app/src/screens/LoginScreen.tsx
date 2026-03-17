import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_HEIGHT * 0.38;

export const LoginScreen = () => {
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);
  const [logoTaps, setLogoTaps] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const navigation = useNavigation();
  const login = useAuthStore((s) => s.login);
  const setLastOtp = useAuthStore((s) => s.setLastOtp);

  const handleLogoTap = () => {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) {
      setShowPreview(true);
      setLogoTaps(0);
    }
  };

  const handleOwnerPreview = () => {
    login('owner-preview-token', {
      id: 'owner-001',
      name: 'Owner Preview',
      role: 'customer',
      phone: '9999999999',
      email: 'owner@fngapp.in',
    });
  };

  // Animations
  const fadeIn    = useRef(new Animated.Value(0)).current;
  const slideUp   = useRef(new Animated.Value(30)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 600, delay: 100, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    // Subtle floating logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, { toValue: -8, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(logoFloat, { toValue:  0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePressIn = () =>
    Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start();
  const handlePressOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();

  const handleSendOtp = async () => {
    const normalizedPhone = phone.replace(/\D/g, '').slice(0, 10);

    if (!/^\d{10}$/.test(normalizedPhone)) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/otp', { phone: normalizedPhone, role: 'customer' });
      // In dev the backend returns the OTP in the response — auto-fill it
      if (data?.otp) setLastOtp(data.otp);
      (navigation as any).navigate('Otp', { phone: normalizedPhone });
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.message ||
        'Could not send OTP. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = phone.length === 10 && !loading;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* ── Orange Hero ──────────────────────────────────────────────── */}
      <View style={styles.hero}>
        {/* Accent circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />

        <TouchableOpacity onPress={handleLogoTap} activeOpacity={1}>
          <Animated.Image
            source={require('../assets/f_g_logo.png.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={styles.brandTagline}>Fresh. Fast. Delivered.</Text>
      </View>

      {/* ── White Card ───────────────────────────────────────────────── */}
      <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
        {/* Phone Input */}
        <View style={styles.inputRow}>
          <View style={styles.prefix}>
            <Text style={styles.prefixText}>+91</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="98765 43210"
            placeholderTextColor={theme.colors.text.secondary + '80'}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => setPhone(text.replace(/\D/g, '').slice(0, 10))}
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={handleSendOtp}
          />
        </View>

        {/* CTA Button */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            onPress={handleSendOtp}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={!canSubmit}
            activeOpacity={1}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Continue  →</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {showPreview && (
          <TouchableOpacity style={styles.ownerBtn} onPress={handleOwnerPreview}>
            <Text style={styles.ownerBtnText}>Preview App as Owner</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          By continuing, you agree to our{' '}
          <Text style={styles.disclaimerLink} onPress={() => (navigation as any).navigate('Terms')}>
            Terms of Service
          </Text>
          {' '}&amp;{' '}
          <Text style={styles.disclaimerLink} onPress={() => (navigation as any).navigate('PrivacyPolicy')}>
            Privacy Policy
          </Text>
          .
        </Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Orange hero section
  hero: {
    height: HERO_HEIGHT,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circle1: {
    width: 260,
    height: 260,
    top: -80,
    right: -60,
  },
  circle2: {
    width: 180,
    height: 180,
    bottom: -50,
    left: -40,
  },
  logoImage: {
    width: 124,
    height: 110,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  brandName: {
    fontSize: 40,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: theme.typography.size.s,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: theme.typography.fontFamily.regular,
    marginTop: 4,
    letterSpacing: 1,
  },
  // White bottom card
  card: {
    flex: 1,
    backgroundColor: theme.colors.background,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 56,
  },
  title: {
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.xxl,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontFamily: theme.typography.fontFamily.regular,
    fontSize: theme.typography.size.m,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  prefix: {
    paddingHorizontal: theme.spacing.m,
    height: 56,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  prefixText: {
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.m,
    color: theme.colors.text.primary,
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: theme.spacing.m,
    fontSize: theme.typography.size.l,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
  },
  button: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.m,
    letterSpacing: 0.5,
  },
  disclaimer: {
    marginTop: theme.spacing.l,
    fontSize: 11,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontFamily: theme.typography.fontFamily.regular,
    lineHeight: 16,
  },
  disclaimerLink: {
    color: theme.colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  ownerBtn: {
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  ownerBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.3,
  },
});
