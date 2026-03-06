import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * Shows a dismissible "No internet connection" banner at the top of the screen
 * whenever the device goes offline, and a brief "Back online" confirmation when
 * connectivity is restored.
 */
export const OfflineBanner = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [showOnline, setShowOnline] = useState(false);
  const translateY = useRef(new Animated.Value(-60)).current;
  const prevConnected = useRef<boolean | null>(true);

  const slideIn = () => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  };

  const slideOut = (onDone?: () => void) => {
    Animated.timing(translateY, {
      toValue: -60,
      duration: 300,
      useNativeDriver: true,
    }).start(onDone);
  };

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;

      if (prevConnected.current === true && !online) {
        // went offline
        setIsConnected(false);
        setShowOnline(false);
        slideIn();
      } else if (prevConnected.current === false && online) {
        // came back online
        setIsConnected(true);
        setShowOnline(true);
        slideIn();
        // auto-dismiss after 2 s
        const t = setTimeout(() => {
          slideOut(() => setShowOnline(false));
        }, 2000);
        return () => clearTimeout(t);
      }

      prevConnected.current = online;
    });

    return unsubscribe;
  }, []);

  if (isConnected && !showOnline) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        showOnline ? styles.onlineBanner : styles.offlineBanner,
        { transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>
        {showOnline ? '✓  Back online' : '⚠  No internet connection'}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineBanner: {
    backgroundColor: '#C0392B',
  },
  onlineBanner: {
    backgroundColor: '#27AE60',
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
