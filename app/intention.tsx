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
  const [filteredIntentions, setFilteredIntentions] = useState<Intention[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSetting, setIsSetting] = useState(false);
  const [newIntention, setNewIntention] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingIntention, setEditingIntention] = useState<Intention | null>(null);
  const [editContent, setEditContent] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadIntentions();
    }, [])
  );

  const loadIntentions = async () => {
    try {
      const intentionList = await database.getIntentions();
      setIntentions(intentionList);
      setFilteredIntentions(intentionList);
      // console.log('Loaded intentions:', intentionList.length);
    } catch (error) {
      // console.error('Error loading intentions:', error);
    }
  };

  const filterIntentions = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredIntentions(intentions);
      return;
    }
    
    const filtered = intentions.filter(intention => 
      intention.content.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredIntentions(filtered);
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
      // console.error('Error saving intention:', error);
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

  const handleEditIntention = (intention: Intention) => {
    setEditingIntention(intention);
    setEditContent(intention.content);
  };

  const handleSaveEdit = async () => {
    if (!editingIntention || !editContent.trim()) {
      Alert.alert('Error', 'Please enter some content.');
      return;
    }

    setIsLoading(true);
    try {
      await database.updateIntention(editingIntention.id!, editContent.trim());
      await loadIntentions();
      setEditingIntention(null);
      setEditContent('');
      Alert.alert('Success', 'Intention updated!');
    } catch (error) {
      // console.error('Error updating intention:', error);
      Alert.alert('Error', 'Failed to update intention. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (editContent !== editingIntention?.content) {
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setEditingIntention(null);
              setEditContent('');
            }
          }
        ]
      );
    } else {
      setEditingIntention(null);
      setEditContent('');
    }
  };

  const handleDeleteIntention = (intention: Intention) => {
    Alert.alert(
      'Delete Intention?',
      'Are you sure you want to delete this intention? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await database.deleteIntention(intention.id!);
              await loadIntentions();
              Alert.alert('Success', 'Intention deleted.');
            } catch (error) {
              // console.error('Error deleting intention:', error);
              Alert.alert('Error', 'Failed to delete intention. Please try again.');
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
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={filterIntentions}
                placeholder="Search your intentions..."
                placeholderTextColor={Colors.textLight}
                returnKeyType="search"
              />
            </View>
            
            <TouchableOpacity 
              style={styles.newIntentionButton}
              onPress={() => setIsSetting(true)}
            >
              <Text style={styles.newIntentionText}>Set Current Intention</Text>
            </TouchableOpacity>
          </>
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
            {searchQuery ? `Search Results (${filteredIntentions.length})` : `Past Intentions (${intentions.length})`}
          </Text>
          
          {filteredIntentions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No intentions found' : 'No intentions yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Set your first intention to see it here'
                }
              </Text>
            </View>
          ) : (
            filteredIntentions.map((intention) => (
              <View key={intention.id} style={styles.intentionCard}>
                {editingIntention?.id === intention.id ? (
                  // Edit mode
                  <View>
                    <Text style={styles.intentionDate}>{formatDate(intention.timestamp)}</Text>
                    <TextInput
                      style={styles.editTextInput}
                      value={editContent}
                      onChangeText={setEditContent}
                      placeholder="Edit your intention..."
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
                    <View style={styles.intentionHeader}>
                      <Text style={styles.intentionDate}>{formatDate(intention.timestamp)}</Text>
                      <View style={styles.intentionActions}>
                        <TouchableOpacity 
                          style={styles.editButton}
                          onPress={() => handleEditIntention(intention)}
                        >
                          <Text style={styles.editButtonText}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteIntention(intention)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <Text style={styles.intentionContent}>
                      {truncateText(intention.content)}
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
  searchContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    ...Fonts.body,
    color: Colors.text,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
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
  intentionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    padding: 5,
  },
  editButtonText: {
    fontSize: 18,
  },
  intentionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 1,
  },
  deleteButtonText: {
    fontSize: 18,
  },
}); 