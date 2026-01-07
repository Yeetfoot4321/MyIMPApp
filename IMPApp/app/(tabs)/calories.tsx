import { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import ProgressCircle from '@/components/ProgressCircle';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type CalorieItem = {
  id: string;
  name: string;
  calories: number;
};

export default function CaloriesScreen() {
  const insets = useSafeAreaInsets();

  const [logs, setLogs] = useState<CalorieItem[]>([]);
  const [totalToday, setTotalToday] = useState(0);
  const [maintenance, setMaintenance] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const email = auth.currentUser?.email;
    if (!email) return;

    const unsub = onSnapshot(doc(db, 'users', email), (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();
      const items = data.today?.items ?? [];

      setLogs(items);
      setTotalToday(items.reduce((sum: number, i: any) => sum + i.calories, 0));
      setMaintenance(data.profile?.bmr ?? null);
      setStreak(data.streak?.current ?? 0);
    });

    return unsub;
  }, []);

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: insets.top + 50 }, // ✅ SAFE AREA PADDING
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">Calories Log</ThemedText>

        {/* 🔥 STREAK */}
        <View style={styles.streakBox}>
          <ThemedText style={styles.fire}>🔥</ThemedText>
          <ThemedText type="defaultSemiBold">{streak} day streak</ThemedText>
        </View>
      </View>

      {/* Maintenance */}
      {maintenance !== null && (
        <ThemedText type="subtitle">
          Maintenance: {Math.round(maintenance)} kcal
        </ThemedText>
      )}

      {/* Total */}
      <ThemedText type="subtitle">
        Total Today: {totalToday} kcal
      </ThemedText>

      {/* Progress Circle */}
      {maintenance !== null && (
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <ProgressCircle
            radius={90}
            strokeWidth={14}
            current={totalToday}
            target={maintenance}
            color={
              totalToday > maintenance ? '#E53935' : '#4CAF50'
            }
          />
        </View>
      )}

      {/* Logs */}
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 8, marginTop: 12 }}
        renderItem={({ item }) => (
          <ThemedView style={styles.card}>
            <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
            <ThemedText>{item.calories} kcal</ThemedText>
          </ThemedView>
        )}
        ListEmptyComponent={
          <ThemedText>No calories logged today</ThemedText>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fire: {
    fontSize: 20,
  },
  card: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
});
