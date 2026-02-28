/**
 * AppNavigator.tsx
 * Root navigation — follows spec Section 5.2.2:
 *   Auth Stack: Splash → Onboarding → Login → OTP → ProfileSetup
 *   Main Tab:  Home | Search | Instamart | Orders | Profile
 *   Each tab has its own nested Stack.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { theme } from '../theme';

// ─── Auth Screens ─────────────────────────────────────────────────────────────
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';

// ─── Tab Screens ───────────────────────────────────────────────────────────────
import { HomeScreen } from '../screens/HomeScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { InstamartHomeScreen } from '../screens/InstamartHomeScreen';
import { MyOrdersScreen } from '../screens/MyOrdersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// ─── Sub-screens (nested in stacks) ───────────────────────────────────────────
import { StoreScreen } from '../screens/StoreScreen';
import { ProductListScreen } from '../screens/ProductListScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderTrackingScreen } from '../screens/OrderTrackingScreen';
import { LocationSelectScreen } from '../screens/LocationSelectScreen';
import { InstamartCategoryScreen } from '../screens/InstamartCategoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { BuyAgainScreen } from '../screens/BuyAgainScreen';
import { FreshScreen } from '../screens/FreshScreen';

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const InstamartStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Tab Icon Component ────────────────────────────────────────────────────────
const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, string> = {
    Home: '🏠', Search: '🔍', Instamart: '🛒', Orders: '📦', Profile: '👤',
  };
  return (
    <View style={tabStyles.iconWrap}>
      <Text style={[tabStyles.icon, focused && tabStyles.iconActive]}>
        {icons[name] || '◉'}
      </Text>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{name}</Text>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  icon: { fontSize: 20, opacity: 0.5 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, color: theme.colors.tabInactive, marginTop: 2, fontWeight: '500' },
  labelActive: { color: theme.colors.tabActive, fontWeight: '700' },
});

const NO_HEADER = { headerShown: false };

// ─── Nested Stacks ─────────────────────────────────────────────────────────────
const HomeStackNav = () => (
  <HomeStack.Navigator screenOptions={NO_HEADER}>
    <HomeStack.Screen name="HomeFeed" component={HomeScreen} />
    <HomeStack.Screen name="Store" component={StoreScreen} />
    <HomeStack.Screen name="ProductList" component={ProductListScreen} />
    <HomeStack.Screen name="Cart" component={CartScreen} />
    <HomeStack.Screen name="Checkout" component={CheckoutScreen} />
    <HomeStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    <HomeStack.Screen name="LocationSelect" component={LocationSelectScreen} />
    <HomeStack.Screen name="Categories" component={CategoriesScreen} />
    <HomeStack.Screen name="BuyAgain" component={BuyAgainScreen} />
    <HomeStack.Screen name="Fresh" component={FreshScreen} />
  </HomeStack.Navigator>
);

const SearchStackNav = () => (
  <SearchStack.Navigator screenOptions={NO_HEADER}>
    <SearchStack.Screen name="SearchMain" component={SearchScreen} />
    <SearchStack.Screen name="Store" component={StoreScreen} />
    <SearchStack.Screen name="ProductList" component={ProductListScreen} />
  </SearchStack.Navigator>
);

const InstamartStackNav = () => (
  <InstamartStack.Navigator screenOptions={NO_HEADER}>
    <InstamartStack.Screen name="InstamartMain" component={InstamartHomeScreen} />
    <InstamartStack.Screen name="InstamartCategory" component={InstamartCategoryScreen} />
    <InstamartStack.Screen name="Cart" component={CartScreen} />
    <InstamartStack.Screen name="Checkout" component={CheckoutScreen} />
    <InstamartStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </InstamartStack.Navigator>
);

const OrdersStackNav = () => (
  <OrdersStack.Navigator screenOptions={NO_HEADER}>
    <OrdersStack.Screen name="OrdersList" component={MyOrdersScreen} />
    <OrdersStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </OrdersStack.Navigator>
);

const ProfileStackNav = () => (
  <ProfileStack.Navigator screenOptions={NO_HEADER}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="LocationSelect" component={LocationSelectScreen} />
  </ProfileStack.Navigator>
);

// ─── Main Tab Navigator ─────────────────────────────────────────────────────────
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        height: Platform.OS === 'ios' ? 84 : 62,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        ...theme.shadows.bottom,
      },
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStackNav}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} /> }}
    />
    <Tab.Screen
      name="SearchTab"
      component={SearchStackNav}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="Search" focused={focused} /> }}
    />
    <Tab.Screen
      name="InstamartTab"
      component={InstamartStackNav}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="Instamart" focused={focused} /> }}
    />
    <Tab.Screen
      name="OrdersTab"
      component={OrdersStackNav}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="Orders" focused={focused} /> }}
    />
    <Tab.Screen
      name="ProfileTab"
      component={ProfileStackNav}
      options={{ tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} /> }}
    />
  </Tab.Navigator>
);

// ─── Auth Stack ────────────────────────────────────────────────────────────────
const AuthStackNav = () => (
  <AuthStack.Navigator screenOptions={NO_HEADER}>
    <AuthStack.Screen name="Splash" component={SplashScreen} />
    <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Otp" component={OtpScreen} />
    <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
  </AuthStack.Navigator>
);

// ─── Root Navigator ─────────────────────────────────────────────────────────────
export const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={NO_HEADER}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthStackNav} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
