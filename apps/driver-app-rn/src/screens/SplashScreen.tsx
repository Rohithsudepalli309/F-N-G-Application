/**
 * SplashScreen.tsx — Bootstraps the app: checks stored auth token, then routes
 * to either the Main tabs or the Auth login flow.
 */
import React, {useEffect} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuthStore} from '../store/useAuthStore';
import {connectSocket} from '../services/socket';
import type {RootStackParamList} from '../navigation/AppNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen(): React.JSX.Element {
  const navigation = useNavigation<Nav>();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (accessToken) {
        connectSocket();
        navigation.replace('Main');
      } else {
        navigation.replace('Auth');
      }
    }, 800); // brief splash delay — adjust to match brand animation

    return () => clearTimeout(timer);
  }, [accessToken, navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#F97316" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'},
});
