import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';

export const ProfileSetupScreen = () => {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const navigation = useNavigation();

  const [name, setName] = useState(user?.name === 'New User' ? '' : user?.name || '');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      // In a real app, we'd call the backend API here
      // await api.put('/auth/profile', { name, email });
      
      updateUser({ name, email });
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Complete your profile</Text>
        <Text style={styles.subtitle}>Help us know you better for a faster delivery experience.</Text>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL ADDRESS (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, (!name.trim() || loading) && styles.disabled]}
          onPress={handleSave}
          disabled={!name.trim() || loading}
        >
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    padding: theme.spacing.xl,
  },
  backBtn: {
    marginBottom: theme.spacing.xl,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.text.primary,
  },
  title: {
    fontSize: 32,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontSize: theme.typography.size.m,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fontFamily.regular,
    marginBottom: theme.spacing.xxl,
    lineHeight: 24,
  },
  form: {
    flex: 1,
  },
  field: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: 10,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
    letterSpacing: 1.5,
  },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.s,
    fontSize: theme.typography.size.l,
    fontFamily: theme.typography.fontFamily.medium,
    color: theme.colors.text.primary,
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
    opacity: 0.5,
  },
  buttonText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.size.m,
  },
});
