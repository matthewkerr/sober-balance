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
import { storage } from '../../utils/storage';
import { database } from '../../utils/database';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SupportStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [wantsSupportPerson, setWantsSupportPerson] = useState<boolean | null>(null);
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
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

      await storage.setSetupStep(4);
      router.push('/onboarding/sobriety');
    } catch (error) {
      Alert.alert('Error', 'Failed to save support person. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(20, insets.top + 10) }]}>
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

          <View style={styles.actions}>
            <LargeButton
              title="Continue"
              onPress={handleContinue}
              disabled={isLoading}
              variant="primary"
              style={styles.continueButton}
            />
            
            <LargeButton
              title="Back"
              onPress={handleBack}
              variant="secondary"
              style={styles.backButton}
            />
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
  supportDetailsSection: {
    marginBottom: 40,
  },
  supportDetailsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    ...Fonts.body,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
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
