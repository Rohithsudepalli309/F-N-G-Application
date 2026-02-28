/**
 * FngProScreen.tsx
 * Spec §8.1 #26 — F&G Pro membership subscription plans.
 * GET /api/pro/plans
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const PERKS = [
  { icon: '🚚', title: 'Free Delivery', desc: 'Zero delivery fee on every order, every day' },
  { icon: '⚡', title: 'Priority Delivery', desc: 'Your orders are dispatched first' },
  { icon: '💰', title: '5% Cashback', desc: 'On all food and grocery orders' },
  { icon: '🎁', title: 'Exclusive Deals', desc: 'Members-only offers every week' },
  { icon: '💎', title: 'F&G Coins 2x', desc: 'Double coins on every purchase' },
  { icon: '📞', title: 'Priority Support', desc: 'Dedicated support line — skip the queue' },
];

const PLANS = [
  { id: 'monthly', label: '1 Month', price: 99, originalPrice: 149, popular: false, savings: '₹50 saved' },
  { id: 'quarterly', label: '3 Months', price: 249, originalPrice: 447, popular: true, savings: '₹198 saved' },
  { id: 'annual', label: '12 Months', price: 799, originalPrice: 1788, popular: false, savings: '₹989 saved' },
];

export const FngProScreen = () => {
  const navigation = useNavigation<any>();
  const [selectedPlan, setSelectedPlan] = useState('quarterly');
  const [loading, setLoading] = useState(false);

  const plan = PLANS.find(p => p.id === selectedPlan)!;

  const handleSubscribe = () => {
    setLoading(true);
    // In production: create Razorpay subscription
    setTimeout(() => {
      setLoading(false);
      // Show success
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#163D26" />

      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.heroContent}>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>F&G PRO</Text>
          </View>
          <Text style={styles.heroTitle}>Unlock the Full{'\n'}F&G Experience</Text>
          <Text style={styles.heroSub}>Free delivery · Priority dispatch · Exclusive deals</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Plan selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>
          <View style={styles.plansRow}>
            {PLANS.map(p => (
              <TouchableOpacity
                key={p.id}
                style={[styles.planCard, selectedPlan === p.id && styles.planCardActive]}
                onPress={() => setSelectedPlan(p.id)}
                activeOpacity={0.85}
              >
                {p.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>BEST VALUE</Text>
                  </View>
                )}
                <Text style={[styles.planLabel, selectedPlan === p.id && styles.planLabelActive]}>
                  {p.label}
                </Text>
                <Text style={[styles.planPrice, selectedPlan === p.id && styles.planPriceActive]}>
                  ₹{p.price}
                </Text>
                <Text style={styles.planOriginal}>₹{p.originalPrice}</Text>
                <Text style={styles.planSavings}>{p.savings}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Perks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's Included</Text>
          {PERKS.map((perk, i) => (
            <View key={i} style={styles.perkRow}>
              <View style={styles.perkIconWrap}>
                <Text style={styles.perkIcon}>{perk.icon}</Text>
              </View>
              <View style={styles.perkInfo}>
                <Text style={styles.perkTitle}>{perk.title}</Text>
                <Text style={styles.perkDesc}>{perk.desc}</Text>
              </View>
              <Text style={styles.perkCheck}>✓</Text>
            </View>
          ))}
        </View>

        {/* FAQ teaser */}
        <View style={styles.faqCard}>
          <Text style={styles.faqTitle}>Cancel anytime</Text>
          <Text style={styles.faqText}>
            No long-term commitment. Cancel your Pro membership anytime from Settings.
            Your benefits last until the end of the current billing period.
          </Text>
        </View>
      </ScrollView>

      {/* Subscribe CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.ctaInfo}>
          <Text style={styles.ctaPrice}>₹{plan.price}<Text style={styles.ctaPeriod}> / {plan.label.toLowerCase()}</Text></Text>
          <Text style={styles.ctaSaving}>{plan.savings}</Text>
        </View>
        <TouchableOpacity
          style={[styles.subscribeBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubscribe}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#163D26" />
            : <Text style={styles.subscribeBtnText}>Start F&G Pro →</Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },

  hero: { backgroundColor: '#163D26', paddingTop: 16, paddingBottom: 32, paddingHorizontal: 20 },
  backBtn: { alignSelf: 'flex-start', padding: 4, marginBottom: 20 },
  backArrow: { color: '#fff', fontSize: 22 },
  heroContent: { alignItems: 'center' },
  proBadge: {
    backgroundColor: '#F5A826', borderRadius: 6, paddingHorizontal: 12,
    paddingVertical: 4, marginBottom: 16,
  },
  proBadgeText: { color: '#163D26', fontWeight: '800', fontSize: 12, letterSpacing: 2 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800', textAlign: 'center', lineHeight: 36, marginBottom: 10 },
  heroSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, textAlign: 'center' },

  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 16 },

  plansRow: { flexDirection: 'row', gap: 10 },
  planCard: {
    flex: 1, borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.surface,
    position: 'relative', overflow: 'hidden',
  },
  planCardActive: { borderColor: '#163D26', backgroundColor: '#163D2608' },
  popularBadge: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: '#163D26', paddingVertical: 3,
  },
  popularText: { color: '#fff', fontSize: 8, fontWeight: '800', textAlign: 'center', letterSpacing: 1 },
  planLabel: { fontSize: 12, color: theme.colors.text.secondary, fontWeight: '600', marginTop: 8 },
  planLabelActive: { color: '#163D26', fontWeight: '700' },
  planPrice: { fontSize: 22, fontWeight: '800', color: theme.colors.text.primary, marginTop: 4 },
  planPriceActive: { color: '#163D26' },
  planOriginal: { fontSize: 11, color: theme.colors.text.secondary, textDecorationLine: 'line-through', marginTop: 2 },
  planSavings: { fontSize: 11, color: '#1A7A3C', fontWeight: '600', marginTop: 4, textAlign: 'center' },

  perkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  perkIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#163D2610', alignItems: 'center', justifyContent: 'center',
  },
  perkIcon: { fontSize: 20 },
  perkInfo: { flex: 1 },
  perkTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary },
  perkDesc: { fontSize: 12, color: theme.colors.text.secondary, marginTop: 2 },
  perkCheck: { color: '#1A7A3C', fontWeight: '700', fontSize: 18 },

  faqCard: {
    margin: 20, backgroundColor: '#FEF3C7', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#F59E0B44',
  },
  faqTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 6 },
  faqText: { fontSize: 13, color: '#78350F', lineHeight: 20 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.background, padding: 16,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 10,
  },
  ctaInfo: {},
  ctaPrice: { fontSize: 20, fontWeight: '800', color: '#163D26' },
  ctaPeriod: { fontSize: 14, fontWeight: '400', color: theme.colors.text.secondary },
  ctaSaving: { fontSize: 12, color: '#1A7A3C', fontWeight: '600', marginTop: 2 },
  subscribeBtn: {
    backgroundColor: '#F5A826', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 14,
  },
  subscribeBtnText: { color: '#163D26', fontWeight: '800', fontSize: 15 },
});
