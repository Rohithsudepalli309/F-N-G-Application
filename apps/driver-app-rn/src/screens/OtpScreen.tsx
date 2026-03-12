/**
 * OtpScreen.tsx — 4/6-digit OTP verification.
 * Calls POST /auth/otp/verify, stores JWT, navigates to Main.
 */
import React, {useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {NativeStackNavigationProp, RouteProp} from '@react-navigation/native-stack';
import api from '../services/api';
import {useAuthStore} from '../store/useAuthStore';
import {connectSocket} from '../services/socket';
import type {AuthStackParamList} from '../navigation/AppNavigator';

type Nav  = NativeStackNavigationProp<AuthStackParamList, 'Otp'>;
type Route = RouteProp<AuthStackParamList, 'Otp'>;

interface VerifyResponse {
  accessToken:  string;
  refreshToken: string;
  user: {
    id:          number;
    name:        string;
    phone:       string;
    vehicleType: 'bike' | 'bicycle' | 'car';
    isOnline:    boolean;
  };
}

export default function OtpScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const {phone}    = route.params;

  const [otp, setOtp]         = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const {setTokens, setDriver} = useAuthStore();

  async function handleVerify(): Promise<void> {
    const cleaned = otp.replace(/\D/g, '');
    if (cleaned.length < 4) {
      Alert.alert('Invalid OTP', 'Enter the OTP sent to your number.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post<VerifyResponse>('/auth/otp/verify', {
        phone,
        otp: cleaned,
        role: 'driver',
      });
      const {accessToken, refreshToken, user} = res.data;
      setTokens(accessToken, refreshToken);
      setDriver({...user, profileImage: undefined});
      connectSocket();
      // Replace entire auth stack with Main so back button doesn't return to Login
      navigation.getParent()?.reset({
        index: 0,
        routes: [{name: 'Main'}],
      });
    } catch (e: unknown) {
      const msg = (e as {response?: {data?: {error?: string}}}).response?.data?.error ?? 'Verification failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>Sent to {phone}</Text>

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="------"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
          textAlign="center"
          letterSpacing={8}
          autoFocus
          accessibilityLabel="OTP input"
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleVerify}
          disabled={loading}
          accessibilityRole="button">
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Verify</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resend}
          onPress={() => navigation.goBack()}
          accessibilityRole="button">
          <Text style={styles.resendText}>Change number</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  {flex: 1, justifyContent: 'center', backgroundColor: '#F9FAFB', padding: 24},
  card:       {backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12},
  title:      {fontSize: 26, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 4},
  subtitle:   {fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24},
  input:      {borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, fontSize: 24, paddingVertical: 14, paddingHorizontal: 12, marginBottom: 16, color: '#111827'},
  btn:        {backgroundColor: '#F97316', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 12},
  btnDisabled:{opacity: 0.6},
  btnText:    {color: '#fff', fontSize: 16, fontWeight: '600'},
  resend:     {alignItems: 'center'},
  resendText: {color: '#F97316', fontSize: 14},
});
