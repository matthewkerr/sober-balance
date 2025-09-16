import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Linking,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { database, SupportPerson } from '../../utils/database';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const [supportPerson, setSupportPerson] = useState<SupportPerson | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadSupportPerson();
    }, [])
  );

  const loadSupportPerson = async () => {
    try {
      setIsLoading(true);
      const person = await database.getSupportPerson();
      setSupportPerson(person);
    } catch (error) {
      // console.error('Error loading support person:', error);
      Alert.alert('Error', 'Failed to load support person information.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSupportPerson = () => {
    setShowAddModal(true);
  };

  const handleSaveSupportPerson = async () => {
    if (!supportName.trim() || !supportPhone.trim()) {
      Alert.alert('Error', 'Please enter both name and phone number.');
      return;
    }

    if (supportPhone.trim().length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number (at least 10 digits).');
      return;
    }

    try {
      setIsLoading(true);
      await database.saveSupportPerson(supportName.trim(), supportPhone.trim());
      await loadSupportPerson();
      setShowAddModal(false);
      setSupportName('');
      setSupportPhone('');
      Alert.alert('Success', 'Support person added successfully!');
    } catch (error) {
      // console.error('Error saving support person:', error);
      Alert.alert('Error', 'Failed to save support person. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setSupportName('');
    setSupportPhone('');
  };

  const handleCallSupport = () => {
    if (!supportPerson?.phone) {
      Alert.alert('Error', 'No phone number available.');
      return;
    }

    Alert.alert(
      'Call Support Person',
      `Would you like to call ${supportPerson.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          style: 'default',
          onPress: () => {
            const phoneNumber = supportPerson.phone.replace(/\s/g, '');
            const url = `tel:${phoneNumber}`;
            
            Linking.canOpenURL(url)
              .then((supported) => {
                if (supported) {
                  return Linking.openURL(url);
                } else {
                  Alert.alert('Error', 'Unable to make phone calls on this device.');
                }
              })
              .catch((error) => {
                // console.error('Error opening phone app:', error);
                Alert.alert('Error', 'Failed to open phone app. Please try again.');
              });
          }
        }
      ]
    );
  };

  if (!supportPerson) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.statusBarBackground, { height: insets.top }]} />
        <View style={styles.container}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(20, insets.bottom + 20) }
            ]}
            showsVerticalScrollIndicator={false}
            bounces={true}
            alwaysBounceVertical={true}
          >
            <View style={styles.content}>
              <Text style={styles.title}>Support Person</Text>
              <View style={styles.noSupportCard}>
                <Text style={styles.noSupportIcon}>❤️</Text>
                <Text style={styles.noSupportTitle}>No Support Person Set</Text>
                <Text style={styles.noSupportText}>
                  Would you like to add a support person you can reach out to in case of emergency?
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleAddSupportPerson}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addButtonText}>Add Support Person</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Add Support Person Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancelAdd}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Support Person</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={supportName}
                  onChangeText={setSupportName}
                  placeholder="Enter their name"
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyType="next"
                  maxLength={50}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={supportPhone}
                  onChangeText={setSupportPhone}
                  placeholder="Enter their phone number"
                  keyboardType="phone-pad"
                  returnKeyType="done"
                  maxLength={20}
                />
              </View>

              <View style={styles.modalNote}>
                <Text style={styles.modalNoteText}>
                  💙 This person will be available as a quick contact option during difficult moments.
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancelAdd}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(20, insets.bottom + 20) }
          ]}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={true}
        >
          <View style={styles.content}>
            <Text style={styles.title}>Support Person</Text>
            
            <View style={styles.supportCard}>
              <View style={styles.supportHeader}>
                <Text style={styles.supportName}>{supportPerson.name}</Text>
              </View>
              
              <Text style={styles.supportPhone}>{supportPerson.phone}</Text>
              
              <Text style={styles.supportMessage}>
                Reach out when you need support. You're not alone in this journey.
              </Text>
              
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallSupport}
                activeOpacity={0.8}
              >
                <Text style={styles.callButtonIcon}>📞</Text>
                <Text style={styles.callButtonText}>Call {supportPerson.name}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.reminderCard}>
              <Text style={styles.reminderTitle}>❤️ You Matter</Text>
              <Text style={styles.reminderText}>
                It's okay to ask for help. Your support person is here because they care about you.
              </Text>
            </View>

            {/* Crisis Resources Section */}
            <View style={styles.crisisSection}>
              <Text style={styles.crisisTitle}>🆘 Crisis Support</Text>
              <Text style={styles.crisisSubtitle}>
                If you need immediate help, these resources are available 24/7
              </Text>
              
              <View style={styles.crisisResources}>
                <TouchableOpacity
                  style={styles.crisisResource}
                  onPress={() => Linking.openURL('tel:1-800-662-4357')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.crisisResourceName}>SAMHSA National Helpline</Text>
                  <Text style={styles.crisisResourceNumber}>1-800-662-4357</Text>
                  <Text style={styles.crisisResourceDescription}>
                    Free, confidential treatment referral and information service for individuals and families facing mental health and substance use disorders. Available 24/7 in English and Spanish.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.crisisResource}
                  onPress={() => Linking.openURL('tel:988')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.crisisResourceName}>Crisis Lifeline</Text>
                  <Text style={styles.crisisResourceNumber}>988</Text>
                  <Text style={styles.crisisResourceDescription}>
                    National suicide prevention and crisis intervention service. Provides immediate support for anyone in emotional distress or suicidal crisis. Available 24/7.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.crisisResource}
                  onPress={() => Linking.openURL('tel:988')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.crisisResourceName}>Veterans Crisis Line</Text>
                  <Text style={styles.crisisResourceNumber}>988, then press 1</Text>
                  <Text style={styles.crisisResourceDescription}>
                    Confidential crisis support for veterans and their families. No VA enrollment required. Conversations are private and benefits are not affected by seeking help.
                  </Text>
                </TouchableOpacity>

                <View style={styles.crisisResource}>
                  <Text style={styles.crisisResourceName}>Crisis Text Line</Text>
                  <Text style={styles.crisisResourceNumber}>Text: HOME to 741741</Text>
                  <Text style={styles.crisisResourceDescription}>
                    Free, 24/7 crisis support via text message. Connect with trained crisis counselors who provide emotional support and crisis intervention through confidential text conversations.
                  </Text>
                </View>
              </View>

              {/* Additional Support Groups */}
              <View style={styles.supportGroupsSection}>
                <Text style={styles.supportGroupsTitle}>🤝 Support Groups</Text>
                <Text style={styles.disclaimerText}>
                  Sober Balance has no affiliation with these organizations. We simply want to provide you with additional resources that many people find helpful in their recovery journey.
                </Text>
                
                <View style={styles.supportGroupResources}>
                  <TouchableOpacity
                    style={styles.supportGroupResource}
                    onPress={() => Linking.openURL('https://aa.org')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.supportGroupName}>Alcoholics Anonymous (AA)</Text>
                    <Text style={styles.supportGroupNumber}>aa.org</Text>
                    <Text style={styles.supportGroupDescription}>
                      A fellowship of people who share their experience, strength, and hope with each other to solve their common problem and help others recover from alcoholism.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.supportGroupResource}
                    onPress={() => Linking.openURL('https://na.org')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.supportGroupName}>Narcotics Anonymous (NA)</Text>
                    <Text style={styles.supportGroupNumber}>na.org</Text>
                    <Text style={styles.supportGroupDescription}>
                      A community-based organization of men and women for whom drugs had become a major problem. Members help each other stay clean through a program of complete abstinence.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.supportGroupResource}
                    onPress={() => Linking.openURL('https://smartrecovery.org')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.supportGroupName}>SMART Recovery</Text>
                    <Text style={styles.supportGroupNumber}>smartrecovery.org</Text>
                    <Text style={styles.supportGroupDescription}>
                      Self-Management and Recovery Training - a science-based program that helps people recover from addiction using cognitive behavioral therapy techniques and peer support.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.supportGroupResource}
                    onPress={() => Linking.openURL('https://lifering.org')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.supportGroupName}>LifeRing Secular Recovery</Text>
                    <Text style={styles.supportGroupNumber}>lifering.org</Text>
                    <Text style={styles.supportGroupDescription}>
                      A secular recovery program that emphasizes personal responsibility and peer support without religious or spiritual requirements. Focuses on building a sober lifestyle.
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Meeting Locators */}
              <View style={styles.meetingLocatorsSection}>
                <Text style={styles.meetingLocatorsTitle}>📍 Meeting Locators</Text>
                <Text style={styles.meetingLocatorsSubtitle}>
                  Find local meetings and support groups in your area
                </Text>
                
                <View style={styles.meetingLocatorsList}>
                  <TouchableOpacity
                    style={styles.meetingLocatorResource}
                    onPress={() => Linking.openURL('https://aa.org/meeting-finder')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.meetingLocatorName}>AA Meeting Finder</Text>
                    <Text style={styles.meetingLocatorWebsite}>aa.org/meeting-finder</Text>
                    <Text style={styles.meetingLocatorDescription}>
                      Find local Alcoholics Anonymous meetings in your area. Search by location, time, and meeting type including in-person, online, and hybrid options.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.meetingLocatorResource}
                    onPress={() => Linking.openURL('https://na.org/meeting-search')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.meetingLocatorName}>NA Meeting Locator</Text>
                    <Text style={styles.meetingLocatorWebsite}>na.org/meeting-search</Text>
                    <Text style={styles.meetingLocatorDescription}>
                      Search for Narcotics Anonymous meetings near you. Includes meeting details, accessibility information, and special focus groups.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.meetingLocatorResource}
                    onPress={() => Linking.openURL('https://smartrecovery.org/meetings')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.meetingLocatorName}>SMART Recovery Meetings</Text>
                    <Text style={styles.meetingLocatorWebsite}>smartrecovery.org/meetings</Text>
                    <Text style={styles.meetingLocatorDescription}>
                      Find SMART Recovery meetings and online sessions. Includes both in-person and virtual options with science-based recovery tools.
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Family & Friends Support */}
              <View style={styles.familySupportSection}>
                <Text style={styles.familySupportTitle}>👨‍👩‍👧‍👦 Family & Friends Support</Text>
                <Text style={styles.familySupportSubtitle}>
                  Resources for families and friends supporting someone in recovery
                </Text>
                
                <View style={styles.familySupportList}>
                  <TouchableOpacity
                    style={styles.familySupportResource}
                    onPress={() => Linking.openURL('https://al-anon.org')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.familySupportName}>Al-Anon Family Groups</Text>
                    <Text style={styles.familySupportWebsite}>al-anon.org</Text>
                    <Text style={styles.familySupportDescription}>
                      Support for families and friends of alcoholics. Learn about addiction, set healthy boundaries, and find community with others who understand your experience.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.familySupportResource}
                    onPress={() => Linking.openURL('https://nar-anon.org')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.familySupportName}>Nar-Anon Family Groups</Text>
                    <Text style={styles.familySupportWebsite}>nar-anon.org</Text>
                    <Text style={styles.familySupportDescription}>
                      Support for families and friends of drug users. Find understanding, hope, and practical tools for coping with a loved one's addiction.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.familySupportResource}
                    onPress={() => Linking.openURL('https://smartrecovery.org/family-friends')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.familySupportName}>SMART Recovery Family & Friends</Text>
                    <Text style={styles.familySupportWebsite}>smartrecovery.org/family-friends</Text>
                    <Text style={styles.familySupportDescription}>
                      Science-based support for families. Learn evidence-based strategies for supporting recovery while maintaining your own wellbeing.
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Online/Virtual Meeting Options */}
              <View style={styles.onlineMeetingsSection}>
                <Text style={styles.onlineMeetingsTitle}>💻 Online/Virtual Meetings</Text>
                <Text style={styles.onlineMeetingsSubtitle}>
                  Access support from anywhere with virtual meeting options
                </Text>
                
                <View style={styles.onlineMeetingsList}>
                  <TouchableOpacity
                    style={styles.onlineMeetingResource}
                    onPress={() => Linking.openURL('https://aa-intergroup.org')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.onlineMeetingName}>AA Online Intergroup</Text>
                    <Text style={styles.onlineMeetingWebsite}>aa-intergroup.org</Text>
                    <Text style={styles.onlineMeetingDescription}>
                      Online AA meetings and resources available 24/7. Join virtual meetings from anywhere with internet access, including phone and video options.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.onlineMeetingResource}
                    onPress={() => Linking.openURL('https://na.org/online-meetings')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.onlineMeetingName}>NA Online Meetings</Text>
                    <Text style={styles.onlineMeetingWebsite}>na.org/online-meetings</Text>
                    <Text style={styles.onlineMeetingDescription}>
                      Virtual NA meetings and support groups. Access meetings via phone, video, or chat platforms with options for different time zones and languages.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.onlineMeetingResource}
                    onPress={() => Linking.openURL('https://smartrecovery.org/online')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.onlineMeetingName}>SMART Recovery Online</Text>
                    <Text style={styles.onlineMeetingWebsite}>smartrecovery.org/online</Text>
                    <Text style={styles.onlineMeetingDescription}>
                      Online SMART Recovery meetings and tools. Access science-based recovery resources, virtual meetings, and interactive tools from your device.
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Additional Resources */}
              <View style={styles.additionalResourcesSection}>
                <Text style={styles.additionalResourcesTitle}>📚 Additional Resources</Text>
                <Text style={styles.additionalResourcesSubtitle}>
                  More resources for mental health and crisis support
                </Text>
                
                <View style={styles.additionalResourcesList}>
                  <TouchableOpacity
                    style={styles.additionalResource}
                    onPress={() => Linking.openURL('https://mhanational.org')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.additionalResourceName}>Mental Health America</Text>
                    <Text style={styles.additionalResourceNumber}>mhanational.org</Text>
                    <Text style={styles.additionalResourceDescription}>
                      National community-based nonprofit dedicated to addressing mental health needs and promoting mental wellness for all Americans.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.additionalResource}
                    onPress={() => Linking.openURL('https://nami.org')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.additionalResourceName}>National Alliance on Mental Illness (NAMI)</Text>
                    <Text style={styles.additionalResourceNumber}>nami.org</Text>
                    <Text style={styles.additionalResourceDescription}>
                      The nation's largest grassroots mental health organization dedicated to building better lives for Americans affected by mental illness.
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.additionalResource}
                    onPress={() => Linking.openURL('https://mentalhealth.va.gov')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.additionalResourceName}>VA Mental Health Services</Text>
                    <Text style={styles.additionalResourceNumber}>mentalhealth.va.gov</Text>
                    <Text style={styles.additionalResourceDescription}>
                      Free, confidential mental health and substance use support for veterans. Judgment-free care with privacy protections and no impact on benefits.
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Bottom spacer to ensure content isn't hidden behind navigation */}
            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: '100%',
  },
  content: {
    flex: 1,
    padding: 16, // Reduced from 20
    paddingTop: 16, // Reduced from 20
  },
  title: {
    ...Fonts.headline, // Changed from largeTitle to headline for smaller size
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20, // Reduced from 25
  },
  supportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20, // Reduced from 24
    marginBottom: 16, // Reduced from 20
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  supportIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  supportName: {
    ...Fonts.title, // Changed from largeTitle to title for smaller size
    color: Colors.text,
    fontWeight: '700',
  },
  supportPhone: {
    ...Fonts.body, // Changed from title to body for smaller size
    color: Colors.primary,
    marginBottom: 16, // Reduced from 20
    fontWeight: '600',
  },
  supportMessage: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20, // Reduced from 30
  },
  callButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14, // Reduced from 16
    paddingHorizontal: 24, // Reduced from 32
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  callButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  callButtonText: {
    ...Fonts.title,
    color: Colors.surface,
    fontWeight: '600',
  },
  reminderCard: {
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
    padding: 18, // Reduced from 20
    alignItems: 'center',
    marginBottom: 16, // Added bottom margin for better spacing
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  reminderTitle: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 12,
    fontWeight: '600',
  },
  reminderText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  crisisSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  crisisTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  crisisSubtitle: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  crisisResources: {
    gap: 12,
  },
  crisisResource: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  crisisResourceName: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  crisisResourceNumber: {
    ...Fonts.body,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  crisisResourceDescription: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  supportGroupsSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  supportGroupsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  disclaimerText: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  supportGroupResources: {
    gap: 12,
  },
  supportGroupResource: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  supportGroupName: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  supportGroupNumber: {
    ...Fonts.body,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  supportGroupDescription: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  additionalResourcesSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  additionalResourcesTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  additionalResourcesSubtitle: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  additionalResourcesList: {
    gap: 12,
  },
  additionalResource: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  additionalResourceName: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  additionalResourceNumber: {
    ...Fonts.body,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  additionalResourceDescription: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  meetingLocatorsSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  meetingLocatorsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  meetingLocatorsSubtitle: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  meetingLocatorsList: {
    gap: 12,
  },
  meetingLocatorResource: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  meetingLocatorName: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  meetingLocatorWebsite: {
    ...Fonts.body,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  meetingLocatorDescription: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  familySupportSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  familySupportTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  familySupportSubtitle: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  familySupportList: {
    gap: 12,
  },
  familySupportResource: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  familySupportName: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  familySupportWebsite: {
    ...Fonts.body,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  familySupportDescription: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  onlineMeetingsSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  onlineMeetingsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  onlineMeetingsSubtitle: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  onlineMeetingsList: {
    gap: 12,
  },
  onlineMeetingResource: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  onlineMeetingName: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  onlineMeetingWebsite: {
    ...Fonts.body,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  onlineMeetingDescription: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  noSupportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24, // Reduced from 28
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noSupportIcon: {
    fontSize: 48,
    marginBottom: 12, // Reduced from 16
  },
  noSupportTitle: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 10, // Reduced from 12
    textAlign: 'center',
  },
  noSupportText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14, // Reduced from 16
    paddingHorizontal: 24, // Reduced from 32
    marginTop: 20, // Reduced from 24
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    ...Fonts.title,
    color: Colors.surface,
    fontWeight: '600',
    textAlign: 'center',
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
    padding: 30,
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
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    ...Fonts.body,
    color: Colors.text,
    marginBottom: 8,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalNote: {
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  modalNoteText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    ...Fonts.body,
    color: Colors.surface,
    fontWeight: '600',
  },
}); 