import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';


const { width, height } = Dimensions.get('window');



// Mock database functions - replace with your actual implementations
const mockDatabase = {
  getRandomEncouragement: async () => {
    const messages = [
      { message: 'You are safe. You are strong.' },
      { message: 'This feeling will pass. You are in control.' },
      { message: 'Take one breath at a time. You\'ve got this.' },
      { message: 'You are brave. You are resilient.' },
      { message: 'This moment is temporary. You are permanent.' },
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  },
  logSOSActivation: async (timestamp: string) => {
    // console.log('SOS activated at:', timestamp);
    return Promise.resolve();
  }
};

// Mock constants - replace with your actual values
const Colors = {
  background: '#f5f5f5',
  primary: '#6366f1',
  surface: '#ffffff',
} as const;

const Fonts = {
  title: {
    fontSize: 24,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
  },
} as const;

export default function SOSScreen() {
  const [currentMessage, setCurrentMessage] = useState('');
  const [breathPhase, setBreathPhase] = useState('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  const breathAnimation = useRef(new Animated.Value(0.8)).current;
  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;

  const navigation = useNavigation(); // ADD THIS LINE
  
  // Refs to track timeouts and prevent memory leaks
  const timeoutRefs = useRef<number[]>([]);
  const animationRefs = useRef<Animated.CompositeAnimation[]>([]);

  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
  }, []);

  const stopAllAnimations = useCallback(() => {
    animationRefs.current.forEach(animation => animation.stop());
    animationRefs.current = [];
  }, []);

  const loadEncouragement = useCallback(async () => {
    try {
      const randomEncouragement = await mockDatabase.getRandomEncouragement();
      setCurrentMessage(randomEncouragement?.message || 'You are safe. You are strong.');
    } catch (error) {
      // console.error('Error loading encouragement:', error);
      setCurrentMessage('You are safe. You are strong.');
    }
  }, []);

  const logSOSActivation = useCallback(async () => {
    try {
      const timestamp = new Date().toISOString();
      await mockDatabase.logSOSActivation(timestamp);
    } catch (error) {
      // console.error('Error logging SOS activation:', error);
    }
  }, []);

  const startBreathingCycle = useCallback(() => {
    if (!isBreathingActive) return;

    const inhaleDuration = 4000;
    const holdDuration = 7000;
    const exhaleDuration = 8000;
    const pauseDuration = 2000;

    const runCycle = () => {
      if (!isBreathingActive) return;

      // Inhale phase
      setBreathPhase('inhale');
      const inhaleAnimation = Animated.timing(breathAnimation, {
        toValue: 1.4,
        duration: inhaleDuration,
        useNativeDriver: true,
      });
      
      animationRefs.current.push(inhaleAnimation);
      
      inhaleAnimation.start((finished) => {
        if (!finished || !isBreathingActive) return;

        // Hold phase
        setBreathPhase('hold');
        const holdTimeout = setTimeout(() => {
          if (!isBreathingActive) return;

          // Exhale phase
          setBreathPhase('exhale');
          const exhaleAnimation = Animated.timing(breathAnimation, {
            toValue: 0.8,
            duration: exhaleDuration,
            useNativeDriver: true,
          });
          
          animationRefs.current.push(exhaleAnimation);
          
          exhaleAnimation.start((finished) => {
            if (!finished || !isBreathingActive) return;

            setBreathCount(prev => prev + 1);
            
            // Pause before next cycle
            const pauseTimeout = setTimeout(() => {
              if (isBreathingActive) {
                runCycle();
              }
            }, pauseDuration);
            
            timeoutRefs.current.push(pauseTimeout);
          });
        }, holdDuration);
        
        timeoutRefs.current.push(holdTimeout);
      });
    };

    runCycle();
  }, [isBreathingActive]);

  const startSOSMode = useCallback(async () => {
    setBreathCount(0);
    setBreathPhase('inhale');
    setIsBreathingActive(true);
    
    // Reset animation to initial state
    breathAnimation.setValue(0.8);

    try {
      await logSOSActivation();
    } catch (error) {
      // console.error('Error in SOS activation:', error);
    }
  }, [breathAnimation, logSOSActivation]);

  const stopSOSMode = useCallback(() => {
    // console.log('Stopping SOS mode and all animations');
    
    // Stop breathing cycle
    setIsBreathingActive(false);
    
    // Clear all timeouts
    clearAllTimeouts();
    
    // Stop all animations
    stopAllAnimations();
    
    // Reset state
    setBreathCount(0);
    setBreathPhase('inhale');
    
    // Reset animations to initial values
    breathAnimation.stopAnimation(() => {
      breathAnimation.setValue(0.8);
    });
    
    fadeAnimation.stopAnimation(() => {
      fadeAnimation.setValue(1);
    });
    
    scaleAnimation.stopAnimation(() => {
      scaleAnimation.setValue(1);
    });
  }, [clearAllTimeouts, stopAllAnimations, breathAnimation, fadeAnimation, scaleAnimation]);

  // Start breathing cycle when isBreathingActive changes to true
  useEffect(() => {
    if (isBreathingActive) {
      // console.log('🫁 Starting breathing cycle...');
      startBreathingCycle();
    }
  }, [isBreathingActive, startBreathingCycle]);

  // Navigation event listeners for cleanup
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      // console.log('Navigation blur event - stopping animations');
      stopSOSMode();
    });
  
    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', () => {
      // console.log('Before remove event - stopping animations');
      stopSOSMode();
    });
  
    return () => {
      unsubscribeBlur();
      unsubscribeBeforeRemove();
    };
  }, [navigation, stopSOSMode]);

  useFocusEffect(
    React.useCallback(() => {
      // Screen comes into focus
      // console.log('SOS Screen focused - starting animations');
      loadEncouragement();
      startSOSMode();
  
      return () => {
        // Screen loses focus (navigation away)
        // console.log('SOS Screen unfocused - stopping animations');
        stopSOSMode();
      };
    }, [loadEncouragement, startSOSMode, stopSOSMode])
  );
  
  const getBreathInstruction = () => {
    switch (breathPhase) {
      case 'inhale': return 'Breathe in slowly...';
      case 'hold': return 'Hold...';
      case 'exhale': return 'Breathe out slowly...';
      default: return 'Breathe with me...';
    }
  };

  const getBreathEmoji = () => {
    switch (breathPhase) {
      case 'inhale': return '🫁';
      case 'hold': return '⏸️';
      case 'exhale': return '💨';
      default: return '🫁';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.activeContainer,
          {
            opacity: fadeAnimation,
            transform: [{ scale: scaleAnimation }],
          },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.breathingSection}>
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: breathAnimation }],
                },
              ]}
            >
              <Text style={styles.breathEmoji}>{getBreathEmoji()}</Text>
            </Animated.View>
            <Text style={styles.breathInstruction}>{getBreathInstruction()}</Text>
            <Text style={styles.breathCount}>Breath {breathCount + 1}</Text>
          </View>

          <View style={styles.remindersSection}>
            <Text style={styles.reminderText}>You are safe. This moment will pass.</Text>
            <Text style={styles.reminderText}>You have the strength to get through this.</Text>
          </View>

          <View style={styles.messageSection}>
            <Text style={styles.messageText}>{currentMessage}</Text>
          </View>

         
          <View style={styles.remindersSection}>
            <Text style={styles.reminderText}> The 4-7-8 breathing technique is a simple, powerful relaxation practice rooted in breath regulation. </Text>
            <Text style={styles.reminderText}>It’s often used to reduce anxiety, manage stress, and help with falling asleep.</Text>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background 
  },
    activeContainer: { 
    flex: 1, 
    backgroundColor: '#5B8A72' // Same green as sobriety card
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  breathingSection: { 
    alignItems: 'center', 
    marginBottom: 60 
  },
  breathingCircle: {
    width: 150, 
    height: 150, 
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
  },
  breathEmoji: { 
    fontSize: 48 
  },
  breathInstruction: {
    ...Fonts.title,
    color: Colors.surface,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 40,
  },
  breathCount: {
    ...Fonts.body,
    color: Colors.surface,
    opacity: 0.8,
  },
  messageSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 40,
    maxWidth: 350,
  },
  messageText: {
    ...Fonts.title,
    color: Colors.surface,
    textAlign: 'center',
    lineHeight: 32,
  },
  remindersSection: { 
    alignItems: 'center',
    marginBottom: 20,
  },
  reminderText: {
    ...Fonts.body,
    color: Colors.surface,
    textAlign: 'center',
    marginBottom: 8,
    opacity: 0.9,
  },
});