import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { database, Intention } from '../utils/database';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

export default function IntentionScreen() {
  const insets = useSafeAreaInsets();
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [isSetting, setIsSetting] = useState(false);
  const [newIntention, setNewIntention] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadIntentions();
    }, [])
  );

  const loadIntentions = async () => {
    try {
      const intentionList = await database.getIntentions();
      setIntentions(intentionList);
      console.log('Loaded intentions:', intentionList.length);
    } catch (error) {
      console.error('Error loading intentions:', error);
    }
  };

  const handleSaveIntention = async () => {
    if (!newIntention.trim()) {
      Alert.alert('Empty Intention', 'Please write something before saving.');
      return;
    }

    setIsLoading(true);
    try {
      await database.createIntention(newIntention.trim());
      setNewIntention('');
      setIsSetting(false);
      await loadIntentions(); // Reload intentions
      Alert.alert('Success', 'Your intention has been saved.');
    } catch (error) {
      console.error('Error saving intention:', error);
      Alert.alert('Error', 'Failed to save your intention. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSetting = () => {
    if (newIntention.trim()) {
      Alert.alert(
        'Discard Intention?',
        'Are you sure you want to discard this intention?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setNewIntention('');
              setIsSetting(false);
            }
          }
        ]
      );
    } else {
      setNewIntention('');
      setIsSetting(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Current Intentions',
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: Colors.background,
          },
          headerTintColor: Colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Text style={styles.title}>Intention</Text>
        </View>

        {!isSetting && (
          <TouchableOpacity 
            style={styles.newIntentionButton}
            onPress={() => setIsSetting(true)}
          >
            <Text style={styles.newIntentionText}>Set Current Intention</Text>
          </TouchableOpacity>
        )}

        {isSetting && (
          <View style={styles.settingContainer}>
            <Text style={styles.settingLabel}>What intention feels right for you right now?</Text>
            <TextInput
              style={styles.textInput}
              value={newIntention}
              onChangeText={setNewIntention}
              placeholder="Write your intention here..."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.settingButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelSetting}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveButton, !newIntention.trim() && styles.saveButtonDisabled]}
                onPress={handleSaveIntention}
                disabled={isLoading || !newIntention.trim()}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save Intention'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView style={styles.intentionsContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.intentionsTitle}>
            Past Intentions ({intentions.length})
          </Text>
          
          {intentions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No intentions yet</Text>
              <Text style={styles.emptySubtext}>
                Set your first intention to see it here
              </Text>
            </View>
          ) : (
            intentions.map((intention) => (
              <View key={intention.id} style={styles.intentionCard}>
                <Text style={styles.intentionDate}>{formatDate(intention.timestamp)}</Text>
                <Text style={styles.intentionContent}>
                  {truncateText(intention.content)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.background,
  },
  title: {
    ...Fonts.largeTitle,
    color: Colors.text,
    textAlign: 'center',
  },
  newIntentionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  newIntentionIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  newIntentionText: {
    ...Fonts.title,
    color: Colors.surface,
  },
  settingContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingLabel: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 16,
  },
  textInput: {
    ...Fonts.body,
    color: Colors.text,
    minHeight: 120,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  settingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
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
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  saveButtonText: {
    ...Fonts.body,
    color: Colors.surface,
    fontWeight: '600',
  },
  intentionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  intentionsTitle: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  intentionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  intentionDate: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  intentionContent: {
    ...Fonts.body,
    color: Colors.text,
    lineHeight: 24,
  },
}); 