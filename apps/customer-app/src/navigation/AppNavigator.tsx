/**
 * AppNavigator.tsx
 * Root navigation — follows spec Section 5.2.2:
 *   Auth Stack: Splash → Onboarding → Login → OTP → ProfileSetup
 *   Main Tab:  Home | Search | Instamart | Orders | Profile
 *   Each tab has its own nested Stack.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './navigationRef';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { useCartStore } from '../store/useCartStore';
import { useGroceryCartStore } from '../store/useGroceryCartStore';
import { theme } from '../theme';
import {
  RootStackParamList,
  AuthStackParamList,
  HomeStackParamList,
  CategoriesStackParamList,
  SearchStackParamList,
  InstamartStackParamList,
  OrdersStackParamList,
  ProfileStackParamList,
  MainTabParamList,
} from './types';

// Deep Linking Configuration
const linking = {
  prefixes: ['fng://', 'https://fng.app', 'https://*.fng.app'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          HomeTab: {
            screens: {
              Store: 'store/:storeId',
              ProductList: 'category/:categoryId',
            },
          },
          OrdersTab: {
            screens: {
              OrderTracking: 'track/:orderId',
              OrderDetail: 'order/:orderId',
            },
          },
        },
      },
    },
  },
};

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
import { ProductDetailScreen } from '../screens/ProductDetailScreen';

// ─── New screens (spec §8.1 — completing 30-screen inventory) ─────────────────
import { OrderConfirmedScreen } from '../screens/OrderConfirmedScreen';
import { OrderDetailScreen } from '../screens/OrderDetailScreen';
import { OrderReviewScreen } from '../screens/OrderReviewScreen';
import { MenuItemDetailScreen } from '../screens/MenuItemDetailScreen';
import { AddAddressScreen } from '../screens/AddAddressScreen';
import { GroceryCartScreen } from '../screens/GroceryCartScreen';
import { SavedAddressesScreen } from '../screens/SavedAddressesScreen';
import { PaymentMethodsScreen } from '../screens/PaymentMethodsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { FavoritesScreen } from '../screens/FavoritesScreen';
import { FngProScreen } from '../screens/FngProScreen';
import { ReferEarnScreen } from '../screens/ReferEarnScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { TermsScreen } from '../screens/TermsScreen';
import { PrivacyPolicyScreen } from '../screens/PrivacyPolicyScreen';
import { OfflineBanner } from '../components/OfflineBanner';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CategoriesStack = createNativeStackNavigator<CategoriesStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const InstamartStack = createNativeStackNavigator<InstamartStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Tab Icon Component ────────────────────────────────────────────────────────
const TabIcon = ({ name, focused, badge }: { name: string; focused: boolean; badge?: number }) => {
  const icons: Record<string, string> = {
    Home: 'home-variant-outline',
    Categories: 'view-grid-outline',
    Search: 'magnify',
    Grocery: 'cart-outline',
    Orders: 'clipboard-list-outline',
    Profile: 'account-circle-outline',
  };

  const activeIcons: Record<string, string> = {
    Home: 'home-variant',
    Categories: 'view-grid',
    Search: 'magnify',
    Grocery: 'cart',
    Orders: 'clipboard-list',
    Profile: 'account-circle',
  };

  const iconName = focused ? activeIcons[name] ?? icons[name] : icons[name];

  return (
    <View style={tabStyles.iconWrap}>
      <View style={[tabStyles.iconBadge, focused && tabStyles.iconBadgeActive]}>
        <MaterialCommunityIcons
          name={iconName || 'circle-outline'}
          size={20}
          color={focused ? theme.colors.tabActive : '#8A94A6'}
        />
        {!!badge && badge > 0 && (
          <View style={tabStyles.badge}>
            <Text style={tabStyles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>{name}</Text>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 2 },
  iconBadge: {
    minWidth: 32,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeActive: {
    backgroundColor: '#EEF4FF',
  },
  label: { fontSize: 10, color: theme.colors.tabInactive, marginTop: 2, fontWeight: '500' },
  labelActive: { color: theme.colors.tabActive, fontWeight: '700' },
  badge: {
    position: 'absolute', top: -4, right: -8,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: theme.colors.accent3 ?? '#E45F10',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
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
    <HomeStack.Screen name="OrderConfirmed" component={OrderConfirmedScreen} />
    <HomeStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    <HomeStack.Screen name="OrderReview" component={OrderReviewScreen} />
    <HomeStack.Screen name="MenuItemDetail" component={MenuItemDetailScreen} />
    <HomeStack.Screen name="AddAddress" component={AddAddressScreen} />
    <HomeStack.Screen name="LocationSelect" component={LocationSelectScreen} />
    <HomeStack.Screen name="Categories" component={CategoriesScreen} />
    <HomeStack.Screen name="BuyAgain" component={BuyAgainScreen} />
    <HomeStack.Screen name="Fresh" component={FreshScreen} />
    <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
  </HomeStack.Navigator>
);

const CategoriesStackNav = () => (
  <CategoriesStack.Navigator screenOptions={NO_HEADER}>
    <CategoriesStack.Screen name="CategoriesMain" component={CategoriesScreen} />
    <CategoriesStack.Screen name="ProductList" component={ProductListScreen} />
    <CategoriesStack.Screen name="SearchMain" component={SearchScreen} />
  </CategoriesStack.Navigator>
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
    <InstamartStack.Screen name="GroceryCart" component={GroceryCartScreen} />
    <InstamartStack.Screen name="ProductList" component={ProductListScreen} />
    <InstamartStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    <InstamartStack.Screen name="OrderConfirmed" component={OrderConfirmedScreen} />
  </InstamartStack.Navigator>
);

const OrdersStackNav = () => (
  <OrdersStack.Navigator screenOptions={NO_HEADER}>
    <OrdersStack.Screen name="OrdersList" component={MyOrdersScreen} />
    <OrdersStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    <OrdersStack.Screen name="OrderReview" component={OrderReviewScreen} />
  </OrdersStack.Navigator>
);

const ProfileStackNav = () => (
  <ProfileStack.Navigator screenOptions={NO_HEADER}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} />
    <ProfileStack.Screen name="LocationSelect" component={LocationSelectScreen} />
    <ProfileStack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
    <ProfileStack.Screen name="AddAddress" component={AddAddressScreen} />
    <ProfileStack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
    <ProfileStack.Screen name="Notifications" component={NotificationsScreen} />
    <ProfileStack.Screen name="Favorites" component={FavoritesScreen} />
    <ProfileStack.Screen name="FngPro" component={FngProScreen} />
    <ProfileStack.Screen name="ReferEarn" component={ReferEarnScreen} />
    <ProfileStack.Screen name="HelpSupport" component={HelpSupportScreen} />
    <ProfileStack.Screen name="Terms" component={TermsScreen} />
    <ProfileStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
  </ProfileStack.Navigator>
);

// ─── Main Tab Navigator ─────────────────────────────────────────────────────────
const MainTabs = () => {
  // Live cart counts for tab badges
  const foodItemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const groceryItemCount = useGroceryCartStore((s) => s.itemCount());

  return (
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
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} badge={foodItemCount} /> }}
      />
      <Tab.Screen
        name="CategoriesTab"
        component={CategoriesStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Categories" focused={focused} /> }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStackNav}
        options={{ tabBarButton: () => null }}
      />
      <Tab.Screen
        name="InstamartTab"
        component={InstamartStackNav}
        options={{ tabBarIcon: ({ focused }) => <TabIcon name="Grocery" focused={focused} badge={groceryItemCount} /> }}
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
};

// ─── Auth Stack ────────────────────────────────────────────────────────────────
const AuthStackNav = () => (
  <AuthStack.Navigator screenOptions={NO_HEADER}>
    <AuthStack.Screen name="Splash" component={SplashScreen} />
    <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Otp" component={OtpScreen} />
    <AuthStack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    <AuthStack.Screen name="Terms" component={TermsScreen} />
    <AuthStack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
  </AuthStack.Navigator>
);

// ─── Root Navigator ─────────────────────────────────────────────────────────────
export const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer ref={navigationRef} linking={linking}>
      <RootStack.Navigator screenOptions={NO_HEADER}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthStackNav} />
        ) : (
          <RootStack.Screen name="Main" component={MainTabs} />
        )}
      </RootStack.Navigator>
      <OfflineBanner />
    </NavigationContainer>
  );
};
