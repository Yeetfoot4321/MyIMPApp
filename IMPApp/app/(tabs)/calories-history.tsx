import { StyleSheet, FlatList, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { getUserData } from '@/lib/firestore';

type LogEntry = {
  id: string;
  name: string;
  calories: number;
  timestamp: number;
};

type DayData = {
  date: string;
  totalCalories: number;
  items: LogEntry[];
};

export default function CaloriesHistoryScreen() {
  const [history, setHistory] = useState<DayData[]>([]);
  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    const fetchHistory = async () => {
      if (!userEmail) return;
      try {
        const data = await getUserData(userEmail);
        if (data?.history) {
          setHistory(data.history.reverse()); // show latest first
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };
    fetchHistory();
  }, [userEmail]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Past Calories</ThemedText>

      <FlatList
        data={history}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ marginTop: 12 }}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        renderItem={({ item }) => {
          const manualTotal = item.items.reduce((sum, log) => sum + log.calories, 0);
          return (
            <ThemedView style={styles.dayCard}>
              <ThemedText type="defaultSemiBold">{item.date}</ThemedText>
              <ThemedText>Total: {manualTotal} kcal</ThemedText>
              {item.items.map((log) => (
                <ThemedView key={log.id} style={styles.logCard}>
                  <ThemedText>{log.name}</ThemedText>
                  <ThemedText>{log.calories} kcal</ThemedText>
                  <ThemedText style={styles.timestamp}>{new Date(log.timestamp).toLocaleString()}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>
          );
        }}
        ListEmptyComponent={<ThemedText>No past data available</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  dayCard: { padding: 12, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.05)' },
  logCard: { marginTop: 4, padding: 8, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.02)' },
  timestamp: { fontSize: 12, color: 'gray' },
});
