import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

const SETTING_IMGS: Record<string, string> = {
  orders:        'https://img.icons8.com/color/96/online-order--v1.png',
  gift:          'https://img.icons8.com/color/96/gift-card.png',
  support:       'https://img.icons8.com/color/96/customer-support--v1.png',
  addresses:     'https://img.icons8.com/color/96/place-marker--v1.png',
  profile:       'https://img.icons8.com/color/96/user-male-circle--v1.png',
  rewards:       'https://img.icons8.com/color/96/loyalty-card--v1.png',
  payment:       'https://img.icons8.com/color/96/bank-card-back-side.png',
  suggest:       'https://img.icons8.com/color/96/star--v1.png',
  notifications: 'https://img.icons8.com/color/96/appointment-reminders--v1.png',
  info:          'https://img.icons8.com/color/96/info--v1.png',
};

const PRIMARY_MENU: MenuItem[] = [
  { id: 'orders',    label: 'My Orders',            icon: 'orders' },
  { id: 'gift',      label: 'E-Gift Cards',          icon: 'gift' },
  { id: 'support',   label: 'Help & Support',        icon: 'support' },
  { id: 'addresses', label: 'Saved Addresses',       icon: 'addresses' },
  { id: 'profile',   label: 'Profile',               icon: 'profile' },
  { id: 'rewards',   label: 'Rewards',               icon: 'rewards' },
  { id: 'payment',   label: 'Payment Management',    icon: 'payment' },
];

const OTHER_MENU: MenuItem[] = [
  { id: 'suggest',       label: 'Suggest Products', icon: 'suggest' },
  { id: 'notifications', label: 'Notifications',    icon: 'notifications' },
  { id: 'info',          label: 'General Info',     icon: 'info' },
];

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
  };

  const nav = navigation as any;
  const ROUTES: Record<string, () => void> = {
    orders:        () => nav.navigate('OrdersTab'),
    profile:       () => nav.navigate('ProfileMain'),
    addresses:     () => nav.navigate('SavedAddresses'),
    support:       () => nav.navigate('HelpSupport'),
    payment:       () => nav.navigate('PaymentMethods'),
    rewards:       () => nav.navigate('FngPro'),
    notifications: () => nav.navigate('Notifications'),
    gift:          () => nav.navigate('HelpSupport'),
    suggest:       () => nav.navigate('HelpSupport'),
    info:          () => nav.navigate('HelpSupport'),
  };

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.menuItem}
      onPress={() => (ROUTES[item.id] ?? (() => nav.navigate('HelpSupport')))()}
    >
      <View style={styles.menuLeft}>
        <View style={styles.iconContainer}>
          <Image source={{ uri: SETTING_IMGS[item.id] ?? SETTING_IMGS.info }} style={styles.menuImg} resizeMode="contain" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.menuLabel}>{item.label}</Text>
          {item.id === 'addresses' && <Text style={styles.subtext}>0 Addresses</Text>}
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Section 1 */}
        <View style={styles.section}>
          {PRIMARY_MENU.map(renderMenuItem)}
        </View>

        {/* Section 2 */}
        <View style={styles.otherSection}>
          <Text style={styles.sectionHeader}>Other Information</Text>
          <View style={styles.section}>
            {OTHER_MENU.map(renderMenuItem)}
          </View>
        </View>

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>App version 26.2.5</Text>
          <Text style={styles.versionText}>v134-2</Text>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Light grey background like screenshot
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  backArrow: {
    fontSize: 24,
    color: '#000',
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  content: {
    padding: 16,
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  menuImg: {
    width: 24,
    height: 24,
  },
  textContainer: {
    justifyContent: 'center',
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: theme.typography.fontFamily.medium,
    color: '#333',
  },
  subtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#CCC',
  },
  otherSection: {
    marginTop: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
    marginBottom: 12,
    marginLeft: 4,
  },
  logoutBtn: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: theme.typography.fontFamily.bold,
    color: '#000',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#666',
    fontFamily: theme.typography.fontFamily.medium,
    marginBottom: 4,
  },
});
