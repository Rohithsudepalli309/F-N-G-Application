import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useMemo, useState } from 'react';

export default function App() {
  const [refreshCount, setRefreshCount] = useState(0);
  const startedAt = useMemo(() => new Date().toLocaleTimeString(), []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>F and G Customer App</Text>
        <Text style={styles.subtitle}>Expo Managed Preview</Text>

        <Text style={styles.meta}>Started: {startedAt}</Text>
        <Text style={styles.meta}>Live updates: edit App.tsx in VS Code</Text>

        <Pressable style={styles.button} onPress={() => setRefreshCount((c) => c + 1)}>
          <Text style={styles.buttonText}>Tap check: {refreshCount}</Text>
        </Pressable>
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 24,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  title: {
    fontSize: 28,
    color: '#f8fafc',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: '600',
  },
  meta: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  buttonText: {
    textAlign: 'center',
    color: '#082f49',
    fontWeight: '700',
  },
});
