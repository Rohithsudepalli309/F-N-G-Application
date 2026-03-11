/**
 * HelpSupportScreen.tsx
 * Spec §8.1 #28 — In-app help, FAQs, and contact support.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, Linking, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const TOPICS = [
  { icon: '📦', label: 'Order Issues', desc: 'Missing items, wrong order, damaged goods' },
  { icon: '💳', label: 'Payment & Refunds', desc: 'Charged incorrectly, refund status' },
  { icon: '🛵', label: 'Delivery Issues', desc: 'Late delivery, agent not found' },
  { icon: '🏪', label: 'Restaurant Issue', desc: 'Food quality, wrong restaurant' },
  { icon: '👤', label: 'Account Help', desc: 'Login issues, profile, preferences' },
  { icon: '🎁', label: 'Coupons & Pro', desc: 'Coupon not applied, Pro benefits' },
];

const FAQS = [
  {
    q: 'How do I cancel my order?',
    a: 'You can cancel an order before it is accepted by the restaurant. Go to Orders → Select order → Cancel Order. Cancellation after acceptance may not be possible.',
  },
  {
    q: 'When will I get my refund?',
    a: 'Refunds are processed within 5–7 business days to your original payment method. For UPI/wallets, it can be faster (1–3 days).',
  },
  {
    q: 'My order is late. What should I do?',
    a: 'Open the order tracking screen to see real-time ETA. If the delay exceeds 15 minutes beyond the promised time, tap "Get Help" for priority support.',
  },
  {
    q: 'Can I change my delivery address after placing an order?',
    a: 'Address changes are only possible before the restaurant accepts the order. Contact support immediately if needed.',
  },
  {
    q: 'How do F&G Coins work?',
    a: 'You earn coins on every order. 100 coins = ₹1 discount. Coins expire 90 days after earning and can be used on your next order.',
  },
  {
    q: 'Is F&G available in my city?',
    a: 'Currently available in Hyderabad, Bengaluru, Mumbai, and Delhi NCR. More cities launching soon!',
  },
];

export const HelpSupportScreen = () => {
  const navigation = useNavigation<any>();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFaqs = searchQuery.length > 2
    ? FAQS.filter(f =>
        f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : FAQS;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Search FAQs */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for help…"
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        {/* Live chat / contact CTA */}
        <View style={styles.contactCard}>
          <View style={styles.contactLeft}>
            <Text style={styles.contactTitle}>Need immediate help?</Text>
            <Text style={styles.contactSub}>Our team is available 8 AM – 11 PM daily</Text>
          </View>
          <View style={styles.contactBtns}>
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => Linking.openURL('https://wa.me/918888888888')}
            >
              <Text style={styles.chatBtnIcon}>💬</Text>
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => Linking.openURL('tel:+918888888888')}
            >
              <Text style={styles.callBtnIcon}>📞</Text>
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Help topics */}
        <Text style={styles.sectionTitle}>Browse by Topic</Text>
        <View style={styles.topicsGrid}>
          {TOPICS.map((topic, i) => (
            <TouchableOpacity key={i} style={styles.topicCard} activeOpacity={0.75}>
              <Text style={styles.topicIcon}>{topic.icon}</Text>
              <Text style={styles.topicLabel}>{topic.label}</Text>
              <Text style={styles.topicDesc} numberOfLines={2}>{topic.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <Text style={styles.sectionTitle}>
          {searchQuery.length > 2 ? `Results for "${searchQuery}"` : 'Frequently Asked Questions'}
        </Text>
        {filteredFaqs.length === 0 && (
          <Text style={styles.noResults}>No results found. Try a different search.</Text>
        )}
        {filteredFaqs.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.faqCard, expandedFaq === i && styles.faqCardExpanded]}
            onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
            activeOpacity={0.75}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ}>{faq.q}</Text>
              <Text style={styles.faqChevron}>{expandedFaq === i ? '▲' : '▼'}</Text>
            </View>
            {expandedFaq === i && (
              <Text style={styles.faqA}>{faq.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Email support */}
        <TouchableOpacity
          style={styles.emailBtn}
          onPress={() => Linking.openURL('mailto:support@fng.in?subject=App Support')}
        >
          <Text style={styles.emailIcon}>✉️</Text>
          <Text style={styles.emailText}>Email us at support@fng.in</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { padding: 4 },
  backArrow: { fontSize: 22, color: theme.colors.text.primary },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text.primary },
  scroll: { padding: 16, paddingBottom: 40 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.colors.surface, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, marginBottom: 16, borderWidth: 1, borderColor: theme.colors.border,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: theme.colors.text.primary },

  contactCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#163D26', borderRadius: 16, padding: 16, marginBottom: 24, gap: 12,
  },
  contactLeft: { flex: 1 },
  contactTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  contactSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  contactBtns: { flexDirection: 'row', gap: 8 },
  chatBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
  },
  chatBtnIcon: { fontSize: 18 },
  chatBtnText: { color: '#fff', fontSize: 11, fontWeight: '600', marginTop: 2 },
  callBtn: {
    backgroundColor: '#F5A826', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center',
  },
  callBtnIcon: { fontSize: 18 },
  callBtnText: { color: '#163D26', fontSize: 11, fontWeight: '700', marginTop: 2 },

  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 14,
  },

  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  topicCard: {
    width: '47%', backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  topicIcon: { fontSize: 28, marginBottom: 8 },
  topicLabel: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 4 },
  topicDesc: { fontSize: 12, color: theme.colors.text.secondary, lineHeight: 16 },

  noResults: { color: theme.colors.text.secondary, fontSize: 14, textAlign: 'center', marginBottom: 20 },

  faqCard: {
    backgroundColor: theme.colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 8, borderWidth: 1, borderColor: theme.colors.border,
  },
  faqCardExpanded: { borderColor: '#163D26', borderWidth: 1.5 },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  faqQ: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.text.primary, lineHeight: 20 },
  faqChevron: { fontSize: 10, color: theme.colors.text.secondary, marginTop: 4 },
  faqA: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 12, lineHeight: 20 },

  emailBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: theme.colors.border, marginTop: 8,
  },
  emailIcon: { fontSize: 18 },
  emailText: { fontSize: 14, color: theme.colors.text.secondary, fontWeight: '600' },
});
