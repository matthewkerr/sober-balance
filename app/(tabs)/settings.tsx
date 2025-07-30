import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Share,
  TextInput,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { database, SupportPerson } from '../../utils/database';
import { storage } from '../../utils/storage';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [dataStats, setDataStats] = useState({
    encouragements: { total: 0, seen: 0, unseen: 0 },
    sobrietyDays: 0,
    journalEntries: 0,
    intentions: 0,
    checkIns: 0,
    sosActivations: 0,
  });
  const [supportPerson, setSupportPerson] = useState<SupportPerson | null>(null);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [showSobrietyCounter, setShowSobrietyCounter] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadDataStats();
      loadSupportPerson();
      loadSobrietyCounterSetting();
      loadUserName();
    }, [])
  );

  const loadDataStats = async () => {
    try {
      setIsLoading(true);
      
      // Get encouragement stats
      const encouragementStats = await database.getEncouragementStats();
      
      // Get sobriety data
      const sobrietyData = await database.getSobrietyData();
      let sobrietyDays = 0;
      if (sobrietyData?.tracking_sobriety && sobrietyData?.sober_date) {
        const soberDate = new Date(sobrietyData.sober_date);
        const now = new Date();
        const timeDiff = now.getTime() - soberDate.getTime();
        sobrietyDays = Math.floor(timeDiff / (1000 * 3600 * 24));
      }

      // Get other data counts
      const journalEntries = await database.getJournalEntries();
      const intentions = await database.getIntentions();
      const checkIns = await database.getCheckInHistory();
      const sosLogs = await database.getSOSLogs();

      setDataStats({
        encouragements: encouragementStats || { total: 0, seen: 0, unseen: 0 },
        sobrietyDays,
        journalEntries: journalEntries.length,
        intentions: intentions.length,
        checkIns: checkIns.length,
        sosActivations: sosLogs.length,
      });
    } catch (error) {
      console.error('Error loading data stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSupportPerson = async () => {
    try {
      const person = await database.getSupportPerson();
      setSupportPerson(person);
      if (person) {
        setSupportName(person.name);
        setSupportPhone(person.phone);
      }
    } catch (error) {
      console.error('Error loading support person:', error);
    }
  };

  const loadSobrietyCounterSetting = async () => {
    try {
      const showCounter = await storage.getShowSobrietyCounter();
      setShowSobrietyCounter(showCounter);
    } catch (error) {
      console.error('Error loading sobriety counter setting:', error);
    }
  };

  const loadUserName = async () => {
    try {
      const name = await storage.getUserName();
      setUserName(name || '');
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  const handleEditUsername = () => {
    setNewUsername(userName);
    setShowUsernameModal(true);
  };

  const handleSaveUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert('Error', 'Please enter a name.');
      return;
    }

    if (newUsername.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      await storage.setUserName(newUsername.trim());
      await database.updateUserName(newUsername.trim());
      await loadUserName();
      setShowUsernameModal(false);
      Alert.alert('Success', 'Your name has been updated.');
    } catch (error) {
      console.error('Error saving username:', error);
      Alert.alert('Error', 'Failed to save name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelUsername = () => {
    setShowUsernameModal(false);
    setNewUsername('');
  };

  const handleResetEncouragements = () => {
    Alert.alert(
      'Reset Encouragements',
      'This will reset all encouragement messages to unliked state. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await database.resetAllEncouragements();
              await loadDataStats();
              Alert.alert('Success', 'Encouragements have been reset.');
            } catch (error) {
              console.error('Error resetting encouragements:', error);
              Alert.alert('Error', 'Failed to reset encouragements. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleResetSobriety = () => {
    Alert.alert(
      'Reset Sobriety Tracking',
      'This will reset your sobriety days to 0. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await database.saveSobrietyData(false);
              await storage.setSobrietyData({ trackingSobriety: false });
              await loadDataStats();
              Alert.alert('Success', 'Sobriety tracking has been reset.');
            } catch (error) {
              console.error('Error resetting sobriety:', error);
              Alert.alert('Error', 'Failed to reset sobriety tracking. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your personal data and reset your onboarding. You will be taken to the onboarding flow to start fresh. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await database.clearUserData();
              await storage.setHasCompletedOnboarding(false);
              await database.updateUserOnboarding(false, 1);
              router.replace('/onboarding');
            } catch (error) {
              console.error('Error deleting user data:', error);
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleExportData = async () => {
    try {
      setIsLoading(true);
      
      // Collect all data
      const encouragements = await database.getEncouragementStats();
      const sobrietyData = await database.getSobrietyData();
      const journalEntries = await database.getJournalEntries();
      const intentions = await database.getIntentions();
      const checkIns = await database.getCheckInHistory();
      const sosLogs = await database.getSOSLogs();
      const user = await database.getUser();

      const exportData = {
        exportDate: new Date().toISOString(),
        user,
        sobrietyData,
        encouragements,
        journalEntries,
        intentions,
        checkIns,
        sosLogs,
      };

      const dataString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: `Sober Balance Data Export\n\n${dataString}`,
        title: 'Sober Balance Data Export',
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSupportPerson = () => {
    setShowSupportModal(true);
  };

  const handleSaveSupportPerson = async () => {
    if (!supportName.trim() || !supportPhone.trim()) {
      Alert.alert('Error', 'Please enter both name and phone number.');
      return;
    }

    try {
      setIsLoading(true);
      await database.saveSupportPerson(supportName.trim(), supportPhone.trim());
      await loadSupportPerson();
      setShowSupportModal(false);
      Alert.alert('Success', 'Support person information updated.');
    } catch (error) {
      console.error('Error saving support person:', error);
      Alert.alert('Error', 'Failed to save support person. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveSupportPerson = () => {
    Alert.alert(
      'Remove Support Person',
      'Are you sure you want to remove your support person?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await database.saveSupportPerson('', ''); // Clear the support person
              await loadSupportPerson();
              setSupportName('');
              setSupportPhone('');
              Alert.alert('Success', 'Support person removed.');
            } catch (error) {
              console.error('Error removing support person:', error);
              Alert.alert('Error', 'Failed to remove support person. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset your onboarding status and take you to the onboarding flow. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Onboarding',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await storage.setHasCompletedOnboarding(false);
              await database.updateUserOnboarding(false, 1);
              router.replace('/onboarding');
            } catch (error) {
              console.error('Error resetting onboarding:', error);
              Alert.alert('Error', 'Failed to reset onboarding. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleToggleSobrietyCounter = async () => {
    try {
      const newValue = !showSobrietyCounter;
      await storage.setShowSobrietyCounter(newValue);
      setShowSobrietyCounter(newValue);
      Alert.alert(
        'Sobriety Counter Updated',
        newValue ? 'Sobriety counter is now visible on the home screen.' : 'Sobriety counter is now hidden from the home screen.'
      );
    } catch (error) {
      console.error('Error toggling sobriety counter:', error);
      Alert.alert('Error', 'Failed to update sobriety counter setting. Please try again.');
    }
  };

  const SettingItem = ({ title, subtitle, onPress, destructive = false }: {
    title: string;
    subtitle?: string;
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, destructive && styles.destructiveItem]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, destructive && styles.destructiveText]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, destructive && styles.destructiveSubtext]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={styles.settingArrow}>›</Text>
    </TouchableOpacity>
  );

  const ToggleSettingItem = ({ title, subtitle, value, onToggle }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onToggle}
      disabled={isLoading}
      activeOpacity={0.7}
    >
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={[styles.toggle, value && styles.toggleActive]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          
          <SettingItem
            title="Edit Name"
            subtitle={userName ? `Current name: ${userName}` : "Set your display name"}
            onPress={handleEditUsername}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Person</Text>
          
          {supportPerson ? (
            <View style={styles.supportInfoCard}>
              <View style={styles.supportInfoHeader}>
                <Text style={styles.supportInfoIcon}>🤝</Text>
                <Text style={styles.supportInfoName}>{supportPerson.name}</Text>
              </View>
              <Text style={styles.supportInfoPhone}>{supportPerson.phone}</Text>
            </View>
          ) : (
            <View style={styles.noSupportCard}>
              <Text style={styles.noSupportText}>No support person set</Text>
            </View>
          )}
          
          <SettingItem
            title={supportPerson ? "Edit Support Person" : "Add Support Person"}
            subtitle={supportPerson ? "Update name and phone number" : "Set up someone to reach out to"}
            onPress={handleEditSupportPerson}
          />
          
          {supportPerson && (
            <SettingItem
              title="Remove Support Person"
              subtitle="Remove from your support network"
              onPress={handleRemoveSupportPerson}
              destructive={true}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display Preferences</Text>
          
          <ToggleSettingItem
            title="Show Sobriety Counter"
            subtitle={showSobrietyCounter ? "Visible on home screen" : "Hidden from home screen"}
            value={showSobrietyCounter}
            onToggle={handleToggleSobrietyCounter}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <SettingItem
            title="Export All Data"
            subtitle="Download a copy of all your data"
            onPress={handleExportData}
          />
          
          <SettingItem
            title="Reset Encouragements"
            subtitle={`${dataStats.encouragements.seen} liked messages will be reset`}
            onPress={handleResetEncouragements}
          />
          
          <SettingItem
            title="Reset Sobriety Days"
            subtitle={`Currently ${dataStats.sobrietyDays} days sober`}
            onPress={handleResetSobriety}
          />
          
          <SettingItem
            title="Reset Onboarding"
            subtitle="Start onboarding process again"
            onPress={handleResetOnboarding}
            destructive={true}
          />
          
          <SettingItem
            title="Delete All Data"
            subtitle="Permanently delete everything"
            onPress={handleDeleteAllData}
            destructive={true}
          />
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </ScrollView>

      {/* Support Person Modal */}
      <Modal
        visible={showSupportModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {supportPerson ? 'Edit Support Person' : 'Add Support Person'}
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={supportName}
                onChangeText={setSupportName}
                placeholder="Enter their name"
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={supportPhone}
                onChangeText={setSupportPhone}
                placeholder="Enter their phone number"
                placeholderTextColor={Colors.textLight}
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSupportModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveSupportPerson}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Username Modal */}
      <Modal
        visible={showUsernameModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelUsername}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={newUsername}
                onChangeText={setNewUsername}
                placeholder="Enter your name"
                placeholderTextColor={Colors.textLight}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="done"
                maxLength={50}
              />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelUsername}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveUsername}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    ...Fonts.largeTitle,
    color: Colors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 16,
  },
  statsContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statNumber: {
    ...Fonts.title,
    color: Colors.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...Fonts.body,
    color: Colors.textSecondary,
  },
  settingItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  destructiveItem: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    ...Fonts.caption,
    color: Colors.textSecondary,
  },
  destructiveText: {
    color: '#DC2626',
  },
  destructiveSubtext: {
    color: '#EF4444',
  },
  settingArrow: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Fonts.body,
    color: Colors.textSecondary,
  },
  supportInfoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  supportInfoIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  supportInfoName: {
    ...Fonts.title,
    color: Colors.text,
    fontWeight: '600',
  },
  supportInfoPhone: {
    ...Fonts.body,
    color: Colors.primary,
    fontWeight: '500',
  },
  noSupportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noSupportText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    ...Fonts.largeTitle,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    ...Fonts.body,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  textInput: {
    ...Fonts.body,
    color: Colors.text,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Fonts.body,
    color: Colors.surface,
    fontWeight: '600',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
}); 