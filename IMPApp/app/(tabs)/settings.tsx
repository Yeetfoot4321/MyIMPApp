import { Pressable, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SettingsScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/(auth)/sign-in');
  };

  return (
    <ThemedView style={styles.container}>
      <Pressable style={styles.button} onPress={handleSignOut}>
        <ThemedText style={{ color: 'white' }}>Sign Out</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  button: { backgroundColor: '#F44336', padding: 12, borderRadius: 8 },
});
