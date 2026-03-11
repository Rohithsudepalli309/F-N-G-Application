import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'Home', label: 'Home', icon: '🏠', activeIcon: '🏠' },
  { id: 'Categories', label: 'Categories', icon: '⊞', activeIcon: '⊞' },
  { id: 'BuyAgain', label: 'Buy Again', icon: '👜', activeIcon: '👜' },
  { id: 'Fresh', label: 'Fresh', icon: '🚚', activeIcon: '🚚' },
];

export const BottomTabs = ({ activeTab }: { activeTab: string }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => (navigation as any).navigate(tab.id)}
          >
            <Text style={[styles.icon, isActive && styles.activeIcon]}>
              {isActive ? tab.activeIcon : tab.icon}
            </Text>
            <Text style={[styles.label, isActive && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 80,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  icon: {
    fontSize: 24,
    color: '#999',
    marginBottom: 4,
  },
  activeIcon: {
    color: theme.colors.primary,
  },
  label: {
    fontSize: 10,
    color: '#999',
    fontFamily: theme.typography.fontFamily.medium,
  },
  activeLabel: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
  brandTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoBox: {
    backgroundColor: '#004A99',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  brandLogoText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    fontStyle: 'italic',
  }
});
