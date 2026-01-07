import { StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';


const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.spoonacular.com/recipes/random?number=3&includeNutrition=true&apiKey=${API_KEY}`
      );
      const json = await res.json();
      setRecipes(json.recipes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refreshRecipes = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
        <ThemedText>Loading recipes...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Refresh Button */}
      <Pressable style={styles.button} onPress={refreshRecipes} disabled={refreshing}>
        <ThemedText style={styles.buttonText}>
          {refreshing ? 'Refreshing...' : 'Refresh 3 Recipes'}
        </ThemedText>
      </Pressable>

      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ gap: 16, paddingTop: 12 }}
        renderItem={({ item }) => (
          <Pressable
                onPress={() => router.push(`/(tabs)/recipes/[id]?id=${item.id}`)}
                >
                <ThemedView style={styles.card}>
                    <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" />
                    <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                    <ThemedText>Servings: {item.servings}</ThemedText>
                    <ThemedText style={styles.cost}>
                    Estimated cost: ${(item.pricePerServing / 100 * item.servings).toFixed(2)}
                    </ThemedText>
                </ThemedView>
                </Pressable>

        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: '#000' }, // black background
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 6,
  },
  image: { width: '100%', height: 180, borderRadius: 12 },
  cost: { fontWeight: 'bold', color: '#fff' },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
