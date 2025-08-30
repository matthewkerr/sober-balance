import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  HAS_COMPLETED_ONBOARDING: 'hasCompletedOnboarding',
  USER_NAME: 'userName',
  SETUP_STEP: 'setupStep', // Track which step of onboarding user is on
  SHOW_SOBRIETY_COUNTER: 'showSobrietyCounter', // Control sobriety counter visibility
} as const;

export const storage = {
  // Onboarding status
  async getHasCompletedOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING);
      return value === 'true';
    } catch (error) {
      // console.error('Error getting onboarding status:', error);
      return false;
    }
  },

  async setHasCompletedOnboarding(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, completed.toString());
      // console.log('Onboarding status saved:', completed);
    } catch (error) {
      // console.error('Error saving onboarding status:', error);
      throw error;
    }
  },

  // User name
  async getUserName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
    } catch (error) {
      // console.error('Error getting user name:', error);
      return null;
    }
  },

  async setUserName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
      // console.log('User name saved:', name);
    } catch (error) {
      // console.error('Error saving user name:', error);
      throw error;
    }
  },

  // Clear all data (for testing/reset)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      // console.log('All storage cleared');
    } catch (error) {
      // console.error('Error clearing storage:', error);
      throw error;
    }
  },

    // User reasons (for the new onboarding step)
  async getUserReasons(): Promise<string[]> {
    try {
      const value = await AsyncStorage.getItem('userReasons');
      return value ? JSON.parse(value) : [];
    } catch (error) {
      // console.error('Error getting user reasons:', error);
      return [];
    }
  },

  async setUserReasons(reasons: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem('userReasons', JSON.stringify(reasons));
      // console.log('User reasons saved:', reasons);
    } catch (error) {
      // console.error('Error saving user reasons:', error);
      throw error;
    }
  },

  // Sobriety tracking data
  async getSobrietyData(): Promise<{trackingSobriety: boolean, soberDate?: string} | null> {
    try {
      const value = await AsyncStorage.getItem('sobrietyData');
      return value ? JSON.parse(value) : null;
    } catch (error) {
      // console.error('Error getting sobriety data:', error);
      return null;
    }
  },

  async setSobrietyData(data: {trackingSobriety: boolean, trackingMode: 'sober' | 'trying', soberDate?: string}): Promise<void> {
    try {
      await AsyncStorage.setItem('sobrietyData', JSON.stringify(data));
      // console.log('Sobriety data saved:', data);
    } catch (error) {
      // console.error('Error saving sobriety data:', error);
      throw error;
    }
  },

  async clearSobrietyData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('sobrietyData');
      // console.log('Sobriety data cleared');
    } catch (error) {
      // console.error('Error clearing sobriety data:', error);
      throw error;
    }
  },

   // Support person/sponsor data
  async getSupportPerson(): Promise<{name: string, phone: string} | null> {
    try {
      const value = await AsyncStorage.getItem('supportPerson');
      return value ? JSON.parse(value) : null;
    } catch (error) {
      // console.error('Error getting support person:', error);
      return null;
    }
  },

  async setSupportPerson(person: {name: string, phone: string}): Promise<void> {
    try {
      await AsyncStorage.setItem('supportPerson', JSON.stringify(person));
      // console.log('Support person saved:', person.name);
    } catch (error) {
      // console.error('Error saving support person:', error);
      throw error;
    }
  },

  async clearSupportPerson(): Promise<void> {
    try {
      await AsyncStorage.removeItem('supportPerson');
      // console.log('Support person cleared');
    } catch (error) {
      // console.error('Error clearing support person:', error);
      throw error;
    }
  },


 // Setup step tracking (update existing function to handle more steps)
  async getSetupStep(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem('setupStep');
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      // console.error('Error getting setup step:', error);
      return 0;
    }
  },

  async setSetupStep(step: number): Promise<void> {
    try {
      await AsyncStorage.setItem('setupStep', step.toString());
      // console.log('Setup step saved:', step);
    } catch (error) {
      // console.error('Error saving setup step:', error);
      throw error;
    }
  },

  // Sobriety counter visibility
  async getShowSobrietyCounter(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.SHOW_SOBRIETY_COUNTER);
      // Default to true if not set (show by default)
      return value === null ? true : value === 'true';
    } catch (error) {
      // console.error('Error getting sobriety counter visibility:', error);
      return true; // Default to showing
    }
  },

  async setShowSobrietyCounter(show: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHOW_SOBRIETY_COUNTER, show.toString());
      // console.log('Sobriety counter visibility saved:', show);
    } catch (error) {
      // console.error('Error saving sobriety counter visibility:', error);
      throw error;
    }
  },

  // Debug: Log all stored data
  async debugLogAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const stores = await AsyncStorage.multiGet(keys);
      
      // console.log('=== Current Storage Data ===');
      stores.forEach(([key, value]) => {
        // console.log(`${key}: ${value}`);
      });
      // console.log('===========================');
    } catch (error) {
      // console.error('Error logging storage data:', error);
    }
  }
};