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
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editContent, setEditContent] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadJournalEntries();
    }, [])
  );

  const loadJournalEntries = async () => {
    try {
      const journalEntries = await database.getJournalEntries();
      setEntries(journalEntries);
      // console.log('Loaded journal entries:', journalEntries.length);
    } catch (error) {
      // console.error('Error loading journal entries:', error);
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
      // console.error('Error saving journal entry:', error);
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

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditContent(entry.content);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry || !editContent.trim()) {
      Alert.alert('Error', 'Please enter some content.');
      return;
    }

    setIsLoading(true);
    try {
      await database.updateJournalEntry(editingEntry.id!, editContent.trim());
      await loadJournalEntries();
      setEditingEntry(null);
      setEditContent('');
      Alert.alert('Success', 'Journal entry updated!');
    } catch (error) {
      // console.error('Error updating journal entry:', error);
      Alert.alert('Error', 'Failed to update journal entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (editContent !== editingEntry?.content) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setEditingEntry(null);
              setEditContent('');
            }
          }
        ]
      );
    } else {
      setEditingEntry(null);
      setEditContent('');
    }
  };

  const handleDeleteEntry = (entry: JournalEntry) => {
    Alert.alert(
      'Delete Journal Entry?',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await database.deleteJournalEntry(entry.id!);
              await loadJournalEntries();
              Alert.alert('Success', 'Journal entry deleted.');
            } catch (error) {
              // console.error('Error deleting journal entry:', error);
              Alert.alert('Error', 'Failed to delete journal entry. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
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
              {editingEntry?.id === entry.id ? (
                // Edit mode
                <View>
                  <Text style={styles.entryDate}>{formatDate(entry.timestamp)}</Text>
                  <TextInput
                    style={styles.editTextInput}
                    value={editContent}
                    onChangeText={setEditContent}
                    placeholder="Edit your journal entry..."
                    placeholderTextColor={Colors.textLight}
                    multiline
                    textAlignVertical="top"
                    autoFocus
                  />
                  <View style={styles.editButtons}>
                    <TouchableOpacity 
                      style={styles.cancelEditButton}
                      onPress={handleCancelEdit}
                      disabled={isLoading}
                    >
                      <Text style={styles.cancelEditButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.saveEditButton, !editContent.trim() && styles.saveEditButtonDisabled]}
                      onPress={handleSaveEdit}
                      disabled={isLoading || !editContent.trim()}
                    >
                      <Text style={styles.saveEditButtonText}>
                        {isLoading ? 'Saving...' : 'Save'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                                  // View mode
                  <View>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryDate}>{formatDate(entry.timestamp)}</Text>
                      <View style={styles.entryActions}>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => handleEditEntry(entry)}
                        >
                          <Text style={styles.editButtonText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteEntry(entry)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.entryContent}>
                      {truncateText(entry.content)}
                    </Text>
                  </View>
              )}
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
  editTextInput: {
    ...Fonts.body,
    color: Colors.text,
    minHeight: 120,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelEditButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  cancelEditButtonText: {
    ...Fonts.body,
    color: Colors.textSecondary,
  },
  saveEditButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveEditButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  saveEditButtonText: {
    ...Fonts.body,
    color: Colors.surface,
    fontWeight: '600',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    fontSize: 18,
  },
  entryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 18,
  },
}); 