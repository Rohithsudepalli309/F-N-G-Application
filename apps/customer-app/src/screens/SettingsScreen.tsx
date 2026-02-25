import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { useAuthStore } from '../store/useAuthStore';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

const PRIMARY_MENU: MenuItem[] = [
  { id: 'orders', label: 'My Orders', icon: '🛍️' },
  { id: 'gift', label: 'E-Gift Cards', icon: '🎫' },
  { id: 'support', label: 'Help & Support', icon: '💬' },
  { id: 'addresses', label: 'Saved Addresses', icon: '📍' },
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'rewards', label: 'Rewards', icon: '🎁' },
  { id: 'payment', label: 'Payment Management', icon: '💳' },
];

const OTHER_MENU: MenuItem[] = [
  { id: 'suggest', label: 'Suggest Products', icon: '⭐' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'info', label: 'General Info', icon: 'ℹ️' },
];

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    logout();
  };

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity 
      key={item.id} 
      style={styles.menuItem}
      onPress={() => {
        if (item.id === 'orders') (navigation as any).navigate('MyOrders');
        else if (item.id === 'profile') (navigation as any).navigate('ProfileSetup');
        else if (item.id === 'addresses') (navigation as any).navigate('LocationSelect');
        else (navigation as any).navigate('ProductList', { categoryName: item.label });
      }}
    >
      <View style={styles.menuLeft}>
        <View style={styles.iconContainer}>
          <Text style={styles.menuIcon}>{item.icon}</Text>
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
  menuIcon: {
    fontSize: 20,
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
