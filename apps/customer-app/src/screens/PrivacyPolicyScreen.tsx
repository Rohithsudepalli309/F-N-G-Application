/**
 * PrivacyPolicyScreen.tsx
 * F&G — Privacy Policy
 * Compliant with India's Digital Personal Data Protection Act 2023 (DPDPA),
 * IT Act 2000, and IT (Reasonable Security Practices) Rules 2011.
 */
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, Animated, Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const LAST_UPDATED = 'March 11, 2026';
const COMPANY = 'F&G Technologies Private Limited';
const ADDRESS = '4th Floor, Cyber Towers, Hitech City, Hyderabad – 500081, Telangana, India';
const GRIEVANCE_EMAIL = 'grievance@fngapp.in';
const PRIVACY_EMAIL = 'privacy@fngapp.in';
const SUPPORT_EMAIL = 'support@fngapp.in';
const DPO_NAME = 'Ms. Priya Sharma';

const SECTIONS = [
  {
    icon: '🏢',
    title: '1. Data Controller',
    content: `${COMPANY} ("F&G", "we", "our", "us") is the Data Fiduciary (Controller) for the personal data you provide while using the F&G mobile application.\n\nRegistered Address:\n${ADDRESS}\n\nData Protection Officer: ${DPO_NAME}\nEmail: ${PRIVACY_EMAIL}`,
  },
  {
    icon: '📱',
    title: '2. Data We Collect',
    content: `We collect the following categories of personal data:\n\n🔹 Identity & Contact Data\n• Full name, mobile number, email address\n• Date of birth (optional, for age-restricted products)\n• Profile photograph (optional)\n\n🔹 Location Data\n• Precise GPS location (for delivery accuracy and nearby restaurant discovery)\n• Saved addresses (home, work, and custom)\n• IP address and approximate location\n\n🔹 Order & Transaction Data\n• Order history, items purchased, merchant interactions\n• Payment method type (card last 4 digits, UPI ID masked)\n• Refund and cancellation history\n\n🔹 Device & Technical Data\n• Device model, OS version, unique device identifier (UDID/GAID)\n• App version, crash reports, performance logs\n• Push notification tokens\n\n🔹 Usage Data\n• App interaction patterns, search queries, screens visited\n• Time spent on app, features used\n• Referral source\n\n🔹 Communications\n• Support tickets, chat messages, feedback, ratings, reviews`,
  },
  {
    icon: '🎯',
    title: '3. Purpose of Data Processing',
    content: `We process your data for the following purposes:\n\n• Order Processing: To receive, confirm, prepare, track, and deliver your orders\n• Account Management: To create and maintain your user account and preferences\n• Payment Processing: To securely process payments and issue refunds\n• Customer Support: To respond to queries, resolve complaints, and provide assistance\n• Personalization: To recommend restaurants, offers, and items based on your preferences\n• Safety & Fraud Prevention: To detect and prevent fraudulent transactions and account misuse\n• Legal Compliance: To fulfill obligations under Indian law (GST, consumer protection, IT Act)\n• Marketing Communications: To send promotional offers, app updates (with your consent — you may opt out anytime)\n• Service Improvement: To analyze usage patterns, fix bugs, and improve app performance\n• Delivery Partner Coordination: To share your delivery address and contact with the assigned delivery partner for fulfillment`,
  },
  {
    icon: '⚖️',
    title: '4. Legal Basis for Processing',
    content: `Under the Digital Personal Data Protection Act, 2023 (DPDPA) and applicable law, we process your data on the following legal bases:\n\n• Consent: For marketing communications and optional data (profile photo, date of birth). You may withdraw consent at any time.\n• Contractual Necessity: To fulfill your orders and provide services you have requested.\n• Legal Obligation: To comply with tax laws (GST), consumer protection regulations, and court orders.\n• Legitimate Interests: For fraud prevention, platform security, and service improvement — always balanced against your rights.`,
  },
  {
    icon: '🤝',
    title: '5. Data Sharing & Disclosure',
    content: `We share your data only as necessary:\n\n🔹 Merchant Partners\nYour name, contact number, and delivery address are shared with the restaurant/store fulfilling your order.\n\n🔹 Delivery Partners\nYour name, phone number (masked), and delivery address are shared with the assigned delivery agent.\n\n🔹 Payment Processors\nPayment data is processed by PCI-DSS compliant third-party gateways (e.g., Razorpay, Cashfree). We do not store full card details.\n\n🔹 Technology Providers\nCloud hosting (AWS/GCP), analytics (Firebase), crash reporting (Sentry) — under strict data processing agreements.\n\n🔹 Legal Authorities\nWe may disclose data to law enforcement agencies, courts, or government bodies when required by law or to protect rights, property, or safety.\n\n🗫 We do NOT sell your personal data to third parties for their marketing purposes.`,
  },
  {
    icon: '🌍',
    title: '6. Data Storage & International Transfers',
    content: `• Your data is primarily stored on servers located in India.\n• Some service providers (e.g., analytics, cloud infrastructure) may process data outside India.\n• Any cross-border transfer is done only to countries that provide an adequate level of data protection, or under appropriate contractual safeguards (Standard Contractual Clauses).\n• Data at rest is encrypted using AES-256. Data in transit is encrypted using TLS 1.2 or higher.`,
  },
  {
    icon: '🔒',
    title: '7. Data Security',
    content: `We implement industry-standard security measures including:\n\n• End-to-end TLS encryption for all data transmissions\n• AES-256 encryption for data at rest\n• Two-factor authentication (OTP-based login)\n• Regular penetration testing and security audits\n• Strict access controls — employees access only data necessary for their role\n• Automatic session timeouts\n• PCI-DSS compliant payment handling\n\nDespite these measures, no internet transmission is 100% secure. In the event of a data breach, we will notify affected users and the Data Protection Board of India within 72 hours as required by law.`,
  },
  {
    icon: '⏳',
    title: '8. Data Retention',
    content: `We retain your personal data for as long as necessary to provide services and comply with legal obligations:\n\n• Account Data: Until account deletion + 3 years (for legal compliance)\n• Order & Transaction Data: 7 years (as required by GST and taxation laws)\n• Payment Data: As required by payment processors (typically 5 years)\n• Marketing Preferences: Until opt-out or account deletion\n• Support Communications: 2 years from resolution\n• Device & Usage Logs: 90 days (for security analysis)\n\nAfter the retention period, data is securely deleted or anonymized.`,
  },
  {
    icon: '👤',
    title: '9. Your Rights',
    content: `Under the Digital Personal Data Protection Act, 2023 and applicable Indian law, you have the following rights:\n\n✅ Right to Access\nRequest a copy of the personal data we hold about you.\n\n✅ Right to Correction\nRequest correction of inaccurate or incomplete personal data.\n\n✅ Right to Erasure ("Right to be Forgotten")\nRequest deletion of your personal data, subject to legal retention requirements.\n\n✅ Right to Data Portability\nReceive your data in a structured, commonly used format.\n\n✅ Right to Withdraw Consent\nWithdraw consent for any consent-based processing at any time (Settings → Privacy).\n\n✅ Right to Nominate\nNominate a person to exercise your rights in case of death or incapacity.\n\n✅ Right to Grievance Redressal\nFile a complaint with our Grievance Officer or the Data Protection Board of India.\n\nTo exercise your rights, contact: ${PRIVACY_EMAIL}\nWe will respond within 30 days as required by law.`,
  },
  {
    icon: '🍪',
    title: '10. Cookies & Tracking',
    content: `The F&G app uses the following tracking technologies:\n\n• Analytics SDKs (Firebase Analytics): To understand usage patterns and improve the app. This data is aggregated and anonymized.\n• Crash Reporting (Sentry/Crashlytics): To detect and fix technical errors. No personally identifiable content from your orders is captured in crash reports.\n• Push Notifications (FCM): To send order updates and promotional notifications. You can disable notifications in your device settings at any time.\n• Attribution SDKs: To measure app install campaigns and marketing effectiveness.\n\nYou can opt out of marketing analytics in Settings → Privacy → Data Preferences.`,
  },
  {
    icon: '👶',
    title: '11. Children\'s Privacy',
    content: `F&G is not intended for use by persons under the age of 18. We do not knowingly collect personal data from children under 18.\n\nIf we become aware that we have inadvertently collected personal data from a child under 18 without verifiable parental consent, we will take steps to delete such information promptly.\n\nIf you are a parent or guardian and believe your child has provided us personal data, please contact ${PRIVACY_EMAIL} immediately.`,
  },
  {
    icon: '🔗',
    title: '12. Third-Party Links',
    content: `The App may display links to third-party websites, payment services, or social media platforms. This Privacy Policy does not apply to such third-party services.\n\nWe encourage you to review the privacy policies of any third-party services you access through our App. We are not responsible for the privacy practices or content of third-party services.`,
  },
  {
    icon: '📣',
    title: '13. Marketing Communications',
    content: `We may send you:\n• Order confirmation and delivery updates (transactional — cannot be opted out while account is active)\n• Promotional offers, discounts, and new feature notifications (marketing — opt-in required, opt-out available at any time)\n• F&G Pro membership updates (if subscribed)\n\nTo opt out of marketing communications:\n• App: Profile → Settings → Notifications → Toggle off "Promotions"\n• Email: Click "Unsubscribe" in any marketing email\n• SMS: Reply STOP to any promotional SMS\n\nYou will still receive transactional messages related to your orders.`,
  },
  {
    icon: '🔄',
    title: '14. Changes to This Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law.\n\n• Material changes will be notified via in-app notification and email at least 7 days before they take effect.\n• The "Last Updated" date at the top of this page will always reflect the current version.\n• Continued use of the App after changes are effective constitutes your acceptance of the revised policy.\n• If we propose to change the purpose for which your data is processed in a material way, we will seek fresh consent.`,
  },
  {
    icon: '📬',
    title: '15. Grievance Officer & Contact',
    content: `In accordance with the Information Technology Act, 2000, IT (Intermediary Guidelines) Rules 2021, and the Digital Personal Data Protection Act 2023:\n\nGrievance / Data Protection Officer\nName: ${DPO_NAME}\nDesignation: Data Protection Officer & Grievance Officer\nEmail: ${GRIEVANCE_EMAIL}\nAddress: ${ADDRESS}\n\nResponse Time: Acknowledgement within 48 hours | Resolution within 15 days\n\nYou may also escalate unresolved complaints to the Data Protection Board of India once constituted under DPDPA 2023.\n\nFor general support:\nEmail: ${SUPPORT_EMAIL}\nIn-app: Profile → Help & Support`,
  },
];

export const PrivacyPolicyScreen = () => {
  const navigation = useNavigation<any>();
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (idx: number) => setExpanded(prev => prev === idx ? null : idx);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>🔐</Text>
          <Text style={styles.heroTitle}>Privacy Policy</Text>
          <Text style={styles.heroSub}>Last updated: {LAST_UPDATED}</Text>
          <Text style={styles.heroCompany}>{COMPANY}</Text>
        </View>

        {/* Intro */}
        <View style={styles.introCard}>
          <Text style={styles.introText}>
            Your privacy is important to us. This policy explains how F&G collects, uses, stores, shares, and protects your personal data in compliance with India's Digital Personal Data Protection Act 2023 (DPDPA) and other applicable laws.
          </Text>
        </View>

        {/* Quick Highlights */}
        <View style={styles.highlightsCard}>
          <Text style={styles.highlightsTitle}>🌟 Quick Highlights</Text>
          {[
            '✅ We never sell your data to third parties',
            '✅ Your payment card details are never stored by us',
            '✅ You can request data deletion at any time',
            '✅ Location is used only for delivery – never sold',
            '✅ OTP-only login – no password storage risk',
          ].map((item, i) => (
            <Text key={i} style={styles.highlightItem}>{item}</Text>
          ))}
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
                <Text style={styles.sectionIcon}>{section.icon}</Text>
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

        {/* Contact */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Questions about your privacy?</Text>
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${PRIVACY_EMAIL}`)}>
            <Text style={styles.footerEmail}>{PRIVACY_EMAIL}</Text>
          </TouchableOpacity>
          <Text style={styles.footerAddr}>{ADDRESS}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  introText: { fontSize: 13, color: '#1a3a22', lineHeight: 20 },
  highlightsCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  highlightsTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 10 },
  highlightItem: { fontSize: 13, color: theme.colors.text.secondary, lineHeight: 22 },
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
    alignItems: 'center',
    padding: 14,
  },
  sectionIcon: { fontSize: 18, marginRight: 10 },
  sectionTitle: {
    fontSize: 13,
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
  footerTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 6 },
  footerEmail: { fontSize: 14, fontWeight: '700', color: theme.colors.primary, marginBottom: 6 },
  footerAddr: { fontSize: 11, color: theme.colors.text.secondary, textAlign: 'center', lineHeight: 17 },
});
