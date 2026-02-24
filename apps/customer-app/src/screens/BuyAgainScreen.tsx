import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { BottomTabs } from '../components/BottomTabs';
import { theme } from '../theme';

export const BuyAgainScreen = () => (
  <SafeAreaView style={styles.root}>
    <View style={styles.content}>
      <Text style={styles.icon}>👜</Text>
      <Text style={styles.title}>Buy Again</Text>
      <Text style={styles.subtitle}>Your favorite items will appear here.</Text>
    </View>
    <BottomTabs activeTab="BuyAgain" />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: '#000' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10 },
});
