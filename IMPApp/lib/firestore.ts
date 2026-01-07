import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

export const saveUserData = async (userId: string, totalCalories: number, items: any[]) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const userRef = doc(db, 'users', userId);

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      const currentStreak = data.streak?.current ?? 0;
      let newStreak = currentStreak;
      if (data.today?.date !== today) {
        // Move yesterday’s data to history
        if (data.today) {
          await updateDoc(userRef, {
            history: arrayUnion(data.today),
          });
          // Update streak based on yesterday
          if (data.today.totalCalories > 0) {
            newStreak = currentStreak + 1;
          } else {
            newStreak = 0;
          }
        }
        // Reset today
        await setDoc(
          userRef,
          { today: { date: today, totalCalories: 0, items: [] } },
          { merge: true }
        );
      } else {
        // Same day: if this is the first log of the day, update streak
        if (data.today?.totalCalories === 0 && totalCalories > 0) {
          newStreak = currentStreak + 1;
        }
      }

      // Update today’s logs
      await updateDoc(userRef, {
        today: { date: today, totalCalories, items },
        streak: { current: newStreak },
      });
    } else {
      // First-time user → create document
      const initialStreak = totalCalories > 0 ? 1 : 0;
      await setDoc(userRef, {
        today: { date: today, totalCalories, items },
        history: [],
        streak: { current: initialStreak },
      });
    }
  } catch (err) {
    console.error('Failed to save user data:', err);
    throw err;
  }
};

export const getUserData = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch user data:', err);
    throw err;
  }
};
