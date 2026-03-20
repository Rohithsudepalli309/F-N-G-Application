import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Otp: { phone: string };
  ProfileSetup: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
};

export type HomeStackParamList = {
  HomeFeed: undefined;
  Store: { storeId: string };
  ProductList: { categoryId: string; title?: string };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
  OrderConfirmed: { orderId: string };
  OrderDetail: { orderId: string };
  OrderReview: { orderId: string };
  MenuItemDetail: { productId: string };
  AddAddress: undefined;
  LocationSelect: undefined;
  Categories: undefined;
  BuyAgain: undefined;
  Fresh: undefined;
};

export type CategoriesStackParamList = {
  CategoriesMain: undefined;
  ProductList: { categoryId: string; title?: string };
  SearchMain: undefined;
};

export type SearchStackParamList = {
  SearchMain: undefined;
  Store: { storeId: string };
  ProductList: { categoryId: string; title?: string };
};

export type InstamartStackParamList = {
  InstamartMain: undefined;
  InstamartCategory: { categoryId: string; title?: string };
  GroceryCart: undefined;
  ProductList: { categoryId: string; title?: string };
  OrderTracking: { orderId: string };
  OrderConfirmed: { orderId: string };
};

export type OrdersStackParamList = {
  OrdersList: undefined;
  OrderTracking: { orderId: string };
  OrderDetail: { orderId: string };
  OrderReview: { orderId: string };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileSetup: undefined;
  Settings: undefined;
  LocationSelect: undefined;
  SavedAddresses: undefined;
  AddAddress: undefined;
  PaymentMethods: undefined;
  Notifications: undefined;
  Favorites: undefined;
  FngPro: undefined;
  ReferEarn: undefined;
  HelpSupport: undefined;
  Terms: undefined;
  PrivacyPolicy: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  CategoriesTab: undefined;
  SearchTab: undefined;
  InstamartTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

// Navigation Props
export type AppNavigationProp = NativeStackNavigationProp<HomeStackParamList & AuthStackParamList & ProfileStackParamList>;
