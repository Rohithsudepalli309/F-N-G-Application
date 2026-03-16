import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

type TabKey = 'home' | 'search' | 'orders' | 'profile';

interface CardData {
  title: string;
  subtitle: string;
  tag: string;
}

const TABS: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'search', label: 'Search', icon: '🔎' },
  { key: 'orders', label: 'Orders', icon: '📦' },
  { key: 'profile', label: 'Profile', icon: '👤' },
];

const CARD_MAP: Record<TabKey, CardData[]> = {
  home: [
    { title: 'Burger Hub', subtitle: 'Delivery in 25 min', tag: 'Top Rated' },
    { title: 'Fresh Basket', subtitle: 'Groceries in 18 min', tag: 'Best Price' },
    { title: 'Quick Bites', subtitle: 'Snacks and drinks', tag: 'Late Night' },
  ],
  search: [
    { title: 'Pizza', subtitle: '124 results near you', tag: 'Popular' },
    { title: 'Biryani', subtitle: '89 results near you', tag: 'Trending' },
    { title: 'Ice Cream', subtitle: '43 results near you', tag: 'Desserts' },
  ],
  orders: [
    { title: 'Order #FG1042', subtitle: 'Out for delivery', tag: 'Live' },
    { title: 'Order #FG1038', subtitle: 'Delivered yesterday', tag: 'Completed' },
    { title: 'Order #FG1030', subtitle: 'Cancelled', tag: 'Issue' },
  ],
  profile: [
    { title: 'Saved Addresses', subtitle: 'Home, Work', tag: '2 saved' },
    { title: 'Payment Methods', subtitle: 'UPI, Card, COD', tag: 'Configured' },
    { title: 'Support', subtitle: 'Chat and call support', tag: '24/7' },
  ],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const startedAt = useMemo(() => new Date().toLocaleTimeString(), []);

  const cards = CARD_MAP[activeTab];
  const activeTabLabel = TABS.find((tab) => tab.key === activeTab)?.label ?? 'Home';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>F and G Customer App</Text>
        <Text style={styles.subtitle}>Expo Managed Preview · {activeTabLabel}</Text>
        <Text style={styles.meta}>Live hot reload active from App.tsx · Started {startedAt}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {cards.map((card) => (
          <View key={card.title} style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{card.tag}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Open</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: 56,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  title: {
    fontSize: 24,
    color: '#f8fafc',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#38bdf8',
    fontWeight: '600',
  },
  meta: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: 16,
  },
  cardSubtitle: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  tagPill: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '600',
  },
  actionButton: {
    marginTop: 4,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#082f49',
    fontWeight: '700',
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    backgroundColor: '#0b1220',
    paddingVertical: 10,
    paddingBottom: 20,
  },
  tabButton: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: '#1e293b',
  },
  tabIcon: {
    fontSize: 16,
    opacity: 0.8,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  tabLabelActive: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
});
