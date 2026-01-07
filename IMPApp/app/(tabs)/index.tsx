import { useState } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  Pressable,
  View,
  TextInput,
  Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useCalories } from '@/context/CaloriesContext';

/* ---------------- Types ---------------- */
type Nutriments = {
  'energy-kcal_100g'?: number;
  'energy-kcal_serving'?: number;
  proteins_100g?: number;
  proteins_serving?: number;
  fat_100g?: number;
  fat_serving?: number;
  carbohydrates_100g?: number;
  carbohydrates_serving?: number;
  sugars_100g?: number;
  sugars_serving?: number;
  salt_100g?: number;
  salt_serving?: number;
};

type Product = {
  product_name?: string;
  image_url?: string;
  nutriscore_grade?: string;
  serving_size?: string;
  nutriments?: Nutriments;
  brands?: string;
  ecoscore_grade?: string;
  labels_tags?: string[];
};

/* ---------------- Helpers ---------------- */
const parseServingGrams = (serving?: string): number | null => {
  if (!serving) return null;
  const match = serving.match(/([\d.]+)\s*g/i);
  return match ? parseFloat(match[1]) : null;
};

const getPerServing = (
  per100g?: number,
  perServing?: number,
  servingGrams?: number | null
) => {
  if (perServing !== undefined) return perServing;
  if (per100g !== undefined && servingGrams) {
    return (per100g * servingGrams) / 100;
  }
  return undefined;
};

/* ---------------- Screen ---------------- */
export default function HomeScreen() {
  const router = useRouter();
  const { addLog } = useCalories();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [greenScore, setGreenScore] = useState<string | null>(null);
  const [organicFarming, setOrganicFarming] = useState<boolean | null>(null);

  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCalories, setManualCalories] = useState('');

  /* ---------------- Fetch Product ---------------- */
  const fetchProduct = async (code: string) => {
    setLoading(true);
    setError(null);
    setProduct(null);
    setGreenScore(null);
    setOrganicFarming(null);

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${code}.json`
      );
      const data = await response.json();

      if (data.status === 1) {
        const prod: Product = data.product;
        setProduct(prod);

        // Green score
        setGreenScore(prod.ecoscore_grade?.toUpperCase() ?? null);

        // Organic farming label
        const labelsTags: string[] = prod.labels_tags ?? [];
        setOrganicFarming(labelsTags.includes('en:organic-farming'));
      } else {
        setError('Product not found');
      }
    } catch {
      setError('Failed to fetch product');
    } finally {
      setLoading(false);
      setScanning(false);
    }
  };

  /* ---------------- Barcode Handler ---------------- */
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!barcode) {
      setBarcode(data);
      fetchProduct(data);
    }
  };

  /* ---------------- Log Calories + Points ---------------- */
  const handleLogCalories = async () => {
    if (!product || !auth.currentUser?.email) return;

    const servingGrams = parseServingGrams(product.serving_size);
    const calories = getPerServing(
      product.nutriments?.['energy-kcal_100g'],
      product.nutriments?.['energy-kcal_serving'],
      servingGrams
    );

    if (!calories) return;

    const userEmail = auth.currentUser.email;
    const todayDate = new Date().toISOString().split('T')[0];

    addLog({
      name: product.product_name ?? 'Unknown product',
      calories: Math.round(calories),
    });

    try {
      const userRef = doc(db, 'users', userEmail);
      const docSnap = await getDoc(userRef);

      let points = docSnap.exists() ? docSnap.data().points || 0 : 0;
      let greenScore = docSnap.exists()
        ? docSnap.data().greenScore || { date: todayDate, redeemed: 0 }
        : { date: todayDate, redeemed: 0 };

      if (greenScore.date !== todayDate) {
        greenScore = { date: todayDate, redeemed: 0 };
      }

      // Check if the product is eligible for green points
      const greenEligible = greenScore.redeemed < 3; // Adjust this condition as needed
      if (greenEligible) {
        points += 1;
        greenScore.redeemed += 1;
      }

      // Log calories to today's data
      const todayData = docSnap.exists() ? docSnap.data().today || {} : {};
      if (todayData.date !== todayDate) {
        todayData.date = todayDate;
        todayData.items = [];
      }
      todayData.items = todayData.items || [];

      // Always add the item, allowing multiples of the same product
      todayData.items.push({
        id: Math.random().toString(),
        name: product.product_name ?? 'Unknown product',
        calories: Math.round(calories),
      });

      await setDoc(
        userRef,
        { today: todayData, points, greenScore },
        { merge: true }
      );

      console.log('Data successfully saved to Firestore'); // Debug log
    } catch (err) {
      console.error('Failed to log calories or points to Firestore:', err);
    }

    router.push('/(tabs)/calories');
  };

  /* ---------------- Manual Logging ---------------- */
  const handleManualLog = async () => {
    const name = manualName.trim();
    const calories = parseInt(manualCalories);
    if (!name || isNaN(calories) || !auth.currentUser?.email) return;

    const userEmail = auth.currentUser.email;

    addLog({ name, calories });

    try {
      const userRef = doc(db, 'users', userEmail);
      const docSnap = await getDoc(userRef);

      const todayDate = new Date().toISOString().split('T')[0];

      let todayData = docSnap.exists() ? docSnap.data().today || {} : {};
      if (todayData.date !== todayDate) {
        todayData = { date: todayDate, items: [] };
      }

      // Always add the item, allowing multiples of the same product
      todayData.items.push({
        id: Math.random().toString(),
        name,
        calories,
      });

      await setDoc(userRef, { today: todayData }, { merge: true });
    } catch (err) {
      console.error('Failed to log manual entry to Firestore:', err);
    }

    setManualName('');
    setManualCalories('');
    setShowManual(false);
    router.push('/(tabs)/calories');
  };

  if (!permission) return null;

  if (!permission.granted) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Camera permission required</ThemedText>
        <Pressable onPress={requestPermission} style={styles.button}>
          <ThemedText>Grant Permission</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (scanning) {
    return (
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      >
        <ThemedView style={styles.scanOverlay}>
          <ThemedText type="subtitle">Scan a barcode</ThemedText>
        </ThemedView>
      </CameraView>
    );
  }

  const headerImage = product?.image_url ? (
    <Image
      source={{ uri: product.image_url }}
      style={styles.headerImage}
      contentFit="contain"
    />
  ) : (
    <View style={styles.placeholderHeader} />
  );

  const nutriments = product?.nutriments;
  const servingGrams = parseServingGrams(product?.serving_size);
  const calories = getPerServing(
    nutriments?.['energy-kcal_100g'],
    nutriments?.['energy-kcal_serving'],
    servingGrams
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E6F4F1', dark: '#123A3A' }}
      headerImage={headerImage}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="title">Food Scanner</ThemedText>

        <Pressable
          style={styles.button}
          onPress={() => {
            setBarcode(null);
            setScanning(true);
          }}
        >
          <ThemedText>Scan Barcode</ThemedText>
        </Pressable>

        <Pressable style={styles.button} onPress={() => setShowManual(true)}>
          <ThemedText>Manual Entry</ThemedText>
        </Pressable>

        {loading && <ActivityIndicator size="large" />}
        {error && <ThemedText style={styles.error}>{error}</ThemedText>}

        {product && (
          <>
            <ThemedText type="subtitle">
              {product.product_name ?? 'Unknown product'}
            </ThemedText>

            <ThemedView style={styles.nutritionBox}>
              <ThemedText type="subtitle">
                Nutrition {servingGrams ? `(per ${servingGrams}g)` : '(per 100g)'}
              </ThemedText>

              <NutritionRow label="Calories" value={calories} unit="kcal" />
              <NutritionRow
                label="Protein"
                value={getPerServing(
                  nutriments?.proteins_100g,
                  nutriments?.proteins_serving,
                  servingGrams
                )}
                unit="g"
              />
              <NutritionRow
                label="Fat"
                value={getPerServing(
                  nutriments?.fat_100g,
                  nutriments?.fat_serving,
                  servingGrams
                )}
                unit="g"
              />
              <NutritionRow
                label="Carbs"
                value={getPerServing(
                  nutriments?.carbohydrates_100g,
                  nutriments?.carbohydrates_serving,
                  servingGrams
                )}
                unit="g"
              />
              <NutritionRow
                label="Sugar"
                value={getPerServing(
                  nutriments?.sugars_100g,
                  nutriments?.sugars_serving,
                  servingGrams
                )}
                unit="g"
              />
              <NutritionRow
                label="Salt"
                value={getPerServing(
                  nutriments?.salt_100g,
                  nutriments?.salt_serving,
                  servingGrams
                )}
                unit="g"
              />

              {greenScore && (
                <ThemedText style={{ marginTop: 8 }}>
                  Green Score: {greenScore}
                </ThemedText>
              )}

              {organicFarming !== null && (
                <ThemedText style={{ marginTop: 4 }}>
                  Organic Farming: {organicFarming ? '✅ Yes' : '❌ No'}
                </ThemedText>
              )}

              <Pressable
                style={[styles.button, { marginTop: 12 }]}
                onPress={handleLogCalories}
              >
                <ThemedText>Log Calories</ThemedText>
              </Pressable>
            </ThemedView>
          </>
        )}
      </ThemedView>

      <Modal visible={showManual} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="title" style={{ color: 'white' }}>
              Manual Entry
            </ThemedText>

            <TextInput
              placeholder="Food Name"
              value={manualName}
              onChangeText={setManualName}
              style={styles.input}
              placeholderTextColor="#ffffffff"
            />

            <TextInput
              placeholder="Calories"
              value={manualCalories}
              onChangeText={setManualCalories}
              style={styles.input}
              keyboardType="number-pad"
              placeholderTextColor="#ffffffff"
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowManual(false);
                  setManualName('');
                  setManualCalories('');
                }}
              >
                <ThemedText style={{ color: 'white' }}>Cancel</ThemedText>
              </Pressable>

              <Pressable style={styles.button} onPress={handleManualLog}>
                <ThemedText style={{ color: 'white' }}>Log Calories</ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ParallaxScrollView>
  );
}

/* ---------------- Components ---------------- */
function NutritionRow({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit: string;
}) {
  return (
    <ThemedView style={styles.row}>
      <ThemedText>{label}</ThemedText>
      <ThemedText type="defaultSemiBold">
        {value !== undefined ? `${value.toFixed(1)} ${unit}` : 'N/A'}
      </ThemedText>
    </ThemedView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  headerImage: { height: 200, width: '100%' },
  placeholderHeader: { height: 200, width: '100%' },
  nutritionBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    gap: 6,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  error: { color: 'red' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  scanOverlay: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: { width: '80%', padding: 20, borderRadius: 10, gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    color: 'white',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  cancelButton: { backgroundColor: '#ccc' },
});
