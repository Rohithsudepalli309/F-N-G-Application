/**
 * AppNavigator.tsx — Root navigation tree.
 *
 * STRUCTURE:
 *   Root (Native Stack)
 *   ├── Splash        — determines auth state and redirects
 *   ├── Auth (Native Stack)
 *   │   ├── Login
 *   │   └── Otp
 *   └── Main (Bottom Tabs)
 *       ├── Home       — order queue + online toggle
 *       ├── Active     — live active order (GPS, OTP delivery)
 *       ├── Earnings   — today / weekly summary
 *       └── Profile    — driver profile + settings
 */
import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import HomeScreen from '../screens/HomeScreen';
import ActiveOrderScreen from '../screens/ActiveOrderScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// ── Param lists ────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash:  undefined;
  Auth:    undefined;
  Main:    undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Otp:   {phone: string};
};

export type MainTabParamList = {
  Home:     undefined;
  Active:   undefined;
  Earnings: undefined;
  Profile:  undefined;
};

const Root = createNativeStackNavigator<RootStackParamList>();
const Auth = createNativeStackNavigator<AuthStackParamList>();
const Tab  = createBottomTabNavigator<MainTabParamList>();

function AuthStack(): React.JSX.Element {
  return (
    <Auth.Navigator screenOptions={{headerShown: false}}>
      <Auth.Screen name="Login" component={LoginScreen} />
      <Auth.Screen name="Otp"   component={OtpScreen} />
    </Auth.Navigator>
  );
}

function MainTabs(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:     false,
        tabBarActiveTintColor:   '#F97316', // orange-500
        tabBarInactiveTintColor: '#6B7280',
      }}>
      <Tab.Screen name="Home"     component={HomeScreen}        options={{title: 'Orders'}} />
      <Tab.Screen name="Active"   component={ActiveOrderScreen} options={{title: 'Active'}} />
      <Tab.Screen name="Earnings" component={EarningsScreen}    options={{title: 'Earnings'}} />
      <Tab.Screen name="Profile"  component={ProfileScreen}     options={{title: 'Profile'}} />
    </Tab.Navigator>
  );
}

export default function AppNavigator(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Root.Navigator screenOptions={{headerShown: false}}>
        <Root.Screen name="Splash" component={SplashScreen} />
        <Root.Screen name="Auth"   component={AuthStack} />
        <Root.Screen name="Main"   component={MainTabs} />
      </Root.Navigator>
    </NavigationContainer>
  );
}
