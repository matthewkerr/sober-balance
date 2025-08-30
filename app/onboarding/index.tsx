import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { storage } from '../../utils/storage';

export default function OnboardingIndex() {
  const router = useRouter();

  useEffect(() => {
    const checkOnboardingProgress = async () => {
      try {
        //console.log('OnboardingIndex: Checking progress...');
        
        // Check if user has completed onboarding first
        const hasCompletedOnboarding = await storage.getHasCompletedOnboarding();
        
        if (hasCompletedOnboarding) {
          //console.log('OnboardingIndex: User completed onboarding, going to tabs');
          router.replace('/(tabs)');
          return;
        }

        // Check setup step
        const setupStep = await storage.getSetupStep();
        //console.log('OnboardingIndex: Current setup step:', setupStep);
        
        // Route to the appropriate step based on progress
        switch (setupStep) {
          case 0:
          case 1:
            //console.log('OnboardingIndex: Routing to name step');
            router.replace('/onboarding/name');
            break;
          case 2:
            //console.log('OnboardingIndex: Routing to reasons step');
            router.replace('/onboarding/reasons');
            break;
          case 3:
            //console.log('OnboardingIndex: Routing to support step');
            router.replace('/onboarding/support');
            break;
          case 4:
            //console.log('OnboardingIndex: Routing to sobriety step');
            router.replace('/onboarding/sobriety');
            break;
          case 5:
            //console.log('OnboardingIndex: Routing to complete step');
            router.replace('/onboarding/complete');
            break;
          default:
            //console.log('OnboardingIndex: No valid setup step, starting from name');
            router.replace('/onboarding/name');
        }
      } catch (error) {
       // console.error('OnboardingIndex: Error checking progress:', error);
        // If there's an error, start from the beginning
        router.replace('/onboarding/name');
      }
    };

    // Add a small delay to ensure router is ready
    const timer = setTimeout(() => {
      checkOnboardingProgress();
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

  // Don't render anything - this is just a routing component
  return null;
}
