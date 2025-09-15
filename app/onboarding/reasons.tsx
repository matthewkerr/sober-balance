import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LargeButton } from '../../components/LargeButton';
import { SelectableOption } from '../../components/SelectableOption';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { OnboardingSkipButton } from '../../components/OnboardingSkipButton';
import { storage } from '../../utils/storage';
import { database } from '../../utils/database';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReasonsStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const reasonOptions = [
    'Staying sober',
    'Cutting back', 
    'Building better habits',
    'Finding calm',
    'Just exploring'
  ];

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => {
      if (prev.includes(reason)) {
        return prev.filter(r => r !== reason);
      } else {
        return [...prev, reason];
      }
    });
  };

  const handleContinue = async () => {
    if (selectedReasons.length === 0) {
      Alert.alert(
        'Selection Required',
        'Please select at least one reason to continue.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      await storage.setUserReasons(selectedReasons);
      await database.saveUserReasons(selectedReasons);
      await storage.setSetupStep(3);
      router.push('/onboarding/support');
    } catch (error) {
      Alert.alert('Error', 'Failed to save your reasons. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSkip = async () => {
    try {
      await storage.setHasCompletedOnboarding(true);
      router.replace('/(tabs)');
    } catch (error) {
      // Handle error silently
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(20, insets.top + 10) }]}>
          <OnboardingHeader 
            currentStep={2} 
            totalSteps={5} 
            canGoBack={true}
            onBack={handleBack}
          />
          
          <View style={styles.header}>
            <Text style={styles.title}>Why are you here?</Text>
            <Text style={styles.subtitle}>
              Select all that apply. This helps us personalize your experience and provide relevant support.
            </Text>
          </View>

          <View style={styles.optionsSection}>
            {reasonOptions.map((reason) => (
              <SelectableOption
                key={reason}
                title={reason}
                selected={selectedReasons.includes(reason)}
                onPress={() => toggleReason(reason)}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <LargeButton
              title="Continue"
              onPress={handleContinue}
              disabled={isLoading || selectedReasons.length === 0}
              variant="primary"
              style={styles.continueButton}
            />
            
            <OnboardingSkipButton onSkip={handleSkip} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statusBarBackground: {
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    ...Fonts.largeTitle,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 28,
  },
  optionsSection: {
    marginBottom: 40,
  },
  actions: {
    marginBottom: 40,
  },
  continueButton: {
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
