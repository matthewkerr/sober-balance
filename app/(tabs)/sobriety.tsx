import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  TextInput,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { database } from '../../utils/database';
import { storage } from '../../utils/storage';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { calculateSobrietyDaysByDate } from '../../utils/database';
import { getEncouragementMessage, getMilestoneMessage, shouldShowMilestone } from '../../utils/safeTracking';

export default function SobrietyScreen() {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [sobrietyData, setSobrietyData] = useState<any>(null);
  const [sobrietyDays, setSobrietyDays] = useState<number>(0);
  const [showSobrietyModal, setShowSobrietyModal] = useState(false);
  const [showTimeInputModal, setShowTimeInputModal] = useState(false);
  const [wantsTracking, setWantsTracking] = useState<boolean | null>(null);
  const [trackingMode, setTrackingMode] = useState<'sober' | 'trying' | null>(null);
  const [soberYears, setSoberYears] = useState('');
  const [soberMonths, setSoberMonths] = useState('');
  const [soberDays, setSoberDays] = useState('');
  const [showMilestone, setShowMilestone] = useState(false);
  const [milestoneMessage, setMilestoneMessage] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    loadSobrietyData();
    
    // Animate in the content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadSobrietyData = async () => {
    try {
      const data = await database.getSobrietyData();
      setSobrietyData(data);
      
      if (data && data.tracking_sobriety && data.sober_date) {
        const daysDiff = calculateSobrietyDaysByDate(data.sober_date);
        setSobrietyDays(daysDiff);
        
        // Check for milestones
        if (shouldShowMilestone(daysDiff)) {
          setMilestoneMessage(getMilestoneMessage(daysDiff));
          setShowMilestone(true);
        }
      } else {
        setSobrietyDays(0);
      }
    } catch (error) {
      // console.error('Error loading sobriety data:', error);
    }
  };

  const calculateSoberDate = () => {
    const years = parseInt(soberYears) || 0;
    const months = parseInt(soberMonths) || 0;
    const days = parseInt(soberDays) || 0;

    const now = new Date();
    const soberDate = new Date(now);
    
    soberDate.setFullYear(soberDate.getFullYear() - years);
    soberDate.setMonth(soberDate.getMonth() - months);
    soberDate.setDate(soberDate.getDate() - days);
    
    return soberDate.toISOString();
  };

  const handleSetupSobrietyTracking = () => {
    // Reset state for first modal
    setWantsTracking(null);
    setTrackingMode(null);
    setShowSobrietyModal(true);
    setShowTimeInputModal(false);
  };

  const handleTrackingOptionSelected = (tracking: boolean, mode?: 'sober' | 'trying') => {
    setWantsTracking(tracking);
    if (tracking && mode) {
      setTrackingMode(mode);
      
      // If user already has tracking enabled, populate with current data
      if (sobrietyData?.tracking_sobriety && sobrietyDays !== null) {
        const years = Math.floor(sobrietyDays / 365);
        const months = Math.floor((sobrietyDays % 365) / 30);
        const days = sobrietyDays % 30;
        
        setSoberYears(years.toString());
        setSoberMonths(months.toString());
        setSoberDays(days.toString());
      } else {
        setSoberYears('');
        setSoberMonths('');
        setSoberDays('');
      }
    }
    
    // Keep first modal open and open second modal on top
    setShowTimeInputModal(true);
  };

  const handleSaveSobrietyTracking = async () => {
    if (wantsTracking === null) {
      Alert.alert('Selection Required', 'Please choose whether you want to track your progress.');
      return;
    }

    if (wantsTracking && trackingMode === null) {
      Alert.alert('Tracking Mode Required', 'Please select whether you want to track days sober or days trying to be sober.');
      return;
    }

    if (wantsTracking) {
      const years = parseInt(soberYears) || 0;
      const months = parseInt(soberMonths) || 0;
      const days = parseInt(soberDays) || 0;

      if (years === 0 && months === 0 && days === 0) {
        Alert.alert('Time Required', 'Please enter at least some time (days, months, or years) for your sobriety tracking.');
        return;
      }

      if (years > 50) {
        Alert.alert('Invalid Years', 'Please enter a reasonable number of years (50 or less).');
        return;
      }

      if (months > 11) {
        Alert.alert('Invalid Months', 'Please enter 0-11 months (12+ months should be counted as years).');
        return;
      }

      if (days > 365) {
        Alert.alert('Invalid Days', 'Please enter 0-365 days (365+ days should be counted as months/years).');
        return;
      }
    }

    try {
      setIsLoading(true);
      if (wantsTracking) {
        const soberDate = calculateSoberDate();
        await storage.setSobrietyData({
          trackingSobriety: true,
          trackingMode: trackingMode!,
          soberDate: soberDate
        });
        await database.saveSobrietyData(true, trackingMode!, soberDate);
      } else {
        await storage.setSobrietyData({
          trackingSobriety: false,
          trackingMode: 'sober'
        });
        await database.saveSobrietyData(false, 'sober');
      }
      
      await loadSobrietyData();
      setShowSobrietyModal(false);
      Alert.alert('Success', wantsTracking ? 'Sobriety tracking has been enabled!' : 'Sobriety tracking has been disabled.');
    } catch (error) {
      // console.error('Error saving sobriety tracking:', error);
      Alert.alert('Error', 'Failed to save sobriety tracking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSobrietyTracking = () => {
    setShowSobrietyModal(false);
    setShowTimeInputModal(false);
    setWantsTracking(null);
    setTrackingMode(null);
    setSoberYears('');
    setSoberMonths('');
    setSoberDays('');
  };

  const handleCancelTimeInput = () => {
    // Only close the second modal, keep first modal open
    setShowTimeInputModal(false);
    setWantsTracking(null);
    setTrackingMode(null);
    setSoberYears('');
    setSoberMonths('');
    setSoberDays('');
  };

  const handlePauseTracking = () => {
    Alert.alert(
      'Pause Sobriety Tracking?',
      'Starting over is brave, not failure. Every day you choose to try again is a victory. Would you like to pause your current tracking?',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Pause with Love',
          style: 'default',
          onPress: async () => {
            try {
              setIsLoading(true);
              await database.saveSobrietyData(false, 'sober');
              await storage.setSobrietyData({ 
                trackingSobriety: false,
                trackingMode: 'sober'
              });
              await loadSobrietyData();
              Alert.alert(
                'Tracking Paused', 
                'Your courage to start fresh is inspiring. You can resume tracking anytime.',
                [{ text: 'OK', style: 'default' }]
              );
            } catch (error) {
              // console.error('Error resetting sobriety:', error);
              Alert.alert('Error', 'Failed to pause sobriety tracking. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const formatSobrietyTime = (days: number) => {
    if (days === 0) return 'Today';
    if (days === 1) return '1 Day';
    if (days < 7) return `${days} Days`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      if (remainingDays === 0) return `${weeks} Week${weeks > 1 ? 's' : ''}`;
      return `${weeks} Week${weeks > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) return `${months} Month${months > 1 ? 's' : ''}`;
      return `${months} Month${months > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`;
    }
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    if (remainingDays === 0) return `${years} Year${years > 1 ? 's' : ''}`;
    return `${years} Year${years > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`;
  };

  const getTrackingIcon = () => {
    if (!sobrietyData?.tracking_sobriety) return '🤗';
    return sobrietyData.tracking_mode === 'trying' ? '💪' : '🌟';
  };

  const getTrackingTitle = () => {
    if (!sobrietyData?.tracking_sobriety) return 'Not Tracking';
    return sobrietyData.tracking_mode === 'trying' ? 'Days Trying' : 'Days Sober';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>

          
          {sobrietyData?.tracking_sobriety ? (
            <View style={styles.trackingCard}>
              <View style={styles.trackingHeader}>
                <Text style={styles.trackingIcon}>{getTrackingIcon()}</Text>
                <Text style={styles.trackingTitle}>{getTrackingTitle()}</Text>
              </View>
              
              <View style={styles.daysDisplay}>
                <Text style={styles.daysNumber}>{sobrietyDays}</Text>
                <Text style={styles.daysLabel}>{formatSobrietyTime(sobrietyDays)}</Text>
                <Text style={styles.sinceDate}>
                  {sobrietyData.sober_date ? 
                    `Since ${new Date(sobrietyData.sober_date).toLocaleDateString()}` : 
                    'Start date not set'
                  }
                </Text>
              </View>
              
              <Text style={styles.encouragementText}>
                {getEncouragementMessage(sobrietyDays, sobrietyData.tracking_mode)}
              </Text>
              
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.updateButton}
                  onPress={handleSetupSobrietyTracking}
                  disabled={isLoading}
                >
                  <Text style={styles.updateButtonText}>Update Tracking</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.pauseButton}
                  onPress={handlePauseTracking}
                  disabled={isLoading}
                >
                  <Text style={styles.pauseButtonText}>Pause Tracking</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.noTrackingCard}>
              <Text style={styles.noTrackingIcon}>🤗</Text>
              <Text style={styles.noTrackingTitle}>No Tracking Set Up</Text>
              <Text style={styles.noTrackingSubtitle}>
                Start tracking your journey whenever you're ready. There's no pressure - you can begin anytime.
              </Text>
              
              <TouchableOpacity 
                style={styles.startButton}
                onPress={handleSetupSobrietyTracking}
                disabled={isLoading}
              >
                <Text style={styles.startButtonText}>Start Tracking</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>About Sobriety Tracking</Text>
            <Text style={styles.infoText}>
              Whether you're celebrating days of sobriety or honoring your commitment to trying, 
              every effort counts. You can track your progress, pause anytime, or start fresh - 
              whatever feels right for your journey.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Milestone Modal */}
      <Modal
        visible={showMilestone}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMilestone(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.milestoneModal}>
            <Text style={styles.milestoneIcon}>🎉</Text>
            <Text style={styles.milestoneTitle}>Milestone Reached!</Text>
            <Text style={styles.milestoneMessage}>{milestoneMessage}</Text>
            <TouchableOpacity
              style={styles.milestoneButton}
              onPress={() => setShowMilestone(false)}
            >
              <Text style={styles.milestoneButtonText}>Continue Journey</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sobriety Tracking Setup Modal */}
      <Modal
        visible={showSobrietyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelSobrietyTracking}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sobrietyOptionsModalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancelSobrietyTracking}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              <View style={styles.sobrietyOptionsSection}>
                <TouchableOpacity
                  style={[styles.sobrietyOption, wantsTracking === true && trackingMode === 'sober' && styles.sobrietyOptionSelected]}
                  onPress={() => handleTrackingOptionSelected(true, 'sober')}
                >
                  <Text style={[styles.sobrietyOptionText, wantsTracking === true && trackingMode === 'sober' && styles.sobrietyOptionTextSelected]}>
                    🌟 Track my days sober
                  </Text>
                  <Text style={styles.sobrietyOptionSubtext}>
                    Celebrate every day of sobriety
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.sobrietyOption, wantsTracking === true && trackingMode === 'trying' && styles.sobrietyOptionSelected]}
                  onPress={() => handleTrackingOptionSelected(true, 'trying')}
                >
                  <Text style={[styles.sobrietyOptionText, wantsTracking === true && trackingMode === 'trying' && styles.sobrietyOptionTextSelected]}>
                    💪 Track my days trying to be sober
                  </Text>
                  <Text style={styles.sobrietyOptionSubtext}>
                    Honor every effort and commitment
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.sobrietyOption, wantsTracking === false && styles.sobrietyOptionSelected]}
                  onPress={() => handleTrackingOptionSelected(false)}
                >
                  <Text style={[styles.sobrietyOptionText, wantsTracking === false && styles.sobrietyOptionTextSelected]}>
                    🤗 I prefer not to track right now
                  </Text>
                  <Text style={styles.sobrietyOptionSubtext}>
                    Self-care comes first - you can always start later
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
          
          {/* Time Input Modal - Rendered inside the first modal */}
          {showTimeInputModal && (
            <View style={styles.secondModalOverlay}>
              <View style={styles.sobrietyModalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {wantsTracking === false 
                      ? 'Disable Tracking' 
                      : trackingMode === 'sober' 
                        ? 'Days Sober' 
                        : 'Days Trying'
                    }
                  </Text>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleCancelTimeInput}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView 
                  style={styles.modalScrollView}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={true}
                  bounces={true}
                >
                  <View style={styles.trackingDetailsSection}>
                    <Text style={styles.trackingDetailsTitle}>
                      {wantsTracking === false 
                        ? 'Disable Tracking' 
                        : trackingMode === 'sober' 
                          ? 'How long have you been sober?' 
                          : 'How long have you been trying?'
                      }
                    </Text>
                    
                    <Text style={styles.trackingDetailsSubtitle}>
                      {wantsTracking === false 
                        ? 'You can always start tracking again later.' 
                        : 'Enter the time since your last use (approximate is fine).'
                      }
                    </Text>

                    {wantsTracking === false ? (
                      <View style={styles.disableTrackingMessage}>
                        <Text style={styles.disableTrackingText}>
                          You've chosen to pause tracking. This is completely okay - self-care comes first. 
                          You can always restart tracking whenever you're ready.
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.timeInputSection}>
                        <View style={styles.timeInputRow}>
                          <View style={styles.timeInputContainer}>
                            <Text style={styles.timeInputLabel}>Years</Text>
                            <TextInput
                              style={styles.timeInput}
                              value={soberYears}
                              onChangeText={setSoberYears}
                              placeholder="0"
                              keyboardType="numeric"
                              maxLength={2}
                            />
                          </View>
                          
                          <View style={styles.timeInputContainer}>
                            <Text style={styles.timeInputLabel}>Months</Text>
                            <TextInput
                              style={styles.timeInput}
                              value={soberMonths}
                              onChangeText={setSoberMonths}
                              placeholder="0"
                              keyboardType="numeric"
                              maxLength={2}
                            />
                          </View>
                          
                          <View style={styles.timeInputContainer}>
                            <Text style={styles.timeInputLabel}>Days</Text>
                            <TextInput
                              style={styles.timeInput}
                              value={soberDays}
                              onChangeText={setSoberDays}
                              placeholder="0"
                              keyboardType="numeric"
                              maxLength={2}
                            />
                          </View>
                        </View>
                        
                        <View style={styles.encouragementMessage}>
                          <Text style={styles.encouragementText}>
                            {trackingMode === 'sober' 
                              ? 'Every day of sobriety is a victory worth celebrating. You\'re doing amazing! 🌟'
                              : 'Every day you choose to try is a step forward. Your commitment matters! 💪'
                            }
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </ScrollView>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelTimeInput}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveSobrietyTracking}
                    disabled={isLoading}
                  >
                    <Text style={styles.saveButtonText}>
                      {isLoading ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
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
  content: {
    flex: 1,
  },
  title: {
    ...Fonts.largeTitle,
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  trackingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  trackingIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  trackingTitle: {
    ...Fonts.title,
    color: Colors.text,
    fontWeight: '600',
  },
  daysDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  daysNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 8,
  },
  daysLabel: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  sinceDate: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  encouragementText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 20,
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  updateButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    ...Fonts.body,
    color: Colors.surface,
    fontWeight: '600',
  },
  pauseButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pauseButtonText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  noTrackingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noTrackingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noTrackingTitle: {
    ...Fonts.title,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  noTrackingSubtitle: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: {
    ...Fonts.title,
    color: Colors.surface,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 12,
  },
  infoText: {
    ...Fonts.body,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneModal: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 32,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  milestoneIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  milestoneTitle: {
    ...Fonts.largeTitle,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  milestoneMessage: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  milestoneButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  milestoneButtonText: {
    ...Fonts.body,
    color: Colors.surface,
    fontWeight: '600',
  },
  sobrietyModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '95%',
    minHeight: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sobrietyOptionsModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    minHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...Fonts.headline,
    fontSize: 20,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  modalTitleSpacer: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  modalScrollView: {
    flex: 1,
    maxHeight: 450,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  sobrietyOptionsSection: {
    marginBottom: 20,
  },
  sobrietyOption: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  sobrietyOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  sobrietyOptionText: {
    ...Fonts.body,
    color: Colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  sobrietyOptionTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  sobrietyOptionSubtext: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  trackingDetailsSection: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  trackingDetailsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  trackingSubtitle: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  timeInputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeInputGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeInputLabel: {
    ...Fonts.body,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  timeInput: {
    ...Fonts.body,
    color: Colors.text,
    textAlign: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 18,
    fontWeight: '600',
    minHeight: 50,
    textAlignVertical: 'center',
  },
  trackingNote: {
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 16,
  },
  trackingNoteText: {
    ...Fonts.caption,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 20,
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
  trackingDetailsSubtitle: {
    ...Fonts.body,
    color: Colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  disableTrackingMessage: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  disableTrackingText: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  timeInputSection: {
    marginTop: 20,
  },
  timeInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeInputContainer: {
    flex: 1,
    marginHorizontal: 4,
  },
  encouragementMessage: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
});
