import { StyleSheet, FlatList, Pressable, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

/* ---------------- Types ---------------- */
type RedeemOption = {
  id: string;
  title: string;
  description: string;
  cost: number;
  image: any;
};

/* ---------------- Redeem Options ---------------- */
const REDEEM_OPTIONS: RedeemOption[] = [
  {
    id: 'simplygo',
    title: 'SimplyGo Credits',
    description: '$5 public transport credit',
    cost: 100,
    image: require('@/assets/rewards/simplygo.png'),
  },
  {
    id: 'fairprice',
    title: 'FairPrice Voucher',
    description: '$5 FairPrice voucher',
    cost: 120,
    image: require('@/assets/rewards/fairprice.png'),
  },
  {
    id: 'kopitiam',
    title: 'Kopitiam Voucher',
    description: '$5 Kopitiam voucher',
    cost: 100,
    image: require('@/assets/rewards/kopitiam.png'),
  },
  {
    id: 'community_chest',
    title: 'Community Chest Donation',
    description: 'Donate $5 to Community Chest',
    cost: 100,
    image: require('@/assets/rewards/community-chest.png'),
  },
  {
    id: 'sgh',
    title: 'SGH Needy Patients Fund',
    description: 'Donate $5 to SGH Needy Patients Fund',
    cost: 100,
    image: require('@/assets/rewards/sgh.png'),
  },
];

export default function PointsRedeemScreen() {
  const [points, setPoints] = useState(0);
  const userEmail = auth.currentUser?.email;

  useEffect(() => {
    const fetchPoints = async () => {
      if (!userEmail) return;

      const userRef = doc(db, 'users', userEmail);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setPoints(snap.data().points ?? 0);
      }
    };

    fetchPoints();
  }, [userEmail]);

  const handleRedeem = (option: RedeemOption) => {
    if (!userEmail) return;

    if (points < option.cost) {
      Alert.alert('Not enough points', 'Earn more points to redeem this reward.');
      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Redeem ${option.cost} points for ${option.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const userRef = doc(db, 'users', userEmail);
              await updateDoc(userRef, {
                points: points - option.cost,
              });

              setPoints((p) => p - option.cost);

              Alert.alert(
                'Success 🎉',
                `${option.title} redeemed successfully!`
              );
            } catch (err) {
              console.error('Redemption failed:', err);
              Alert.alert('Error', 'Failed to redeem points.');
            }
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Redeem Points</ThemedText>

      {/* Points Balance */}
      <ThemedView style={styles.pointsCard}>
        <ThemedText type="defaultSemiBold">Available Points</ThemedText>
        <ThemedText style={styles.pointsValue}>{points}</ThemedText>
      </ThemedView>

      {/* Redeem List */}
      <FlatList
        data={REDEEM_OPTIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 12 }}
        renderItem={({ item }) => {
          const disabled = points < item.cost;

          return (
            <ThemedView style={styles.optionCard}>
              <Image
                source={item.image}
                style={styles.rewardImage}
                contentFit="contain"
              />

              <ThemedView style={{ flex: 1 }}>
                <ThemedText type="defaultSemiBold">
                  {item.title}
                </ThemedText>
                <ThemedText>{item.description}</ThemedText>
                <ThemedText>{item.cost} points</ThemedText>
              </ThemedView>

              <Pressable
                style={[
                  styles.redeemButton,
                  disabled && styles.disabledButton,
                ]}
                disabled={disabled}
                onPress={() => handleRedeem(item)}
              >
                <ThemedText style={{ color: 'white' }}>
                  Redeem
                </ThemedText>
              </Pressable>
            </ThemedView>
          );
        }}
      />
    </ThemedView>
  );
}

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    flex: 1,
    padding: 16,
    gap: 16,
  },
  pointsCard: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(76,175,80,0.15)',
  },
  pointsValue: {
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 4,
  },
  optionCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    gap: 12,
  },
  rewardImage: {
    width: 48,
    height: 48,
  },
  redeemButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
});
