/**
 * ProfileScreen.tsx
 * Spec §8.1 #22-30 — Profile tab with user info, order count, settings links,
 * addresses, payment methods, notifications, F&G Pro, refer & earn, logout.
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, Image, Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { theme } from '../theme';

interface MenuItemProps {
  icon: string;
  label: string;
  sublabel?: string;
  badge?: string;
  onPress: () => void;
  danger?: boolean;
}

const MenuItem = ({ icon, label, sublabel, badge, onPress, danger }: MenuItemProps) => (
  <TouchableOpacity style={menuStyles.item} onPress={onPress} activeOpacity={0.7}>
    <View style={menuStyles.iconWrap}>
      <Text style={menuStyles.icon}>{icon}</Text>
    </View>
    <View style={menuStyles.textWrap}>
      <Text style={[menuStyles.label, danger && menuStyles.dangerText]}>{label}</Text>
      {sublabel && <Text style={menuStyles.sublabel}>{sublabel}</Text>}
    </View>
    {badge && (
      <View style={menuStyles.badge}>
        <Text style={menuStyles.badgeText}>{badge}</Text>
      </View>
    )}
    <Text style={menuStyles.arrow}>›</Text>
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={sectionStyles.header}>{title}</Text>
);

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Text style={{ fontSize: 16 }}>📷</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Set your name'}</Text>
            <Text style={styles.userPhone}>{user?.role === 'customer' ? '👤 Customer' : user?.role}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('ProfileSetup')}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* F&G Pro Banner */}
        <View style={styles.proBanner}>
          <Text style={styles.proEmoji}>⭐</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.proTitle}>Get F&G Pro</Text>
            <Text style={styles.proSub}>Free delivery, member discounts &amp; more</Text>
          </View>
          <TouchableOpacity style={styles.proBtn} onPress={() => navigation.navigate('FngPro')}>
            <Text style={styles.proBtnText}>Explore</Text>
          </TouchableOpacity>
        </View>

        {/* Orders & Activity */}
        <SectionHeader title="Your Orders" />
        <View style={styles.section}>
          <MenuItem
            icon="📦"
            label="My Orders"
            sublabel="Track, reorder, rate"
            onPress={() => navigation.navigate('OrdersTab')}
          />
          <MenuItem
            icon="♻️"
            label="Buy Again"
            sublabel="Reorder your favourites"
            onPress={() => navigation.navigate('BuyAgain')}
          />
        </View>

        {/* Account */}
        <SectionHeader title="Account" />
        <View style={styles.section}>
          <MenuItem
            icon="📍"
            label="Saved Addresses"
            sublabel="Home, Work and more"
            onPress={() => navigation.navigate('SavedAddresses')}
          />
          <MenuItem
            icon="💳"
            label="Payment Methods"
            sublabel="UPI, Cards, Wallets"
            onPress={() => navigation.navigate('PaymentMethods')}
          />
          <MenuItem
            icon="🔔"
            label="Notifications"
            badge="3"
            onPress={() => navigation.navigate('Notifications')}
          />
          <MenuItem
            icon="❤️"
            label="Favourites"
            sublabel="Saved stores &amp; products"
            onPress={() => navigation.navigate('Favorites')}
          />
        </View>

        {/* Offers & Rewards */}
        <SectionHeader title="Offers &amp; Rewards" />
        <View style={styles.section}>
          <MenuItem
            icon="🎁"
            label="F&G Coins"
            sublabel="0 coins"
            onPress={() => navigation.navigate('FngPro')}
          />
          <MenuItem
            icon="🤝"
            label="Refer &amp; Earn"
            sublabel="Invite friends, earn ₹100 each"
            onPress={() => navigation.navigate('ReferEarn')}
          />
          <MenuItem
            icon="🏷️"
            label="Coupons"
            onPress={() => navigation.navigate('FngPro')}
          />
        </View>

        {/* Support */}
        <SectionHeader title="Help &amp; Support" />
        <View style={styles.section}>
          <MenuItem
            icon="💬"
            label="Chat with Support"
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <MenuItem
            icon="📋"
            label="Legal &amp; Privacy"
            onPress={() => Linking.openURL('https://fng.in/legal')}
          />
          <MenuItem
            icon="⚙️"
            label="Settings"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>

        {/* Logout */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <MenuItem
            icon="🚪"
            label="Log Out"
            onPress={handleLogout}
            danger
          />
        </View>

        {/* Version */}
        <Text style={styles.version}>F&G v1.0.0 · Hyderabad, India</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, backgroundColor: theme.colors.surfaceAlt,
    margin: 16, borderRadius: theme.borderRadius.l,
    ...theme.shadows.card,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  editAvatarBtn: {
    position: 'absolute', bottom: -2, right: -2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  userInfo: { flex: 1, marginLeft: 12 },
  userName: { fontSize: 17, fontWeight: '800', color: theme.colors.text.primary },
  userPhone: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: theme.borderRadius.full, borderWidth: 1.5, borderColor: theme.colors.primary },
  editBtnText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary },
  proBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF3E0', marginHorizontal: 16,
    borderRadius: theme.borderRadius.l, padding: 14, gap: 10,
    borderWidth: 1, borderColor: theme.colors.accent,
  },
  proEmoji: { fontSize: 22 },
  proTitle: { fontSize: 14, fontWeight: '800', color: '#B45309' },
  proSub: { fontSize: 11, color: '#92400E', marginTop: 2 },
  proBtn: { backgroundColor: theme.colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.borderRadius.full },
  proBtnText: { fontSize: 12, fontWeight: '800', color: theme.colors.primary },
  section: { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: theme.borderRadius.l, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', marginBottom: 8 },
  version: { textAlign: 'center', fontSize: 12, color: theme.colors.text.secondary, marginBottom: 24 },
});

const menuStyles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 18 },
  textWrap: { flex: 1 },
  label: { fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
  dangerText: { color: theme.colors.error },
  sublabel: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 1 },
  badge: { backgroundColor: theme.colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
  badgeText: { fontSize: 11, fontWeight: '800', color: theme.colors.primary },
  arrow: { fontSize: 20, color: theme.colors.text.secondary },
});

const sectionStyles = StyleSheet.create({
  header: { fontSize: 12, fontWeight: '700', color: theme.colors.text.secondary, textTransform: 'uppercase', letterSpacing: 0.8, marginLeft: 16, marginTop: 16, marginBottom: 6 },
});
