/**
 * LoginScreen.tsx — Phone number entry.
 * Calls POST /auth/otp/send, then navigates to OtpScreen.
 */
import React, {useState} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import api from '../services/api';
import type {AuthStackParamList} from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const [phone, setPhone]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(): Promise<void> {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      Alert.alert('Invalid number', 'Enter a 10-digit mobile number.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/auth/otp/send', {phone: `+91${cleaned}`, role: 'driver'});
      navigation.navigate('Otp', {phone: `+91${cleaned}`});
    } catch (e: unknown) {
      const msg = (e as {response?: {data?: {error?: string}}}).response?.data?.error ?? 'Failed to send OTP.';
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
        <Text style={styles.title}>F&G Driver</Text>
        <Text style={styles.subtitle}>Enter your registered mobile number</Text>

        <View style={styles.inputRow}>
          <Text style={styles.prefix}>+91</Text>
          <TextInput
            style={styles.input}
            placeholder="9xxxxxxxxx"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            accessibilityLabel="Mobile number"
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSendOtp}
          disabled={loading}
          accessibilityRole="button">
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Send OTP</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:  {flex: 1, justifyContent: 'center', backgroundColor: '#F9FAFB', padding: 24},
  card:       {backgroundColor: '#fff', borderRadius: 16, padding: 24, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12},
  title:      {fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 4, textAlign: 'center'},
  subtitle:   {fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24},
  inputRow:   {flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingHorizontal: 12, marginBottom: 16},
  prefix:     {fontSize: 16, color: '#374151', marginRight: 8},
  input:      {flex: 1, fontSize: 16, paddingVertical: 12, color: '#111827'},
  btn:        {backgroundColor: '#F97316', borderRadius: 10, paddingVertical: 14, alignItems: 'center'},
  btnDisabled:{opacity: 0.6},
  btnText:    {color: '#fff', fontSize: 16, fontWeight: '600'},
});
