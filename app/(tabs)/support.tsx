import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Linking,
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
                You haven't set up a support person yet. You can add one during onboarding or in settings.
              </Text>
            </View>
          </View>
        </View>
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
}); 