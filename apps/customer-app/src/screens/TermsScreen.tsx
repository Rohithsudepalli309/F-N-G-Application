/**
 * TermsScreen.tsx
 * F&G — Terms of Service
 * Compliant with Indian IT Act 2000, Consumer Protection Act 2019,
 * Consumer Protection (E-Commerce) Rules 2020.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const LAST_UPDATED = 'March 11, 2026';
const COMPANY = 'F&G Technologies Private Limited';
const ADDRESS = '4th Floor, Cyber Towers, Hitech City, Hyderabad – 500081, Telangana, India';
const GRIEVANCE_EMAIL = 'grievance@fngapp.in';
const SUPPORT_EMAIL = 'support@fngapp.in';
const GRIEVANCE_OFFICER = 'Mr. Arjun Reddy';

const SECTIONS = [
  {
    title: '1. About F&G',
    content: `F&G is an online marketplace platform operated by ${COMPANY} ("Company", "we", "our", "us"), registered under the Companies Act, 2013. We connect customers with partner restaurants, grocery stores, and delivery partners across India through our mobile application ("App").\n\nBy accessing or using the App, you ("User", "Customer") agree to be bound by these Terms of Service ("Terms"). If you do not agree, please do not use the App.`,
  },
  {
    title: '2. Eligibility',
    content: `• You must be at least 18 years of age to use this App.\n• You must have a valid mobile number registered in India.\n• You must have the legal capacity to enter into a binding contract under Indian law.\n• By creating an account, you represent and warrant that all information you provide is accurate, current, and complete.\n• We reserve the right to suspend or terminate your account if we find any information to be false or misleading.`,
  },
  {
    title: '3. Account Registration & Security',
    content: `• Registration is completed via OTP (One-Time Password) verification to your registered mobile number.\n• You are responsible for maintaining the confidentiality of your account credentials.\n• You agree to notify us immediately at ${SUPPORT_EMAIL} of any unauthorized use of your account.\n• We are not liable for any loss or damage arising from your failure to comply with this security obligation.\n• We reserve the right to refuse service, terminate accounts, or cancel orders at our sole discretion.`,
  },
  {
    title: '4. Placing Orders',
    content: `• Orders placed through the App constitute a binding offer to purchase from the listed merchant partner.\n• Prices displayed are inclusive of applicable taxes unless stated otherwise.\n• Order acceptance is confirmed via in-app notification and SMS. The contract is formed upon acceptance.\n• Estimated delivery times are indicative and may vary based on distance, weather, traffic, and restaurant preparation time.\n• We act as an aggregator/marketplace and are not responsible for the quality, quantity, or accuracy of items prepared by merchant partners.\n• We reserve the right to cancel any order due to unavailability of items, pricing errors, or technical issues, with a full refund in such cases.`,
  },
  {
    title: '5. Pricing & Payments',
    content: `• All prices are in Indian Rupees (INR) and are subject to change without prior notice.\n• Delivery charges, packaging charges, and platform fees (if any) will be displayed before order confirmation.\n• Accepted payment methods: UPI, Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, F&G Wallet, Cash on Delivery (where available).\n• Payment transactions are processed by secured third-party payment gateways. We do not store card details on our servers.\n• GST and other applicable taxes are charged as per current Government of India regulations.\n• Promotional pricing and coupon discounts cannot be combined unless explicitly stated.`,
  },
  {
    title: '6. Cancellation Policy',
    content: `• Orders may be cancelled by the customer before the merchant accepts the order — full refund will be processed.\n• Once a merchant has accepted the order, cancellation may not be possible. If permitted, a cancellation fee may apply.\n• Orders in "Out for Delivery" status cannot be cancelled.\n• We reserve the right to cancel orders in cases of: suspected fraud, incorrect pricing due to technical error, non-availability of delivery partners, or events of force majeure.\n• Frequent cancellations may result in temporary or permanent suspension of ordering privileges on the platform.`,
  },
  {
    title: '7. Refund Policy',
    content: `Refunds are issued in the following circumstances:\n• Missing items or wrong items delivered — full or partial refund after verification.\n• Order cancelled before merchant acceptance — full refund.\n• Order cancelled by merchant or F&G — full refund.\n• Food quality issues reported within 30 minutes of delivery with valid photo evidence — subject to investigation.\n\nRefund Timelines:\n• UPI / Net Banking / Wallets: 1–3 business days\n• Credit / Debit Card: 5–7 business days\n• F&G Wallet Credits: Instant (where offered as resolution)\n\nRefunds will NOT be issued for:\n• Change of mind after delivery\n• Incorrect address provided by customer leading to failed delivery\n• Items consumed partially before complaint\n• Late delivery where the item was delivered in acceptable condition`,
  },
  {
    title: '8. Delivery',
    content: `• Delivery is fulfilled by our network of independent delivery partners.\n• Delivery partners are independent contractors and not employees of F&G.\n• Delivery is available only to serviceable pin codes listed on the App.\n• We are not liable for delivery failures caused by incorrect address, inaccessible premises, or customer unavailability.\n• Risk of loss/damage of items passes to you upon delivery to the address provided.\n• During adverse weather conditions, natural disasters, public curfews, or similar events, deliveries may be delayed or unavailable.`,
  },
  {
    title: '9. F&G Pro Subscription',
    content: `• F&G Pro is an optional paid membership offering benefits such as free delivery, exclusive discounts, and priority support.\n• Subscription fees are charged monthly or annually as selected, and are non-refundable except as required by law.\n• Benefits are applicable only on eligible orders as defined in the Pro terms displayed in-app.\n• We reserve the right to modify Pro benefits, pricing, or discontinue the subscription with 30 days' notice.\n• Auto-renewal applies unless cancelled at least 24 hours before the renewal date.`,
  },
  {
    title: '10. User Conduct',
    content: `You agree NOT to:\n• Provide false, inaccurate, or misleading information\n• Use the App for any unlawful purpose\n• Attempt to gain unauthorized access to any part of the App\n• Post offensive, defamatory, or harmful content in reviews or communications\n• Place fraudulent or test orders\n• Abuse return/refund policies or engage in any fraudulent claim\n• Reverse-engineer, decompile, or attempt to extract the source code of the App\n• Use automated tools, bots, or scripts to interact with the App`,
  },
  {
    title: '11. Intellectual Property',
    content: `• The App, including all content, design, logos, trademarks, and software, is the exclusive property of ${COMPANY}.\n• All rights are reserved under applicable Indian and international intellectual property laws.\n• You are granted a limited, non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes.\n• Unauthorized reproduction, distribution, or modification of any content is strictly prohibited.\n• "F&G", the F&G logo, and associated marks are registered trademarks of the Company.`,
  },
  {
    title: '12. Third-Party Links & Services',
    content: `• The App may contain links to third-party websites or integrate with third-party payment services.\n• We have no control over and assume no responsibility for the content, privacy policies, or practices of third-party services.\n• Use of third-party services is governed by their respective terms and privacy policies.\n• Inclusion of any link does not imply endorsement by F&G.`,
  },
  {
    title: '13. Disclaimer of Warranties',
    content: `• THE APP AND ALL SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND.\n• WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE FROM VIRUSES.\n• WE ARE NOT RESPONSIBLE FOR THE QUALITY, NUTRITIONAL VALUE, HYGIENE STANDARDS, OR FSSAI COMPLIANCE OF FOOD PREPARED BY MERCHANT PARTNERS.\n• MERCHANT PARTNERS ARE SOLELY RESPONSIBLE FOR THE ACCURACY OF MENU DESCRIPTIONS, ALLERGEN INFORMATION, AND PRICING.`,
  },
  {
    title: '14. Limitation of Liability',
    content: `• TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, F&G SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.\n• OUR TOTAL AGGREGATE LIABILITY TO YOU SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY YOU FOR THE SPECIFIC ORDER GIVING RISE TO THE CLAIM.\n• NOTHING IN THESE TERMS EXCLUDES LIABILITY FOR DEATH OR PERSONAL INJURY CAUSED BY NEGLIGENCE, FRAUD, OR ANY LIABILITY THAT CANNOT BE EXCLUDED BY LAW.`,
  },
  {
    title: '15. Governing Law & Dispute Resolution',
    content: `• These Terms shall be governed by the laws of India.\n• Any disputes arising out of or in connection with these Terms shall first be attempted to be resolved through mutual negotiation within 30 days.\n• Unresolved disputes shall be subject to the exclusive jurisdiction of the courts in Hyderabad, Telangana, India.\n• For consumer disputes, you may also approach the National Consumer Helpline (1800-11-4000) or file a complaint on the Consumer Online Resource and Empowerment (CORE) Portal.`,
  },
  {
    title: '16. Modifications to Terms',
    content: `• We reserve the right to modify these Terms at any time.\n• Significant changes will be notified via in-app notification or registered email/SMS at least 7 days before they take effect.\n• Continued use of the App after the effective date constitutes acceptance of the revised Terms.\n• If you do not agree to the modified Terms, you must discontinue use of the App.`,
  },
  {
    title: '17. Termination',
    content: `• We may terminate or suspend your account and access to the App immediately, without prior notice or liability, for any reason including but not limited to breach of these Terms.\n• Upon termination, your right to use the App ceases immediately.\n• Provisions of these Terms that by their nature should survive termination shall survive (including Intellectual Property, Disclaimer, Limitation of Liability, Governing Law).`,
  },
  {
    title: '18. Grievance Redressal',
    content: `In accordance with the Information Technology Act, 2000 and the Consumer Protection (E-Commerce) Rules, 2020, a Grievance Officer has been appointed:\n\nGrievance Officer: ${GRIEVANCE_OFFICER}\nEmail: ${GRIEVANCE_EMAIL}\nAddress: ${ADDRESS}\nResponse Time: Acknowledgement within 48 hours, Resolution within 15 days as per applicable rules.\n\nFor general support:\nEmail: ${SUPPORT_EMAIL}\nApp: Help & Support section → Raise a Ticket`,
  },
];

export const TermsScreen = () => {
  const navigation = useNavigation<any>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (idx: number) => setExpanded(prev => prev === idx ? null : idx);

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>📋</Text>
          <Text style={styles.heroTitle}>Terms of Service</Text>
          <Text style={styles.heroSub}>Last updated: {LAST_UPDATED}</Text>
          <Text style={styles.heroCompany}>{COMPANY}</Text>
        </View>

        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Please read these Terms carefully before using the F&G app. These Terms constitute a legally binding agreement between you and F&G Technologies Private Limited. By using our app, you agree to these Terms.
          </Text>
        </View>

        {/* Sections — accordion */}
        <View style={styles.sectionsWrap}>
          {SECTIONS.map((section, idx) => (
            <View key={idx} style={styles.sectionCard}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggle(idx)}
                activeOpacity={0.7}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={styles.chevron}>{expanded === idx ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expanded === idx && (
                <View style={styles.sectionBody}>
                  <Text style={styles.sectionContent}>{section.content}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For any queries regarding these Terms, contact us at:
          </Text>
          <Text style={styles.footerEmail}>{SUPPORT_EMAIL}</Text>
          <Text style={styles.footerAddr}>{ADDRESS}</Text>
        </View>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  backArrow: { fontSize: 22, color: '#fff', fontWeight: '700' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  hero: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  heroIcon: { fontSize: 40, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginBottom: 2 },
  heroCompany: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  introCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF8EC',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent ?? '#F5A826',
  },
  introText: { fontSize: 13, color: '#5a3e00', lineHeight: 20 },
  sectionsWrap: { paddingHorizontal: 16, gap: 8 },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
    paddingRight: 8,
  },
  chevron: { fontSize: 11, color: theme.colors.text.secondary },
  sectionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  sectionContent: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 21,
    marginTop: 12,
  },
  footer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  footerText: { fontSize: 12, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 4 },
  footerEmail: { fontSize: 13, fontWeight: '700', color: theme.colors.primary, marginBottom: 4 },
  footerAddr: { fontSize: 11, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 17 },
});
