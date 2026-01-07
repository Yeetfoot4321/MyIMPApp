import { ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [recipe, setRecipe] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      const url = `https://api.spoonacular.com/recipes/${id}/information?includeNutrition=true&apiKey=${API_KEY}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      if (!json || !json.title) throw new Error('Invalid recipe data');
      setRecipe(json);
    } catch (err: any) {
      console.error('Recipe fetch failed:', err);
      setError('Failed to load recipe details');
    } finally {
      setLoading(false);
    }
  };

  const handleLogCalories = async () => {
    if (!recipe || !auth.currentUser?.email) return;

    const calories = recipe.nutrition?.nutrients?.find(
      (n: any) => n.name.toLowerCase() === 'calories'
    )?.amount;

    if (!calories) return;

    setSaving(true);

    try {
      const userEmail = auth.currentUser.email;
      const userRef = doc(db, 'users', userEmail);
      const docSnap = await getDoc(userRef);

      const todayDate = new Date().toISOString().split('T')[0];
      let todayData = docSnap.exists() ? docSnap.data().today || {} : {};
      if (todayData.date !== todayDate) todayData = { date: todayDate, items: [] };

      const alreadyLogged = todayData.items.some(
        (item: any) => item.name === recipe.title
      );

      if (!alreadyLogged) {
        todayData.items.push({
          id: Math.random().toString(),
          name: recipe.title,
          calories: Math.round(calories),
        });

        await setDoc(userRef, { today: todayData }, { merge: true });
      }

      router.push('/(tabs)/calories'); // navigate to calories page
    } catch (err) {
      console.error('Failed to log calories:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
        <ThemedText>Loading recipe...</ThemedText>
      </ThemedView>
    );
  }

  if (error || !recipe) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>{error ?? 'Recipe not available'}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ gap: 8 }}>
        <Image source={{ uri: recipe.image }} style={styles.image} contentFit="cover" />

        <ThemedText type="title">{recipe.title}</ThemedText>

        <ThemedText type="subtitle" style={{ marginTop: 16 }}>
          Ingredients
        </ThemedText>
        {recipe.extendedIngredients?.map((ing: any, index: number) => (
          <ThemedText key={`${ing.id}-${index}`}>• {ing.original}</ThemedText>
        ))}

        <ThemedText type="subtitle" style={{ marginTop: 16 }}>
          Instructions
        </ThemedText>
        {recipe.analyzedInstructions?.length > 0 ? (
          recipe.analyzedInstructions[0].steps.map((step: any) => (
            <ThemedText key={step.number}>
              {step.number}. {step.step}
            </ThemedText>
          ))
        ) : (
          <ThemedText>No instructions available.</ThemedText>
        )}

        {/* Log Calories Button */}
        <Pressable style={styles.button} onPress={handleLogCalories} disabled={saving}>
          <ThemedText style={{ color: 'white', textAlign: 'center' }}>
            {saving ? 'Logging...' : 'Log Calories'}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // black background
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 16,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    alignSelf: 'stretch',
  },
});
