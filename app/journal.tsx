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
import { database, JournalEntry } from '../utils/database';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadJournalEntries();
    }, [])
  );

  const loadJournalEntries = async () => {
    try {
      const journalEntries = await database.getJournalEntries();
      setEntries(journalEntries);
      console.log('Loaded journal entries:', journalEntries.length);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  };

  const handleSaveEntry = async () => {
    if (!newEntry.trim()) {
      Alert.alert('Empty Entry', 'Please write something before saving.');
      return;
    }

    setIsLoading(true);
    try {
      await database.createJournalEntry(newEntry.trim());
      setNewEntry('');
      setIsWriting(false);
      await loadJournalEntries(); // Reload entries
      Alert.alert('Success', 'Journal entry saved!');
    } catch (error) {
      console.error('Error saving journal entry:', error);
      Alert.alert('Error', 'Failed to save journal entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelWriting = () => {
    if (newEntry.trim()) {
      Alert.alert(
        'Discard Entry?',
        'Are you sure you want to discard this entry?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setNewEntry('');
              setIsWriting(false);
            }
          }
        ]
      );
    } else {
      setNewEntry('');
      setIsWriting(false);
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
          title: 'My Journal',
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
          <Text style={styles.title}>My Journal</Text>
        </View>

      {!isWriting && (
        <TouchableOpacity 
          style={styles.newEntryButton}
          onPress={() => setIsWriting(true)}
        >
          <Text style={styles.newEntryText}>✏️ Write New Entry</Text>
        </TouchableOpacity>
      )}

      {isWriting && (
        <View style={styles.writingContainer}>
          <Text style={styles.writingLabel}>What's on your mind?</Text>
          <TextInput
            style={styles.textInput}
            value={newEntry}
            onChangeText={setNewEntry}
            placeholder="Write your thoughts, feelings, or reflections here..."
            placeholderTextColor={Colors.textLight}
            multiline
            textAlignVertical="top"
            autoFocus
          />
          <View style={styles.writingButtons}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelWriting}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.saveButton, !newEntry.trim() && styles.saveButtonDisabled]}
              onPress={handleSaveEntry}
              disabled={isLoading || !newEntry.trim()}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? 'Saving...' : 'Save Entry'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.entriesContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.entriesTitle}>
          Past Entries ({entries.length})
        </Text>
        
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.emptySubtext}>
              Start writing to see your reflections here
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <View key={entry.id} style={styles.entryCard}>
              <Text style={styles.entryDate}>{formatDate(entry.timestamp)}</Text>
              <Text style={styles.entryContent}>
                {truncateText(entry.content)}
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
  newEntryButton: {
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
  newEntryIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  newEntryText: {
    ...Fonts.title,
    color: Colors.surface,
  },
  writingContainer: {
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
  writingLabel: {
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
  writingButtons: {
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
  entriesContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  entriesTitle: {
    ...Fonts.headline,
    color: Colors.text,
    marginBottom: 16,
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
  entryCard: {
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
  entryDate: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  entryContent: {
    ...Fonts.body,
    color: Colors.text,
    lineHeight: 24,
  },
}); 