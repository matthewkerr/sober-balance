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
      console.error('Error loading support person:', error);
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
      console.error('Error saving support person:', error);
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
                console.error('Error opening phone app:', error);
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
        </View>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    ...Fonts.largeTitle,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 40,
  },
  supportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 30,
    marginBottom: 30,
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
    ...Fonts.largeTitle,
    color: Colors.text,
    fontWeight: '700',
  },
  supportPhone: {
    ...Fonts.title,
    color: Colors.primary,
    marginBottom: 20,
    fontWeight: '600',
  },
  supportMessage: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  callButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
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
    padding: 24,
    alignItems: 'center',
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
  noSupportCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noSupportIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  noSupportTitle: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 16,
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
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 24,
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