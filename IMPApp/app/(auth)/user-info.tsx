import { useState } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function UserInfoScreen() {
  const router = useRouter();
  const userEmail = auth.currentUser?.email;

  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activity, setActivity] = useState(1.2); // sedentary
  const [weightGoal, setWeightGoal] = useState(''); // target weight
  const [goalType, setGoalType] = useState<'maintain' | 'lose_0.5kg' | 'lose_1kg' | 'gain'>(
    'maintain'
  );

  const handleSubmit = async () => {
    if (!userEmail) return;

    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseInt(age);
    const goalW = parseFloat(weightGoal);

    if (!w || !h || !a) return;

    // Mifflin–St Jeor BMR
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    // Maintenance calories
    let maintenance = bmr * activity;

    // Adjust calories based on goal
    if (goalType === 'lose_0.5kg') maintenance -= 500;
    else if (goalType === 'lose_1kg') maintenance -= 1000;
    else if (goalType === 'gain') maintenance += 300;

    try {
      const userRef = doc(db, 'users', userEmail);
      await updateDoc(userRef, {
        profile: {
          age: a,
          gender,
          weight: w,
          height: h,
          activity,
          weightGoal: goalW || null,
          bmr: maintenance,
          goalType,
        },
      });

      router.replace('../(tabs)/index'); // go to main app
    } catch (err) {
      console.error('Error saving user info:', err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <ThemedText type="title" style={{ color: 'black' }}>
          Enter Your Info
        </ThemedText>

        <TextInput
          placeholder="Age"
          keyboardType="number-pad"
          value={age}
          onChangeText={setAge}
          style={styles.input}
          placeholderTextColor="gray"
        />
        <TextInput
          placeholder="Weight (kg)"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
          style={styles.input}
          placeholderTextColor="gray"
        />
        <TextInput
          placeholder="Height (cm)"
          keyboardType="decimal-pad"
          value={height}
          onChangeText={setHeight}
          style={styles.input}
          placeholderTextColor="gray"
        />
        <TextInput
          placeholder="Target Weight (kg)"
          keyboardType="decimal-pad"
          value={weightGoal}
          onChangeText={setWeightGoal}
          style={styles.input}
          placeholderTextColor="gray"
        />

        <ThemedText style={{ color: 'black' }}>Gender</ThemedText>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={gender}
            onValueChange={(val) => setGender(val as 'male' | 'female')}
            style={{ color: 'black' }}
            itemStyle={{ color: 'black' }}
          >
            <Picker.Item label="Male" value="male" />
            <Picker.Item label="Female" value="female" />
          </Picker>
        </View>

        <ThemedText style={{ color: 'black' }}>Activity Level</ThemedText>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={activity}
            onValueChange={(val) => setActivity(val as number)}
            style={{ color: 'black' }}
            itemStyle={{ color: 'black' }}
          >
            <Picker.Item label="Sedentary (little/no exercise)" value={1.2} />
            <Picker.Item label="Lightly active (1-3x/week)" value={1.375} />
            <Picker.Item label="Moderately active (3-5x/week)" value={1.55} />
            <Picker.Item label="Very active (6-7x/week)" value={1.725} />
            <Picker.Item label="Extra active (very hard work)" value={1.9} />
          </Picker>
        </View>

        <ThemedText style={{ color: 'black' }}>Goal Type</ThemedText>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={goalType}
            onValueChange={(val) =>
              setGoalType(val as 'maintain' | 'lose_0.5kg' | 'lose_1kg' | 'gain')
            }
            style={{ color: 'black' }}
            itemStyle={{ color: 'black' }}
          >
            <Picker.Item label="Maintain Weight" value="maintain" />
            <Picker.Item label="Lose 0.5 kg/week" value="lose_0.5kg" />
            <Picker.Item label="Lose 1 kg/week" value="lose_1kg" />
            <Picker.Item label="Gain Weight" value="gain" />
          </Picker>
        </View>

        <Pressable style={styles.button} onPress={handleSubmit}>
          <ThemedText style={{ color: 'white' }}>Save</ThemedText>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    color: 'black',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
});
