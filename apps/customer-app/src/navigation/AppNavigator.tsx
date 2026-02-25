import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { OtpScreen } from '../screens/OtpScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { BuyAgainScreen } from '../screens/BuyAgainScreen';
import { FreshScreen } from '../screens/FreshScreen';
import { StoreScreen } from '../screens/StoreScreen';
import { CartScreen } from '../screens/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { OrderTrackingScreen } from '../screens/OrderTrackingScreen';
import { LocationSelectScreen } from '../screens/LocationSelectScreen';
import { ProfileSetupScreen } from '../screens/ProfileSetupScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProductListScreen } from '../screens/ProductListScreen';
import { MyOrdersScreen } from '../screens/MyOrdersScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
          </>
        ) : (
          // App Stack
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="BuyAgain" component={BuyAgainScreen} />
            <Stack.Screen name="Fresh" component={FreshScreen} />
            <Stack.Screen name="Store" component={StoreScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="LocationSelect" component={LocationSelectScreen} />
            <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ProductList" component={ProductListScreen} />
            <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
