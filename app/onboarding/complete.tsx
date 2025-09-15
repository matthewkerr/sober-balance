import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  SafeAreaView,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LargeButton } from '../../components/LargeButton';
import { OnboardingHeader } from '../../components/OnboardingHeader';
import { storage } from '../../utils/storage';
import { database } from '../../utils/database';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CompleteStep() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);

    try {
      await storage.setHasCompletedOnboarding(true);
      await database.updateUserOnboarding(true, 5);
      router.replace('/(tabs)');
    } catch (error) {
      // Handle error silently and still navigate
      router.replace('/(tabs)');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(20, insets.top + 10) }]}>
        <OnboardingHeader 
          currentStep={5} 
          totalSteps={5} 
          canGoBack={false}
        />
        
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

        <View style={styles.actions}>
          <LargeButton
            title="Get Started"
            onPress={handleComplete}
            disabled={isLoading}
            variant="success"
            style={styles.finalButton}
          />
        </View>
      </ScrollView>
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
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
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
  actions: {
    marginBottom: 40,
  },
  finalButton: {
    backgroundColor: Colors.primary,
    minHeight: 80,
  },
});
