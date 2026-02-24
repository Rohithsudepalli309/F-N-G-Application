import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { BottomTabs } from '../components/BottomTabs';
import { theme } from '../theme';

export const FreshScreen = () => (
  <SafeAreaView style={styles.root}>
    <View style={styles.content}>
      <Text style={styles.icon}>🥦</Text>
      <Text style={styles.title}>Fresh Items</Text>
      <Text style={styles.subtitle}>Farm fresh produce delivered in minutes.</Text>
    </View>
    <BottomTabs activeTab="Fresh" />
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  icon: { fontSize: 64, marginBottom: 20 },
  title: { fontSize: 24, fontFamily: theme.typography.fontFamily.bold, color: '#000' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10 },
});
