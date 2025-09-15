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
import { SelectableOption } from '../../components/SelectableOption';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { OnboardingSkipButton } from '../../components/OnboardingSkipButton';
import { storage } from '../../utils/storage';
import { database } from '../../utils/database';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SobrietyStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [wantsTracking, setWantsTracking] = useState<boolean | null>(null);
  const [trackingMode, setTrackingMode] = useState<'sober' | 'trying' | null>(null);
  const [soberYears, setSoberYears] = useState('');
  const [soberMonths, setSoberMonths] = useState('');
  const [soberDays, setSoberDays] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const calculateSoberDate = () => {
    const years = parseInt(soberYears) || 0;
    const months = parseInt(soberMonths) || 0;
    const days = parseInt(soberDays) || 0;

    const now = new Date();
    const soberDate = new Date(now);
    
    soberDate.setFullYear(soberDate.getFullYear() - years);
    soberDate.setMonth(soberDate.getMonth() - months);
    soberDate.setDate(soberDate.getDate() - days);
    
    return soberDate.toISOString();
  };

  const handleContinue = async () => {
    if (wantsTracking === null) {
      Alert.alert(
        'Selection Required',
        'Please choose whether you want to track your progress.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (wantsTracking && trackingMode === null) {
      Alert.alert(
        'Tracking Mode Required',
        'Please select whether you want to track days sober or days trying to be sober.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (wantsTracking) {
      const years = parseInt(soberYears) || 0;
      const months = parseInt(soberMonths) || 0;
      const days = parseInt(soberDays) || 0;

      if (years === 0 && months === 0 && days === 0) {
        Alert.alert(
          'Time Required',
          'Please enter at least some time (days, months, or years) for your sobriety tracking.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      if (years > 50) {
        Alert.alert(
          'Invalid Years',
          'Please enter a reasonable number of years (50 or less).',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      if (months > 11) {
        Alert.alert(
          'Invalid Months',
          'Please enter 0-11 months (12+ months should be counted as years).',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      if (days > 365) {
        Alert.alert(
          'Invalid Days',
          'Please enter 0-365 days (365+ days should be counted as months/years).',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      if (wantsTracking) {
        const soberDate = calculateSoberDate();
        await storage.setSobrietyData({
          trackingSobriety: true,
          trackingMode: trackingMode!,
          soberDate: soberDate
        });
        await database.saveSobrietyData(true, trackingMode!, soberDate);
      } else {
        await storage.setSobrietyData({
          trackingSobriety: false,
          trackingMode: 'sober' // Default value when not tracking
        });
        await database.saveSobrietyData(false, 'sober');
      }

      await storage.setSetupStep(5);
      router.push('/onboarding/complete');
    } catch (error) {
      Alert.alert('Error', 'Failed to save sobriety tracking. Please try again.');
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
            currentStep={4} 
            totalSteps={5} 
            canGoBack={true}
            onBack={handleBack}
          />
          
          <View style={styles.header}>
            <Text style={styles.title}>Track Your Progress</Text>
            <Text style={styles.subtitle}>
              Would you like to track how many days sober you are?
            </Text>
            <Text style={styles.subtitle}>
              Or Would you like track how many days you've been trying to stay sober? We wont judge you!
            </Text>
            <Text style={styles.subtitle}>
              This can be a powerful motivator on your journey.
            </Text>
          </View>

          <View style={styles.optionsSection}>
            <SelectableOption
              title="Yes, I'd like to track my days sober"
              selected={wantsTracking === true && trackingMode === 'sober'}
              onPress={() => {
                setWantsTracking(true);
                setTrackingMode('sober');
              }}
            />
            <SelectableOption
              title="Yes, I'd like to track my days trying to be sober"
              selected={wantsTracking === true && trackingMode === 'trying'}
              onPress={() => {
                setWantsTracking(true);
                setTrackingMode('trying');
              }}
            />
            <SelectableOption
              title="No, I prefer not to track"
              selected={wantsTracking === false}
              onPress={() => setWantsTracking(false)}
            />
          </View>

          {wantsTracking === true && (
            <View style={styles.trackingDetailsSection}>
              <Text style={styles.trackingDetailsTitle}>
                {trackingMode === 'sober' 
                  ? 'How long have you been sober?' 
                  : 'How long have you been trying to be sober?'
                }
              </Text>
              <Text style={styles.trackingSubtitle}>
                {trackingMode === 'sober'
                  ? 'Enter your current sobriety time'
                  : 'Enter how long you\'ve been working on your sobriety'
                }
              </Text>
              
              <View style={styles.timeInputsContainer}>
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Days</Text>
                  <LargeTextInput
                    value={soberDays}
                    onChangeText={setSoberDays}
                    placeholder="0"
                    keyboardType="numeric"
                    returnKeyType="done"
                    maxLength={3}
                    style={styles.timeInput}
                  />
                </View>
                
                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Months</Text>
                  <LargeTextInput
                    value={soberMonths}
                    onChangeText={setSoberMonths}
                    placeholder="0"
                    keyboardType="numeric"
                    returnKeyType="next"
                    maxLength={2}
                    style={styles.timeInput}
                  />
                </View>

                <View style={styles.timeInputGroup}>
                  <Text style={styles.timeInputLabel}>Years</Text>
                  <LargeTextInput
                    value={soberYears}
                    onChangeText={setSoberYears}
                    placeholder="0"
                    keyboardType="numeric"
                    returnKeyType="next"
                    maxLength={2}
                    style={styles.timeInput}
                  />
                </View>
              </View>

              <View style={styles.trackingNote}>
                <Text style={styles.trackingNoteText}>
                  {trackingMode === 'sober'
                    ? '🌟 Every day counts! We\'ll help you celebrate your milestones and progress. You can always adjust this later.'
                    : '🌟 Every effort counts! We\'ll help you celebrate your commitment and progress. You can always adjust this later.'
                  }
                </Text>
              </View>
            </View>
          )}

          {wantsTracking === false && (
            <View style={styles.trackingSkipNote}>
              <Text style={styles.trackingSkipText}>
                That's perfectly fine! Everyone's journey is different. You can always enable sobriety tracking later if you change your mind.
              </Text>
            </View>
          )}

          <View style={styles.actions}>
            <LargeButton
              title="Continue"
              onPress={handleContinue}
              disabled={isLoading}
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
    marginBottom: 16,
  },
  optionsSection: {
    marginBottom: 40,
  },
  trackingDetailsSection: {
    marginBottom: 40,
  },
  trackingDetailsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  trackingSubtitle: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  timeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeInputGroup: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  timeInputLabel: {
    ...Fonts.body,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  timeInput: {
    textAlign: 'center',
    minHeight: 50,
    fontSize: 18,
    padding: 16,
    textAlignVertical: 'center',
  },
  trackingNote: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  trackingNoteText: {
    ...Fonts.caption,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  trackingSkipNote: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  trackingSkipText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
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
