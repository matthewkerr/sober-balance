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
import { LargeTextInput } from '../../components/LargeTextInput';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { OnboardingSkipButton } from '../../components/OnboardingSkipButton';
import { storage } from '../../utils/storage';
import { database } from '../../utils/database';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NameStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    //console.log('NameStep: Component mounted');
  }, []);

  const handleContinue = async () => {
    // Validate name input
    if (!name.trim()) {
      Alert.alert(
        'Name Required',
        'Please enter your name to continue.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert(
        'Name Too Short',
        'Please enter at least 2 characters for your name.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    setIsLoading(true);

    try {
      // Save to both storage systems for compatibility
      await storage.setUserName(name.trim());
      await database.createUser(name.trim());
      await storage.setSetupStep(2);
      router.push('/onboarding/reasons');
    } catch (error) {
      Alert.alert('Error', 'Failed to save your name. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
            currentStep={1} 
            totalSteps={5} 
            canGoBack={false}
          />
          
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to{'\n'}SoberBalance</Text>
            <Text style={styles.subtitle}>
              Your personal sobriety companion
            </Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>What's your name?</Text>
            <LargeTextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              maxLength={50}
              style={styles.nameInput}
            />
            <Text style={styles.inputHelp}>
              We'll use this to personalize your experience
            </Text>
          </View>

          <View style={styles.actions}>
            <LargeButton
              title="Continue"
              onPress={handleContinue}
              disabled={isLoading || !name.trim()}
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
    marginBottom: 60,
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
  inputSection: {
    marginBottom: 40,
  },
  inputLabel: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  nameInput: {
    marginBottom: 12,
    textAlign: 'center',
  },
  inputHelp: {
    ...Fonts.caption,
    color: Colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  actions: {
    marginBottom: 40,
  },
  continueButton: {
    marginBottom: 16,
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
