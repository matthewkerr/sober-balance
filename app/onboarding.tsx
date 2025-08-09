import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LargeButton } from '../components/LargeButton';
import { LargeTextInput } from '../components/LargeTextInput';
import { SelectableOption } from '../components/SelectableOption';
import { storage } from '../utils/storage';
import { database } from '../utils/database';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Step 1: Name
  const [name, setName] = useState('');
  
  // Step 2: Reasons
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  
  // Step 4: Support Person
  const [wantsSupportPerson, setWantsSupportPerson] = useState<boolean | null>(null);
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  // Step 5: Sobriety Tracking
  const [wantsTracking, setWantsTracking] = useState<boolean | null>(null);
  const [soberYears, setSoberYears] = useState('');
  const [soberMonths, setSoberMonths] = useState('');
  const [soberDays, setSoberDays] = useState('');
  
  const reasonOptions = [
    'Staying sober',
    'Cutting back', 
    'Building better habits',
    'Finding calm',
    'Just exploring'
  ];

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

  const handleStep1Continue = async () => {
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
      setCurrentStep(2);
    } catch (error) {
      // console.error('Error saving name:', error);
      Alert.alert('Error', 'Failed to save your name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Continue = async () => {
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
      setCurrentStep(3);
    } catch (error) {
      // console.error('Error saving reasons:', error);
      Alert.alert('Error', 'Failed to save your reasons. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Continue = async () => {
    setIsLoading(true);

    try {
      await storage.setSetupStep(4);
      setCurrentStep(4);
    } catch (error) {
      // console.error('Error moving to next step:', error);
      Alert.alert('Error', 'Failed to continue. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep4Continue = async () => {
    if (wantsSupportPerson === null) {
      Alert.alert(
        'Selection Required',
        'Please choose whether you want to add a support person.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    if (wantsSupportPerson) {
      // Validate support person details
      if (!supportName.trim()) {
        Alert.alert(
          'Name Required',
          'Please enter your support person\'s name.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      if (!supportPhone.trim()) {
        Alert.alert(
          'Phone Required',
          'Please enter your support person\'s phone number.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      if (supportPhone.trim().length < 10) {
        Alert.alert(
          'Invalid Phone',
          'Please enter a valid phone number (at least 10 digits).',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      if (wantsSupportPerson) {
        await storage.setSupportPerson({
          name: supportName.trim(),
          phone: supportPhone.trim()
        });
        await database.saveSupportPerson(supportName.trim(), supportPhone.trim());
      }

      await storage.setSetupStep(5);
      setCurrentStep(5);
    } catch (error) {
      // console.error('Error saving support person:', error);
      Alert.alert('Error', 'Failed to save support person. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep5Continue = async () => {
    if (wantsTracking === null) {
      Alert.alert(
        'Selection Required',
        'Please choose whether you want to track your sobriety.',
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
          soberDate: soberDate
        });
        await database.saveSobrietyData(true, soberDate);
      } else {
        await storage.setSobrietyData({
          trackingSobriety: false
        });
        await database.saveSobrietyData(false);
      }

      await storage.setSetupStep(6);
      setCurrentStep(6);
    } catch (error) {
      // console.error('Error saving sobriety data:', error);
      Alert.alert('Error', 'Failed to save sobriety tracking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep6Complete = async () => {
    setIsLoading(true);

    try {
      await storage.setHasCompletedOnboarding(true);
      await database.updateUserOnboarding(true, 6);
      router.replace('/(tabs)');
    } catch (error) {
      // console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => {
      if (prev.includes(reason)) {
        return prev.filter(r => r !== reason);
      } else {
        return [...prev, reason];
      }
    });
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Setup?',
      'You can always complete this later in settings. Continue without finishing setup?',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Skip',
          style: 'default',
          onPress: async () => {
            try {
              await storage.setHasCompletedOnboarding(true);
              router.replace('/(tabs)');
            } catch (error) {
              // console.error('Error skipping onboarding:', error);
            }
          }
        }
      ]
    );
  };

  const renderStep1 = () => (
    <>
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
          onSubmitEditing={handleStep1Continue}
          maxLength={50}
          style={styles.nameInput}
        />
        <Text style={styles.inputHelp}>
          This helps us personalize your experience
        </Text>
      </View>

      {/* <View style={styles.benefitsSection}>
        <Text style={styles.benefitsTitle}>What you'll get:</Text>
        <View style={styles.benefit}>
          <Text style={styles.benefitIcon}>📊</Text>
          <Text style={styles.benefitText}>Progress tracking</Text>
        </View>
        <View style={styles.benefit}>
          <Text style={styles.benefitIcon}>💪</Text>
          <Text style={styles.benefitText}>Daily motivation</Text>
        </View>
        <View style={styles.benefit}>
          <Text style={styles.benefitIcon}>🔒</Text>
          <Text style={styles.benefitText}>Private & secure</Text>
        </View>
      </View> */}
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>What brings you to{'\n'}SoberBalance?</Text>
        <Text style={styles.subtitle}>
          Select all that apply - this helps us personalize your journey
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

      <View style={styles.selectionInfo}>
        <Text style={styles.selectionText}>
          {selectedReasons.length} of {reasonOptions.length} selected
        </Text>
      </View>
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.icon}>🆘</Text>
        <Text style={styles.title}>One-Tap SOS Mode</Text>
        <Text style={styles.subtitle}>
          You can trigger a calming message and grounding breath any time you need it. No tracking. No judgment.
        </Text>
      </View>

      <View style={styles.sosDemo}>
        {/* <View style={styles.sosButton}> */}
        <Ionicons name="pulse-outline" size={100} color={Colors.primary} />
        {/* </View> */}
        <Text style={styles.sosButtonLabel}>Tap anytime for instant support</Text>
      </View>

      <View style={styles.sosFeatures}>
        <View style={styles.sosFeature}>
          <Text style={styles.sosFeatureIcon}>🫁</Text>
          <View style={styles.sosFeatureContent}>
            <Text style={styles.sosFeatureTitle}>Guided Breathing</Text>
            <Text style={styles.sosFeatureText}>Immediate calming technique</Text>
          </View>
        </View>
        
        <View style={styles.sosFeature}>
          <Text style={styles.sosFeatureIcon}>💙</Text>
          <View style={styles.sosFeatureContent}>
            <Text style={styles.sosFeatureTitle}>Calming Messages</Text>
            <Text style={styles.sosFeatureText}>Gentle reminders of your strength</Text>
          </View>
        </View>
        
        <View style={styles.sosFeature}>
          <Text style={styles.sosFeatureIcon}>🔒</Text>
          <View style={styles.sosFeatureContent}>
            <Text style={styles.sosFeatureTitle}>No Tracking</Text>
            <Text style={styles.sosFeatureText}>Use without any data recording</Text>
          </View>
        </View>
      </View>

      <View style={styles.sosNote}>
        <Text style={styles.sosNoteText}>
          SOS Mode will be available on the bottom of the screen. Your privacy and peace of mind are our priority.
        </Text>
      </View>
    </>
  );

  const renderStep4 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Support Person</Text>
        <Text style={styles.subtitle}>
          Would you like to add a support person or sponsor you can reach out to in case of emergency?
        </Text>
      </View>

      <View style={styles.optionsSection}>
        <SelectableOption
          title="Yes, add a support person"
          selected={wantsSupportPerson === true}
          onPress={() => setWantsSupportPerson(true)}
        />
        <SelectableOption
          title="No, I'll skip for now"
          selected={wantsSupportPerson === false}
          onPress={() => setWantsSupportPerson(false)}
        />
      </View>

      {wantsSupportPerson === true && (
        <View style={styles.supportDetailsSection}>
          <Text style={styles.supportDetailsTitle}>Support Person Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name</Text>
            <LargeTextInput
              value={supportName}
              onChangeText={setSupportName}
              placeholder="Enter their name"
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="next"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <LargeTextInput
              value={supportPhone}
              onChangeText={setSupportPhone}
              placeholder="Enter their phone number"
              keyboardType="phone-pad"
              returnKeyType="done"
              maxLength={20}
            />
          </View>

          <View style={styles.supportNote}>
            <Text style={styles.supportNoteText}>
              💙 This person will be available as a quick contact option during difficult moments. You can change this anytime in settings.
            </Text>
          </View>
        </View>
      )}

      {wantsSupportPerson === false && (
        <View style={styles.supportSkipNote}>
          <Text style={styles.supportSkipText}>
            No problem! You can always add a support person later in your settings. Remember, SOS Mode will still be available for immediate support.
          </Text>
        </View>
      )}
    </>
  );

  const renderStep5 = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Track Your Progress</Text>
        <Text style={styles.subtitle}>
          Would you like to track how many days sober you are? This can be a powerful motivator on your journey.
        </Text>
      </View>

      <View style={styles.optionsSection}>
        <SelectableOption
          title="Yes, I'd like to track my sobriety"
          selected={wantsTracking === true}
          onPress={() => setWantsTracking(true)}
        />
        <SelectableOption
          title="No, I prefer not to track"
          selected={wantsTracking === false}
          onPress={() => setWantsTracking(false)}
        />
      </View>

      {wantsTracking === true && (
        <View style={styles.trackingDetailsSection}>
          <Text style={styles.trackingDetailsTitle}>How long have you been sober?</Text>
          <Text style={styles.trackingSubtitle}>Enter your current sobriety time</Text>
          
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
              🌟 Every day counts! We'll help you celebrate your milestones and progress. You can always adjust this later.
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
    </>
  );

  const renderStep6 = () => (
    <>
      <View style={styles.finalHeader}>
        <Text style={styles.finalIcon}>✨</Text>
        <Text style={styles.finalTitle}>You're ready.</Text>
        <Text style={styles.finalMessage}>
          This is your space now.{'\n'}Breathe easy.{'\n'}Come as you are.
        </Text>
      </View>

      <View style={styles.finalContent}>
        <View style={styles.finalFeature}>
          <Text style={styles.finalFeatureIcon}>🌱</Text>
          <Text style={styles.finalFeatureText}>Your journey starts here</Text>
        </View>
        
        <View style={styles.finalFeature}>
          <Text style={styles.finalFeatureIcon}>💪</Text>
          <Text style={styles.finalFeatureText}>You have everything you need</Text>
        </View>
        
        <View style={styles.finalFeature}>
          <Text style={styles.finalFeatureIcon}>🤗</Text>
          <Text style={styles.finalFeatureText}>No judgment, only support</Text>
        </View>
      </View>

      <View style={styles.finalNote}>
        <Text style={styles.finalNoteText}>
          Remember: Every moment of choosing yourself is a victory worth celebrating.
        </Text>
      </View>
    </>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return renderStep1();
    }
  };

  const renderActionButtons = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <LargeButton
              title={isLoading ? "Saving..." : "Continue"}
              onPress={handleStep1Continue}
              disabled={isLoading}
              variant="primary"
            />
            {/* <LargeButton
              title="Skip for now"
              onPress={handleSkip}
              variant="secondary"
              disabled={isLoading}
            /> */}
          </>
        );
      case 2:
        return (
          <>
            <LargeButton
              title={isLoading ? "Saving..." : "Continue"}
              onPress={handleStep2Continue}
              disabled={isLoading}
              variant="primary"
            />
            {/* <LargeButton
              title="Skip for now"
              onPress={handleSkip}
              variant="secondary"
              disabled={isLoading}
            /> */}
          </>
        );
      case 3:
        return (
          <>
            <LargeButton
              title="Continue"
              onPress={handleStep3Continue}
              disabled={isLoading}
              variant="primary"
            />
            {/* <LargeButton
              title="Skip for now"
              onPress={handleSkip}
              variant="secondary"
              disabled={isLoading}
            /> */}
          </>
        );
      case 4:
        return (
          <>
            <LargeButton
              title={isLoading ? "Saving..." : "Continue"}
              onPress={handleStep4Continue}
              disabled={isLoading}
              variant="primary"
            />
            {/* <LargeButton
              title="Skip for now"
              onPress={handleSkip}
              variant="secondary"
              disabled={isLoading}
            /> */}
          </>
        );
      case 5:
        return (
          <>
            <LargeButton
              title={isLoading ? "Saving..." : "Continue"}
              onPress={handleStep5Continue}
              disabled={isLoading}
              variant="primary"
            />
            {/* <LargeButton
              title="Skip for now"
              onPress={handleSkip}
              variant="secondary"
              disabled={isLoading}
            /> */}
          </>
        );
      case 6:
        return (
          <>
            <LargeButton
              title={isLoading ? "Getting ready..." : "Enter Sober Balance"}
              onPress={handleStep6Complete}
              disabled={isLoading}
              variant="success"
              style={styles.finalButton}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {currentStep === 6 ? (
          // For the final step, use a fixed layout without ScrollView
          <View style={styles.finalStepContainer}>
            {renderCurrentStep()}
            <View style={styles.actions}>
              {renderActionButtons()}
            </View>
          </View>
        ) : (
          // For other steps, use ScrollView
          <>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {renderCurrentStep()}
            </ScrollView>

            <View style={styles.actions}>
              {renderActionButtons()}
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  icon: {
    fontSize: 60,
    marginBottom: 20,
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
  benefitsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  benefitsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },
  benefitText: {
    ...Fonts.body,
    color: Colors.text,
    flex: 1,
  },
  optionsSection: {
    marginBottom: 20,
  },
  selectionInfo: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  selectionText: {
    ...Fonts.caption,
    color: Colors.textSecondary,
  },
  // SOS Mode Step 3 Styles
  sosDemo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sosButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sosButtonText: {
    ...Fonts.headline,
    color: Colors.surface,
    fontWeight: '700',
  },
  sosButtonLabel: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  sosFeatures: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
  },
  sosFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sosFeatureIcon: {
    fontSize: 24,
    marginRight: 16,
    marginTop: 2,
  },
  sosFeatureContent: {
    flex: 1,
  },
  sosFeatureTitle: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  sosFeatureText: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  sosNote: {
    backgroundColor: '#FFF8DC',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  sosNoteText: {
    ...Fonts.caption,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Support Person Step 4 Styles
  supportDetailsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
  },
  supportDetailsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  supportNote: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  supportNoteText: {
    ...Fonts.caption,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  supportSkipNote: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
  },
  supportSkipText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  // Sobriety Tracking Step 5 Styles
  trackingDetailsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
  },
  trackingDetailsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  trackingSubtitle: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  timeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeInputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeInputLabel: {
    ...Fonts.body,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  timeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
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
  // Final Step 6 Styles
  finalHeader: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 50,
  },
  finalIcon: {
    fontSize: 80,
    marginBottom: 30,
  },
  finalTitle: {
    ...Fonts.largeTitle,
    fontSize: 42,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '300',
  },
  finalMessage: {
    ...Fonts.title,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 36,
    paddingHorizontal: 20,
    fontWeight: '400',
  },
  finalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 10,
    marginBottom: 30,
  },
  finalFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    justifyContent: 'center',
  },
  finalFeatureIcon: {
    fontSize: 28,
    marginRight: 16,
  },
  finalFeatureText: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '500',
  },
  finalNote: {
    backgroundColor: '#F0F8FF',
    borderRadius: 16,
    padding: 14,
    borderLeftColor: Colors.primary,
  },
  finalNoteText: {
    ...Fonts.body,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  finalButton: {
    backgroundColor: Colors.primary,
    minHeight: 80,
  },
  actions: {
    padding: 20,
    paddingBottom: 40,
  },
  finalStepContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 10,
  },
});