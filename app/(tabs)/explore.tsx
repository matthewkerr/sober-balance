
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { storage } from '../../utils/storage';
import { database } from '../../utils/database';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { LargeButton } from '../../components/LargeButton';
import { calculateSobrietyDaysByDate } from '../../utils/database';

export default function DebugScreen() {
  const router = useRouter();
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [encouragementStats, setEncouragementStats] = useState<{ total: number; seen: number; unseen: number } | null>(null);
  const [sobrietyData, setSobrietyData] = useState<{ tracking_sobriety: boolean; sober_date?: string } | null>(null);
  const [sobrietyDays, setSobrietyDays] = useState<number | null>(null);
  const [sosLogs, setSosLogs] = useState<{ id: number; timestamp: string }[]>([]);

  useEffect(() => {
    loadStorageData();
  }, []);

  const loadStorageData = async () => {
    try {
      // Load data with individual error handling for each call
      let onboarded = false;
      let name = null;
      let stats = { total: 0, seen: 0, unseen: 0 };
      let sobriety = null;
      let logs: { id: number; timestamp: string }[] = [];

      try {
        onboarded = await storage.getHasCompletedOnboarding();
      } catch (error) {
        // console.error('Error loading onboarding status:', error);
      }

      try {
        name = await storage.getUserName();
      } catch (error) {
        // console.error('Error loading user name:', error);
      }

      try {
        stats = await database.getEncouragementStats();
      } catch (error) {
        // console.error('Error loading encouragement stats:', error);
      }

      try {
        sobriety = await database.getSobrietyData();
      } catch (error) {
        // console.error('Error loading sobriety data:', error);
      }

      try {
        logs = await database.getSOSLogs();
      } catch (error) {
        // console.error('Error loading SOS logs:', error);
      }
      
      setHasOnboarded(onboarded);
      setUserName(name);
      setEncouragementStats(stats);
      setSobrietyData(sobriety);
      setSosLogs(logs);
      
      // Calculate sobriety days if tracking
      if (sobriety && sobriety.tracking_sobriety && sobriety.sober_date) {
        // Calculate days since sober date using calendar days
        const daysDiff = calculateSobrietyDaysByDate(sobriety.sober_date);
        setSobrietyDays(daysDiff);
      } else {
        setSobrietyDays(null);
      }
    } catch (error) {
      // console.error('Error loading storage data:', error);
    }
  };

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding?',
      'This will clear all saved data and take you to the onboarding flow.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.clearAll();
              await database.updateUserOnboarding(false, 1);
              router.replace('/onboarding');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset onboarding');
            }
          }
        }
      ]
    );
  };

  const handleDebugLog = async () => {
    await storage.debugLogAllData();
    await database.debugLogAllData();
    Alert.alert('Debug', 'Check console for storage and database data');
  };

  const handleResetEncouragements = async () => {
    Alert.alert(
      'Reset Encouragements?',
      'This will mark all encouragements as unseen so you can see them again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'default',
          onPress: async () => {
            try {
              await database.resetAllEncouragements();
              await loadStorageData(); // Reload stats
              Alert.alert('Success', 'All encouragements have been reset!');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset encouragements');
            }
          }
        }
      ]
    );
  };

  const handleResetDatabase = async () => {
    Alert.alert(
      'Reset Database?',
      'This will completely reset the database and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Database',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.resetDatabase();
              await loadStorageData(); // Reload data
              Alert.alert('Success', 'Database has been reset successfully.');
            } catch (error) {
              // console.error('Error resetting database:', error);
              Alert.alert('Error', 'Failed to reset database.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Screen</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Current Status:</Text>
        <Text style={styles.statusText}>
          Onboarded: {hasOnboarded === null ? 'Loading...' : hasOnboarded.toString()}
        </Text>
        <Text style={styles.statusText}>
          User Name: {userName || 'Not set'}
        </Text>
        <Text style={styles.statusText}>
          Encouragements: {encouragementStats ? `${encouragementStats.total} total (${encouragementStats.seen} liked, ${encouragementStats.unseen} unliked)` : 'Loading...'}
        </Text>
        <Text style={styles.statusText}>
          Sobriety Tracking: {sobrietyData?.tracking_sobriety ? 'Enabled' : 'Disabled'}
        </Text>
        {sobrietyData?.tracking_sobriety && sobrietyDays !== null && (
          <Text style={styles.statusText}>
            Days Sober: {sobrietyDays} (since {sobrietyData.sober_date ? new Date(sobrietyData.sober_date).toLocaleDateString() : 'Unknown'})
          </Text>
        )}
        <Text style={styles.statusText}>
          SOS Activations: {sosLogs.length} total
        </Text>
        {sosLogs.length > 0 && (
          <Text style={styles.statusText}>
            Last SOS: {new Date(sosLogs[0].timestamp).toLocaleString()}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <LargeButton
          title="Reset Onboarding"
          onPress={handleResetOnboarding}
          variant="danger"
        />
        <LargeButton
          title="Reset Encouragements"
          onPress={handleResetEncouragements}
          variant="secondary"
        />
        <LargeButton
          title="Debug Log Storage"
          onPress={handleDebugLog}
          variant="secondary"
        />
        <LargeButton
          title="Reset Database"
          onPress={handleResetDatabase}
          variant="danger"
        />
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to Test Onboarding:</Text>
        <Text style={styles.instructionsText}>
          1. Tap "Reset Onboarding" above{'\n'}
          2. App will restart and show loading screen{'\n'}
          3. Should route to welcome screen{'\n'}
          4. Enter your name and continue{'\n'}
          5. Should show personalized home screen
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    ...Fonts.largeTitle,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  statusContainer: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  statusLabel: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 16,
  },
  statusText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  buttonContainer: {
    marginBottom: 30,
  },
  instructions: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
  },
  instructionsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 12,
  },
  instructionsText: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
