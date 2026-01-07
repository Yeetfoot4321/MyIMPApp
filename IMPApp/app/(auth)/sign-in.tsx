import { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // Attempt to sign in
      await signInWithEmailAndPassword(auth, email, password);

      // Check Firestore user document
      const docRef = doc(db, 'users', email);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Create Firestore doc if missing
        await setDoc(docRef, {
          profile: { weightGoal: null, bmr: null },
          today: { date: new Date().toISOString().split('T')[0], items: [] },
        });
      }

      // Check if profile is complete
      const userData = docSnap.exists() ? docSnap.data() : { profile: { bmr: null } };
      if (userData.profile?.bmr == null) {
        router.replace('../(auth)/user-info');
      } else {
        router.replace('../(tabs)/index');
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        // Auto-signup only if user doesn't exist
        try {
          await createUserWithEmailAndPassword(auth, email, password);

          await setDoc(doc(db, 'users', email), {
            profile: { weightGoal: null, bmr: null },
            today: { date: new Date().toISOString().split('T')[0], items: [] },
          });

          router.replace('../(auth)/user-info');
        } catch (signupErr: any) {
          setError('Auto-signup failed: ' + signupErr.message);
        }
      } else {
        // Any other error (invalid password, email, etc.)
        setError('Sign in failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title">Sign In / Sign Up</ThemedText>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor="#999"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
        placeholderTextColor="#999"
      />

      <Pressable onPress={handleSignIn} style={styles.button} disabled={loading}>
        <ThemedText style={{ color: 'white' }}>Continue</ThemedText>
      </Pressable>

      {loading && <ActivityIndicator size="large" style={{ marginTop: 12 }} />}
      {error && <ThemedText style={{ color: 'red', marginTop: 12 }}>{error}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'black',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
});
