import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { theme } from '../theme';

export const OtpScreen = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const { phone } = route.params as { phone: string };
  const login = useAuthStore((state) => state.login);

  const [timer, setTimer] = useState(30);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleResend = async () => {
    if (timer > 0) return;
    try {
      await api.post('/auth/otp', { phone, role: 'customer' });
      setTimer(30);
      Alert.alert('OTP Resent', 'Please check your messages.');
    } catch (e) {
      Alert.alert('Error', 'Failed to resend OTP');
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { phone, otp });
      login(data.tokens.accessToken, data.user); // Fixed: backend returns .tokens
    } catch (error) {
      Alert.alert('Error', 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>Sent to {phone}</Text>

      <TextInput
        style={styles.input}
        placeholder="123456"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        maxLength={6}
        autoFocus
      />

      <View style={styles.resendContainer}>
        {timer > 0 ? (
          <Text style={styles.timerText}>Resend in {timer}s</Text>
        ) : (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendBtnText}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, (loading || otp.length !== 6) && styles.disabled]} 
        onPress={handleVerify}
        disabled={loading || otp.length !== 6}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
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
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    fontSize: theme.typography.size.xl,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
    letterSpacing: 8,
    height: 60,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  timerText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.size.s,
  },
  resendBtnText: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.s,
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.size.m,
  },
});
