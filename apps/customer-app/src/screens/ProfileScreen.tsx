import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, Linking, Dimensions, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

// HQ icon images — 96 px color icons from Icons8 public CDN
const MENU_IMGS: Record<string, string> = {
  orders:    'https://img.icons8.com/color/96/box--v1.png',
  favorites: 'https://img.icons8.com/color/96/like--v1.png',
  buyagain:  'https://img.icons8.com/color/96/recurring-appointment.png',
  wallet:    'https://img.icons8.com/color/96/wallet--v1.png',
  payment:   'https://img.icons8.com/color/96/bank-card-back-side.png',
  coupons:   'https://img.icons8.com/color/96/discount--v1.png',
  address:   'https://img.icons8.com/color/96/place-marker--v1.png',
  notify:    'https://img.icons8.com/color/96/appointment-reminders--v1.png',
  refer:     'https://img.icons8.com/color/96/give-gift--v1.png',
  chat:      'https://img.icons8.com/color/96/chat--v1.png',
  settings:  'https://img.icons8.com/color/96/settings--v1.png',
  terms:     'https://img.icons8.com/color/96/law.png',
  logout:    'https://img.icons8.com/color/96/exit--v1.png',
  camera:    'https://img.icons8.com/color/96/camera--v1.png',
  pro:       'https://img.icons8.com/color/96/star--v1.png',
};

interface MenuRowProps {
  icon: string;
  label: string;
  sub?: string;
  badge?: string;
  onPress: () => void;
  danger?: boolean;
  rightText?: string;
}

const MenuRow = ({ icon, label, sub, badge, onPress, danger, rightText }: MenuRowProps) => (
  <TouchableOpacity style={mrow.wrap} onPress={onPress} activeOpacity={0.7}>
    <View style={mrow.iconBox}>
      <Image source={{ uri: MENU_IMGS[icon] ?? MENU_IMGS.orders }} style={mrow.iconImg} resizeMode="contain" />
    </View>
    <View style={mrow.mid}>
      <Text style={[mrow.label, danger && mrow.danger]}>{label}</Text>
      {sub && <Text style={mrow.sub}>{sub}</Text>}
    </View>
    <View style={mrow.right}>
      {rightText && <Text style={mrow.rightText}>{rightText}</Text>}
      {badge && (
        <View style={mrow.badge}>
          <Text style={mrow.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={mrow.chevron}>›</Text>
    </View>
  </TouchableOpacity>
);

const mrow = StyleSheet.create({
  wrap:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  iconBox:   { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center', marginRight: 12, overflow: 'hidden' },
  iconImg:   { width: 28, height: 28 },
  mid:       { flex: 1 },
  label:     { fontSize: 14, fontWeight: '700', color: '#0D1B14' },
  danger:    { color: '#C62828' },
  sub:       { fontSize: 11, color: '#9E9E9E', marginTop: 2 },
  right:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rightText: { fontSize: 12, color: '#9E9E9E', fontWeight: '600' },
  badge:     { backgroundColor: '#FFEBEE', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 10, fontWeight: '900', color: '#C62828' },
  chevron:   { fontSize: 20, color: '#BDBDBD', marginLeft: 4 },
});

const GroupTitle = ({ title }: { title: string }) => (
  <Text style={gt.text}>{title}</Text>
);
const gt = StyleSheet.create({
  text: { fontSize: 11, fontWeight: '800', color: '#9E9E9E', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 },
});

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const initial = user?.name?.[0]?.toUpperCase() ?? '?';
  const email = (user as any)?.email;

  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={s.hero}>
          <View style={s.heroAvatar}>
            <Text style={s.heroInitial}>{initial}</Text>
            <TouchableOpacity style={s.cameraBtn}>
              <Image source={{ uri: MENU_IMGS.camera }} style={{ width: 14, height: 14 }} resizeMode="contain" />
            </TouchableOpacity>
          </View>
          <Text style={s.heroName}>{user?.name || 'Set your name'}</Text>
          {email && <Text style={s.heroEmail}>{email}</Text>}
          <View style={s.heroStats}>
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>0</Text>
              <Text style={s.heroStatLabel}>Orders</Text>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>0</Text>
              <Text style={s.heroStatLabel}>Coins</Text>
            </View>
            <View style={s.heroStatDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatNum}>0</Text>
              <Text style={s.heroStatLabel}>Saved</Text>
            </View>
          </View>
          <TouchableOpacity style={s.editProfileBtn} onPress={() => navigation.navigate('ProfileSetup')}>
            <Text style={s.editProfileText}>Edit profile</Text>
          </TouchableOpacity>
        </View>

        {/* F&G Pro banner */}
        <TouchableOpacity style={s.proCard} onPress={() => navigation.navigate('FngPro')} activeOpacity={0.88}>
          <View style={s.proLeft}>
            <Image source={{ uri: MENU_IMGS.pro }} style={s.proStarImg} resizeMode="contain" />
            <View>
              <Text style={s.proTitle}>Upgrade to F&G Pro</Text>
              <Text style={s.proSub}>Free delivery · Member discounts · Priority support</Text>
            </View>
          </View>
          <View style={s.proBtn}>
            <Text style={s.proBtnText}>Try Free</Text>
          </View>
        </TouchableOpacity>

        {/* Orders & Activity */}
        <GroupTitle title="Orders & Activity" />
        <View style={s.group}>
          <MenuRow icon="orders" label="My Orders" sub="Track, reorder & rate" onPress={() => navigation.navigate('OrdersTab')} />
          <View style={s.divider} />
          <MenuRow icon="favorites" label="Favourites" sub="Saved products & stores" onPress={() => navigation.navigate('Favorites')} />
          <View style={s.divider} />
          <MenuRow icon="buyagain" label="Buy Again" sub="Reorder your usuals" onPress={() => navigation.navigate('HomeTab', { screen: 'BuyAgain' })} />
        </View>

        {/* Wallet & Payments */}
        <GroupTitle title="Wallet & Payments" />
        <View style={s.group}>
          <MenuRow icon="wallet" label="F&G Wallet" sub="Add money, view balance" rightText="₹0" onPress={() => navigation.navigate('PaymentMethods')} />
          <View style={s.divider} />
          <MenuRow icon="payment" label="Payment Methods" sub="UPI, Cards & Wallets" onPress={() => navigation.navigate('PaymentMethods')} />
          <View style={s.divider} />
          <MenuRow icon="coupons" label="Coupons & Offers" onPress={() => navigation.navigate('FngPro')} />
        </View>

        {/* Account */}
        <GroupTitle title="Account" />
        <View style={s.group}>
          <MenuRow icon="address" label="Saved Addresses" sub="Home, Work and more" onPress={() => navigation.navigate('SavedAddresses')} />
          <View style={s.divider} />
          <MenuRow icon="notify" label="Notifications" badge="NEW" onPress={() => navigation.navigate('Notifications')} />
          <View style={s.divider} />
          <MenuRow icon="refer" label="Refer & Earn" sub="Invite friends · Earn ₹100 each" onPress={() => navigation.navigate('ReferEarn')} />
        </View>

        {/* Help */}
        <GroupTitle title="Help & Support" />
        <View style={s.group}>
          <MenuRow icon="chat" label="Chat with Support" sub="24/7 customer care" onPress={() => navigation.navigate('HelpSupport')} />
          <View style={s.divider} />
          <MenuRow icon="settings" label="Settings" onPress={() => navigation.navigate('Settings')} />
          <View style={s.divider} />
          <MenuRow icon="terms" label="Terms & Privacy" onPress={() => navigation.navigate('Terms')} />
        </View>

        {/* Log out */}
        <GroupTitle title="" />
        <View style={s.group}>
          <MenuRow icon="logout" label="Log Out" onPress={handleLogout} danger />
        </View>

        <Text style={s.version}>F&G App · v1.0.0 · Made in India</Text>
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F7FA' },

  hero:           { backgroundColor: theme.colors.primary, paddingTop: 28, paddingBottom: 28, alignItems: 'center', paddingHorizontal: 24 },
  heroAvatar:     { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, position: 'relative', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)' },
  heroInitial:    { fontSize: 32, fontWeight: '900', color: '#FFF' },
  cameraBtn:      { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: '#F5A826', alignItems: 'center', justifyContent: 'center' },
  heroName:       { fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginBottom: 4 },
  heroEmail:      { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16 },
  heroStats:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 18, gap: 0 },
  heroStat:       { flex: 1, alignItems: 'center' },
  heroStatNum:    { fontSize: 20, fontWeight: '900', color: '#FFF' },
  heroStatLabel:  { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '600' },
  heroStatDivider:{ width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  editProfileBtn: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  editProfileText:{ color: '#FFF', fontSize: 13, fontWeight: '700' },

  proCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#F5A826' },
  proLeft:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  proStarImg: { width: 28, height: 28, marginRight: 2 },
  proTitle:  { fontSize: 14, fontWeight: '800', color: '#92400E' },
  proSub:    { fontSize: 11, color: '#B45309', marginTop: 2 },
  proBtn:    { backgroundColor: '#F5A826', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  proBtnText:{ fontSize: 12, fontWeight: '900', color: '#0D1B14' },

  group:   { backgroundColor: '#FFF', marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#EBEBEB' },
  divider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 68 },

  version: { textAlign: 'center', fontSize: 11, color: '#BDBDBD', marginTop: 20, marginBottom: 8 },
});
