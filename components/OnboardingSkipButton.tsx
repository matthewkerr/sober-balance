import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '../utils/storage';

interface OnboardingSkipButtonProps {
  onSkip?: () => void;
  skipMessage?: string;
  skipTitle?: string;
}

export function OnboardingSkipButton({ 
  onSkip, 
  skipMessage = "You can always complete this later in settings. Continue without finishing setup?",
  skipTitle = "Skip Setup?"
}: OnboardingSkipButtonProps) {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
      return;
    }

    Alert.alert(
      skipTitle,
      skipMessage,
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
              // Handle error silently
            }
          }
        }
      ]
    );
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkip}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-forward" size={16} color={Colors.textSecondary} />
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    marginTop: 12,
  },
  skipText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    marginLeft: 6,
    fontWeight: '500',
  },
});
