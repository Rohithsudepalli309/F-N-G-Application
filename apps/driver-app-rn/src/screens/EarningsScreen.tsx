/**
 * EarningsScreen.tsx — Driver earnings summary.
 * Fetches from GET /driver/earnings?period=today|week|month
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../services/api';

type Period = 'today' | 'week' | 'month';

interface EarningsSummary {
  period:         Period;
  totalPayout:    number;
  deliveries:     number;
  avgPerDelivery: number;
  totalKm:        number;
}

export default function EarningsScreen(): React.JSX.Element {
  const [period, setPeriod]     = useState<Period>('today');
  const [summary, setSummary]   = useState<EarningsSummary | null>(null);
  const [loading, setLoading]   = useState(false);

  const fetchEarnings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get<{earnings: EarningsSummary}>(`/driver/earnings?period=${period}`);
      setSummary(res.data.earnings);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const PERIODS: Period[] = ['today', 'week', 'month'];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchEarnings} tintColor="#F97316" />
      }>
      <Text style={styles.title}>Earnings</Text>

      {/* ── Period selector ── */}
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodActive]}
            onPress={() => setPeriod(p)}
            accessibilityRole="button">
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !summary ? (
        <ActivityIndicator style={styles.spinner} color="#F97316" />
      ) : summary ? (
        <>
          {/* ── Earnings card ── */}
          <View style={styles.bigCard}>
            <Text style={styles.bigLabel}>Total Earned</Text>
            <Text style={styles.bigAmount}>
              ₹{(summary.totalPayout / 100).toFixed(0)}
            </Text>
          </View>

          {/* ── Stats row ── */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summary.deliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                ₹{summary.deliveries > 0 ? (summary.avgPerDelivery / 100).toFixed(0) : '0'}
              </Text>
              <Text style={styles.statLabel}>Per Delivery</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{summary.totalKm.toFixed(1)}</Text>
              <Text style={styles.statLabel}>Km Covered</Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No earnings data available.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       {flex: 1, backgroundColor: '#F9FAFB'},
  content:         {padding: 16},
  title:           {fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16},
  periodRow:       {flexDirection: 'row', gap: 8, marginBottom: 20},
  periodBtn:       {flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center'},
  periodActive:    {backgroundColor: '#F97316'},
  periodText:      {fontSize: 13, fontWeight: '500', color: '#6B7280'},
  periodTextActive:{color: '#fff'},
  spinner:         {marginTop: 60},
  bigCard:         {backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8},
  bigLabel:        {fontSize: 13, color: '#9CA3AF', marginBottom: 4},
  bigAmount:       {fontSize: 48, fontWeight: '800', color: '#16A34A'},
  statsRow:        {flexDirection: 'row', gap: 8},
  statCard:        {flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4},
  statValue:       {fontSize: 20, fontWeight: '700', color: '#111827'},
  statLabel:       {fontSize: 11, color: '#9CA3AF', marginTop: 2, textAlign: 'center'},
  empty:           {alignItems: 'center', marginTop: 60},
  emptyText:       {fontSize: 14, color: '#9CA3AF'},
});
