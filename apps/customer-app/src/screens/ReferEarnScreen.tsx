/**
 * ReferEarnScreen.tsx
 * Spec §8.1 #27 — Referral program: share code, track invites, earn coins.
 * GET /api/referrals
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, Share, ActivityIndicator, Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

interface ReferralData {
  code: string;
  totalInvites: number;
  successfulInvites: number;
  coinsEarned: number;
  pendingCoins: number;
}

const STEPS = [
  { step: '1', icon: '📤', title: 'Share your code', desc: 'Send your unique referral code to friends' },
  { step: '2', icon: '📲', title: 'Friend signs up', desc: 'They register using your referral code' },
  { step: '3', icon: '🛒', title: 'First order placed', desc: 'Your friend places their first order on F&G' },
  { step: '4', icon: '🪙', title: 'Both earn coins!', desc: 'You get 200 coins, they get 100 coins' },
];

export const ReferEarnScreen = () => {
  const navigation = useNavigation<any>();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: d } = await api.get('/referrals');
        setData(d);
      } catch {
        // Use fallback code so screen is still usable
        setData({
          code: 'FNG-REF-0000',
          totalInvites: 0,
          successfulInvites: 0,
          coinsEarned: 0,
          pendingCoins: 0,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleShare = async () => {
    if (!data?.code) return;
    await Share.share({
      message: `🎉 Join me on F&G - India's fastest delivery app! Use my code *${data.code}* and get ₹50 off your first order. Download now: https://fng.in/app`,
      title: 'Invite friends to F&G',
    });
  };

  const handleCopy = () => {
    if (!data?.code) return;
    Clipboard.setString(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🎁</Text>
          <Text style={styles.heroTitle}>Invite friends,{'\n'}earn F&G Coins!</Text>
          <Text style={styles.heroSub}>
            Get <Text style={styles.heroHighlight}>200 coins</Text> for every friend who places their first order
          </Text>
        </View>

        {/* Referral code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Unique Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.code}>{data?.code ?? '——'}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.75}>
              <Text style={styles.copyBtnText}>{copied ? '✓ Copied' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Share button */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <Text style={styles.shareBtnIcon}>📤</Text>
          <Text style={styles.shareBtnText}>Share with Friends</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{data?.totalInvites ?? 0}</Text>
            <Text style={styles.statLabel}>Total Invites</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{data?.successfulInvites ?? 0}</Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, styles.statCoins]}>{data?.coinsEarned ?? 0}</Text>
            <Text style={styles.statLabel}>Coins Earned</Text>
          </View>
        </View>

        {/* How it works */}
        <Text style={styles.sectionTitle}>How It Works</Text>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.stepRow}>
            <View style={styles.stepBubble}>
              <Text style={styles.stepNum}>{s.step}</Text>
            </View>
            <Text style={styles.stepIcon}>{s.icon}</Text>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepDesc}>{s.desc}</Text>
            </View>
          </View>
        ))}

        <View style={styles.termsCard}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>
            • Referral coins valid for 90 days after credit{'\n'}
            • Friend must place first order within 30 days{'\n'}
            • Max 50 successful referrals per account per month{'\n'}
            • Coins cannot be transferred or withdrawn as cash
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: theme.colors.text.primary },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },
  scroll: { padding: 20, paddingBottom: 40 },

  hero: { alignItems: 'center', marginBottom: 28 },
  heroIcon: { fontSize: 64, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: theme.colors.text.primary, textAlign: 'center', lineHeight: 34, marginBottom: 10 },
  heroSub: { fontSize: 15, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 22 },
  heroHighlight: { color: '#F5A826', fontWeight: '800' },

  codeCard: {
    backgroundColor: '#163D26', borderRadius: 16, padding: 20, marginBottom: 12, alignItems: 'center',
  },
  codeLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', marginBottom: 10 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  code: { color: '#F5A826', fontSize: 26, fontWeight: '800', letterSpacing: 3 },
  copyBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  copyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F5A826', borderRadius: 14, paddingVertical: 16, marginBottom: 24,
    shadowColor: '#F5A826', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 6,
  },
  shareBtnIcon: { fontSize: 20 },
  shareBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: theme.colors.border,
  },
  statNum: { fontSize: 24, fontWeight: '800', color: theme.colors.text.primary },
  statCoins: { color: '#F5A826' },
  statLabel: { fontSize: 11, color: theme.colors.text.secondary, marginTop: 4, textAlign: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  stepBubble: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#163D26',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { color: '#fff', fontWeight: '800', fontSize: 13 },
  stepIcon: { fontSize: 22, marginTop: 2 },
  stepInfo: { flex: 1, paddingTop: 2 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
  stepDesc: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 2 },

  termsCard: {
    backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: theme.colors.border, marginTop: 8,
  },
  termsTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text.secondary, marginBottom: 8 },
  termsText: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 20 },
});
