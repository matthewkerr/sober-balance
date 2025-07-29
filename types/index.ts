export interface AppState {
    hasCompletedOnboarding: boolean;
    userName?: string;
    setupStep: number;
  }
  
  // Onboarding steps
  export enum OnboardingStep {
    WELCOME = 0,
    USER_INFO = 1,
    CONTACTS = 2,
    MEDICATIONS = 3,
    COMPLETE = 4,
  }