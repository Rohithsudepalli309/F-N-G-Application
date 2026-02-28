/**
 * OnboardingScreen.tsx
 * Spec §5.2.1 — 3 slides, dot nav, skip button, AsyncStorage flag.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Groceries in\n30 Minutes',
    subtitle: 'Fresh fruits, vegetables, dairy and more — delivered lightning-fast to your door.',
    bg: theme.colors.primary,
    accent: theme.colors.accent,
    emoji: '🛒',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop',
  },
  {
    id: '2',
    title: 'Food Delivery\nUnder 25 Mins',
    subtitle: 'Your favourite restaurants. Real-time tracking. Hot food, every time.',
    bg: '#1A4D2E',
    accent: theme.colors.accent2,
    emoji: '🍛',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop',
  },
  {
    id: '3',
    title: 'Track Every\nStep Live',
    subtitle: 'Watch your delivery agent navigate to you on a live map. Always in the know.',
    bg: '#112B1E',
    accent: theme.colors.accent3,
    emoji: '📍',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&auto=format&fit=crop',
  },
];

export const OnboardingScreen = () => {
  const navigation = useNavigation<any>();
  const flatRef = useRef<FlatList>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const markSeenAndNavigate = async () => {
    await AsyncStorage.setItem('fng_onboarding_seen', 'true');
    navigation.replace('Login');
  };

  const handleNext = () => {
    if (activeIdx < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: activeIdx + 1 });
    } else {
      markSeenAndNavigate();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={SLIDES[activeIdx].bg} />

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={markSeenAndNavigate}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Slides */}
      <Animated.FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => {
          setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { backgroundColor: item.bg }]}>
            <View style={styles.imageWrap}>
              <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
              <View style={styles.imageOverlay} />
              <Text style={styles.emoji}>{item.emoji}</Text>
            </View>
            <View style={styles.textBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, idx) => {
          const inputRange = [(idx - 1) * width, idx * width, (idx + 1) * width];
          const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
          const opacity   = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
          return (
            <Animated.View
              key={idx}
              style={[styles.dot, { width: dotWidth, opacity, backgroundColor: SLIDES[activeIdx].accent }]}
            />
          );
        })}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaBtn, { backgroundColor: SLIDES[activeIdx].accent }]}
        onPress={handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>
          {activeIdx === SLIDES.length - 1 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: 'absolute', top: 52, right: 24, zIndex: 10, padding: 8 },
  skipText: { color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: '600' },
  slide: { width, flex: 1 },
  imageWrap: { width, height: height * 0.52, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: 'transparent',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  emoji: {
    position: 'absolute',
    bottom: 20,
    right: 24,
    fontSize: 56,
  },
  textBlock: { paddingHorizontal: 28, paddingTop: 32 },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 12,
    lineHeight: 24,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 28, gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  ctaBtn: {
    marginHorizontal: 24,
    marginTop: 20,
    height: 54,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.orange,
  },
  ctaText: { fontSize: 17, fontWeight: '800', color: theme.colors.primary },
});
