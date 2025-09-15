import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { database, DailyCheckIn } from '../utils/database';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

type EnergyLevel = 'low' | 'medium' | 'high';
type MoodTone = 'sad' | 'calm' | 'happy';

interface MoodState {
  label: string;
  color: string;
}

const getMoodState = (energy: EnergyLevel, tone: MoodTone): MoodState => {
  const moodStates: Record<string, MoodState> = {
    'low-sad': { label: 'Melancholy', color: '#BBDEFB' }, // Darker blue
    'low-calm': { label: 'Serene', color: '#F3E5F5' }, // Light purple
    'low-happy': { label: 'Content', color: '#E8F5E8' }, // Light green
    'medium-sad': { label: 'Somber', color: '#FFF3E0' }, // Light orange
    'medium-calm': { label: 'Balanced', color: '#E8F4F8' }, // Light blue-gray
    'medium-happy': { label: 'Cheerful', color: '#FFF8E1' }, // Light yellow
    'high-sad': { label: 'Restless', color: '#FFEBEE' }, // Light red
    'high-calm': { label: 'Focused', color: '#F3E5F5' }, // Light purple
    'high-happy': { label: 'Excited', color: '#E8F5E8' }, // Light green
  };
  
  return moodStates[`${energy}-${tone}`] || { label: 'Neutral', color: '#F5F5F5' };
};

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const [goal, setGoal] = useState('');
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [tone, setTone] = useState<MoodTone | null>(null);
  const [thankful, setThankful] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveCheckIn = async () => {
    if (!goal.trim() || !energy || !tone || !thankful.trim()) {
      Alert.alert('Incomplete Check-In', 'Please fill in all fields before saving.');
      return;
    }

    setIsLoading(true);
    try {
      await database.createDailyCheckIn(
        goal.trim(),
        energy,
        tone,
        thankful.trim()
      );
      Alert.alert('Success', 'Your daily check-in has been saved!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      // console.error('Error saving check-in:', error);
      Alert.alert('Error', 'Failed to save your check-in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentMoodState = (): MoodState | null => {
    if (!energy || !tone) return null;
    return getMoodState(energy, tone);
  };

  const currentMood = getCurrentMoodState();

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Daily Check-In',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={[styles.content, { paddingTop: insets.top }]} 
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
          {/* Goal for Today */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's your goal for today?</Text>
            <TextInput
              style={styles.textInput}
              value={goal}
              onChangeText={setGoal}
              placeholder="What would you like to accomplish today?"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* What You're Thankful For */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What are you thankful for today?</Text>
            <TextInput
              style={styles.textInput}
              value={thankful}
              onChangeText={setThankful}
              placeholder="What brings you gratitude today?"
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Energy Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How much energy do you feel?</Text>
            <View style={styles.optionsContainer}>
              {(['low', 'medium', 'high'] as EnergyLevel[]).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.optionButton,
                    energy === level && styles.optionButtonSelected
                  ]}
                  onPress={() => setEnergy(level)}
                >
                  <Text style={[
                    styles.optionText,
                    energy === level && styles.optionTextSelected
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mood Tone */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's the tone of your mood?</Text>
            <View style={styles.optionsContainer}>
              {(['sad', 'calm', 'happy'] as MoodTone[]).map((moodTone) => (
                <TouchableOpacity
                  key={moodTone}
                  style={[
                    styles.optionButton,
                    tone === moodTone && styles.optionButtonSelected
                  ]}
                  onPress={() => setTone(moodTone)}
                >
                  <Text style={[
                    styles.optionText,
                    tone === moodTone && styles.optionTextSelected
                  ]}>
                    {moodTone.charAt(0).toUpperCase() + moodTone.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Current Mood Display */}
          {currentMood && (
            <View style={[styles.moodDisplay, { backgroundColor: currentMood.color }]}>
              <Text style={styles.moodLabel}>Your Current Mood:</Text>
              <Text style={styles.moodState}>{currentMood.label}</Text>
            </View>
          )}

          

          {/* Save Button */}
          <TouchableOpacity 
            style={[
              styles.saveButton,
              (!goal.trim() || !energy || !tone || !thankful.trim()) && styles.saveButtonDisabled
            ]}
            onPress={handleSaveCheckIn}
            disabled={isLoading || !goal.trim() || !energy || !tone || !thankful.trim()}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save Check-In'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.background,
  },
  title: {
    ...Fonts.largeTitle,
    color: Colors.text,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...Fonts.body,
    color: Colors.text,
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 16,
  },
  textInput: {
    ...Fonts.body,
    color: Colors.text,
    minHeight: 80,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownButtonText: {
    ...Fonts.body,
    color: Colors.text,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12, // Increased gap between buttons
  },
  optionButton: {
    flex: 1,
    padding: 16, // Increased padding for better text spacing
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 90, // Increased minimum width for better text fit
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  optionText: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 14, // Slightly smaller font size to ensure fit
  },
  optionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  moodDisplay: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodLabel: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  moodState: {
    ...Fonts.title,
    color: Colors.text,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  saveButtonText: {
    ...Fonts.title,
    color: Colors.surface,
    fontWeight: '600',
  },
}); 