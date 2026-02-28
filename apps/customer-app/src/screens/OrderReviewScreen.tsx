/**
 * OrderReviewScreen.tsx
 * Spec §8.1 #16 — Rate food quality and delivery experience.
 * POST /api/orders/:id/rate  → { foodRating, deliveryRating, comment }
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView,
  TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { api } from '../services/api';
import { theme } from '../theme';

const StarRow = ({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) => (
  <View style={styles.starSection}>
    <Text style={styles.starLabel}>{label}</Text>
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7}>
          <Text style={[styles.star, n <= value && styles.starFilled]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
    <Text style={styles.starHint}>
      {value === 0 ? 'Tap to rate' : ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][value]}
    </Text>
  </View>
);

const QUICK_TAGS_FOOD = ['Fresh & Hot', 'Tasty', 'Large Portion', 'Value for Money', 'Authentic', 'Perfectly Cooked'];
const QUICK_TAGS_DELIVERY = ['Fast Delivery', 'Friendly Agent', 'On Time', 'Safe Packaging', 'Professional', 'Real-time Updates'];

export const OrderReviewScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { orderId } = (route.params as { orderId: string }) || {};

  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedFoodTags, setSelectedFoodTags] = useState<string[]>([]);
  const [selectedDeliveryTags, setSelectedDeliveryTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string, isFoodTag: boolean) => {
    if (isFoodTag) {
      setSelectedFoodTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);
    } else {
      setSelectedDeliveryTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag]);
    }
  };

  const handleSubmit = async () => {
    if (foodRating === 0 || deliveryRating === 0) {
      Alert.alert('Please rate', 'Kindly provide both food and delivery ratings.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/orders/${orderId}/rate`, {
        foodRating,
        deliveryRating,
        comment,
        tags: [...selectedFoodTags, ...selectedDeliveryTags],
      });
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'MainTabs' }] })
      );
      Alert.alert('Thank you! 🙏', 'Your feedback helps us improve.');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Your Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scroll}
      >
        <Text style={styles.topCaption}>Your feedback makes F&G better for everyone</Text>

        {/* Food Rating */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🍛 Food Quality</Text>
          <StarRow label="How was the food?" value={foodRating} onChange={setFoodRating} />
          <View style={styles.tagsWrap}>
            {QUICK_TAGS_FOOD.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selectedFoodTags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag, true)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tagText, selectedFoodTags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delivery Rating */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛵 Delivery Experience</Text>
          <StarRow label="How was the delivery?" value={deliveryRating} onChange={setDeliveryRating} />
          <View style={styles.tagsWrap}>
            {QUICK_TAGS_DELIVERY.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selectedDeliveryTags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag, false)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tagText, selectedDeliveryTags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Written review */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 Additional Comments (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Tell us more about your experience…"
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>Submit Review</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
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
  topCaption: { fontSize: 14, color: theme.colors.text.secondary, textAlign: 'center', marginBottom: 20 },

  card: {
    backgroundColor: theme.colors.surface, borderRadius: 16, padding: 18,
    marginBottom: 14, borderWidth: 1, borderColor: theme.colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 14 },

  starSection: { alignItems: 'center', marginBottom: 16 },
  starLabel: { fontSize: 14, color: theme.colors.text.secondary, marginBottom: 10 },
  starsRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 38, color: '#D1D5DB' },
  starFilled: { color: '#F5A826' },
  starHint: { fontSize: 13, color: theme.colors.text.secondary, marginTop: 6, fontWeight: '600' },

  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1.5, borderColor: theme.colors.border, backgroundColor: theme.colors.background,
  },
  tagActive: { borderColor: '#163D26', backgroundColor: '#163D2610' },
  tagText: { fontSize: 13, color: theme.colors.text.secondary, fontWeight: '500' },
  tagTextActive: { color: '#163D26', fontWeight: '700' },

  textInput: {
    borderWidth: 1.5, borderColor: theme.colors.border, borderRadius: 12,
    padding: 14, fontSize: 14, color: theme.colors.text.primary,
    textAlignVertical: 'top', minHeight: 100, backgroundColor: theme.colors.background,
  },
  charCount: { fontSize: 11, color: theme.colors.text.secondary, textAlign: 'right', marginTop: 4 },

  submitBtn: {
    backgroundColor: '#F5A826', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: '#F5A826', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28, shadowRadius: 12, elevation: 6,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipText: { color: theme.colors.text.secondary, fontSize: 14, textDecorationLine: 'underline' },
});
