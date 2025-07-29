
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { storage } from '../utils/storage';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from 'expo-router';


export default function IndexPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      // Disable back button/gesture when this screen is focused
      navigation.setOptions({
        headerShown: false,
        gestureEnabled: false,
      });
    }, [navigation])
  );

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      console.log('Checking onboarding status...');
      
      // Add a small delay so users can see the loading screen
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const hasCompletedOnboarding = await storage.getHasCompletedOnboarding();
      console.log('Has completed onboarding:', hasCompletedOnboarding);
      
      if (hasCompletedOnboarding) {
        console.log('Navigating to tabs...');
        router.replace('/(tabs)');
      } else {
        console.log('Navigating to onboarding...');
        router.replace('/onboarding');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to onboarding if there's an error
      router.replace('/onboarding');
    } finally {
      setIsChecking(false);
    }
  };

  if (!isChecking && !router) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Loading Sober Balance...</Text>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.background,
    padding: 20,
  },
  loadingText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    marginTop: 20,
    textAlign: 'center' as const,
  },
  errorText: {
    ...Fonts.body,
    color: Colors.danger,
    textAlign: 'center' as const,
  },
};
