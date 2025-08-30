
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, Image } from 'react-native';
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
      // console.log('Checking onboarding status...');
      
      // Add a small delay so users can see the loading screen
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // console.log('Getting onboarding status from storage...');
      const hasCompletedOnboarding = await storage.getHasCompletedOnboarding();
      //console.log('Has completed onboarding:', hasCompletedOnboarding);
      
      if (hasCompletedOnboarding) {
        //console.log('Navigating to tabs...');
        router.push('/(tabs)');
      } else {
        //console.log('Navigating to onboarding...');
        router.push('/onboarding');
      }
    } catch (error) {
      //console.error('Error checking onboarding status:', error);
      // Default to onboarding if there's an error
      //console.log('Falling back to onboarding due to error');
      router.push('/onboarding');
    } finally {
      //console.log('Setting isChecking to false');
      setIsChecking(false);
    }
  };

  // Add a fallback timeout to prevent getting stuck
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (isChecking) {
        //console.log('Fallback: Navigating to onboarding due to timeout');
        router.push('/onboarding');
        setIsChecking(false);
      }
    }, 8000); // 8 second fallback

    return () => clearTimeout(fallbackTimer);
  }, [isChecking, router]);

  if (!isChecking && !router) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
      <Text style={styles.loadingText}>Loading Sober Balance...</Text>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  logo: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 20,
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
