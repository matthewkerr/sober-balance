
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { database } from '../../utils/database';
import { storage } from '../../utils/storage';
import { Colors } from '../../constants/Colors';
import { Fonts } from '../../constants/Fonts';
import { calculateSobrietyDaysByDate } from '../../utils/database';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [userName, setUserName] = useState<string | null>(null);
  const [encouragement, setEncouragement] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTrackingSobriety, setIsTrackingSobriety] = useState(false);
  const [sobrietyDays, setSobrietyDays] = useState<number | null>(null);
  const [sobrietyData, setSobrietyData] = useState<any>(null);
  const [isEncouragementLiked, setIsEncouragementLiked] = useState(false);
  const [currentIntention, setCurrentIntention] = useState<any | null>(null);
  const [todayCheckIn, setTodayCheckIn] = useState<any | null>(null);
  const [showSobrietyCounter, setShowSobrietyCounter] = useState(true);
  const [hasLoadedEncouragement, setHasLoadedEncouragement] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // console.log('Home screen focused - refreshing data');
      loadUserName();
      // Only load encouragement on first focus (when app opens)
      if (!hasLoadedEncouragement) {
        loadEncouragement();
      }
      loadSobrietyData();
      loadCurrentIntention();
      loadTodayCheckIn(); // This will refresh every time the screen comes into focus
      loadSobrietyCounterSetting();
    }, [hasLoadedEncouragement, refreshKey])
  );

  const loadUserName = async () => {
    try {
      const name = await storage.getUserName();
      setUserName(name);
      // console.log('Loaded user name:', name);
    } catch (error) {
      // console.error('Error loading user name:', error);
    }
  };

  const loadEncouragement = async () => {
    try {
      // Get a random encouragement (could be seen or unseen)
      const randomEncouragement = await database.getRandomEncouragement();
      setEncouragement(randomEncouragement);
      // Set liked state based on whether it's been seen
      setIsEncouragementLiked(randomEncouragement?.seen || false);
      // Mark that we've loaded the encouragement for this session
      setHasLoadedEncouragement(true);
      // console.log('Loaded encouragement:', randomEncouragement);
    } catch (error) {
      // console.error('Error loading encouragement:', error);
    }
  };

  const handleEncouragementPress = async () => {
    if (!encouragement) return;
    
    setIsLoading(true);
    try {
      await database.markEncouragementAsSeen(encouragement.id!);
      setIsEncouragementLiked(true);
    } catch (error) {
      // console.error('Error marking encouragement as seen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSobrietyData = async () => {
    try {
      const sobrietyData = await database.getSobrietyData();
      if (sobrietyData && sobrietyData.tracking_sobriety && sobrietyData.sober_date) {
        setIsTrackingSobriety(true);
        
        // Calculate days since sober date using calendar days
        const daysDiff = calculateSobrietyDaysByDate(sobrietyData.sober_date);
        
        setSobrietyDays(daysDiff);
        setSobrietyData(sobrietyData); // Store sobrietyData for conditional messaging
        // console.log('Sobriety days calculated (calendar):', daysDiff);
      } else {
        setIsTrackingSobriety(false);
        setSobrietyDays(null);
        setSobrietyData(null); // Clear sobrietyData if not tracking
      }
    } catch (error) {
      // console.error('Error loading sobriety data:', error);
      setIsTrackingSobriety(false);
      setSobrietyDays(null);
      setSobrietyData(null);
    }
  };

  const loadCurrentIntention = async () => {
    try {
      const intention = await database.getCurrentIntention();
      setCurrentIntention(intention);
      // console.log('Loaded current intention:', intention);
    } catch (error) {
      // console.error('Error loading current intention:', error);
    }
  };

  const loadTodayCheckIn = async () => {
    try {
      const checkIn = await database.getTodayCheckIn();
      setTodayCheckIn(checkIn);
      // console.log('Home screen - Loaded today check-in:', checkIn ? 'Found check-in' : 'No check-in found');
      // if (checkIn) {
      //   console.log('Check-in details:', { date: checkIn.date, goal: checkIn.goal.substring(0, 30) + '...' });
      // }
    } catch (error) {
      // console.error('Error loading today check-in:', error);
    }
  };

  const loadSobrietyCounterSetting = async () => {
    try {
      const showCounter = await storage.getShowSobrietyCounter();
      setShowSobrietyCounter(showCounter);
    } catch (error) {
      // console.error('Error loading sobriety counter setting:', error);
    }
  };

  const refreshCheckInStatus = async () => {
    // console.log('Manually refreshing check-in status');
    await loadTodayCheckIn();
    setRefreshKey(prev => prev + 1);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // console.log('Pull to refresh triggered');
    await loadTodayCheckIn();
    await loadCurrentIntention();
    await loadSobrietyData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.statusBarBackground, { height: insets.top }]} />
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={[
          styles.scrollContent,
          { 
            paddingTop: 20,
            paddingBottom: 120 + insets.bottom // Account for tab bar height + safe area
          }
        ]}
      >
      <Text style={styles.greeting}>
        {getGreeting()}{userName ? `, ${userName}` : ''}!
      </Text>
      
      <Text style={styles.subtitle}>
        Welcome Home
      </Text>
      
      {!todayCheckIn && (
        <TouchableOpacity 
          style={styles.checkInButton}
          onPress={() => router.push('/checkin')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkInText}>Daily Check-In</Text>
          <Text style={styles.checkInSubtext}>How are you feeling today?</Text>
        </TouchableOpacity>
      )}
      
      {todayCheckIn && (
        <TouchableOpacity 
          style={styles.checkInCompleteCard}
          onPress={refreshCheckInStatus}
          activeOpacity={0.8}
        >
          <Text style={styles.checkInCompleteText}>✓ Daily Check-In Complete</Text>
          <Text style={styles.checkInCompleteSubtext}>Great job checking in today! Tap to refresh</Text>
        </TouchableOpacity>
      )}
      
      {isTrackingSobriety && sobrietyDays !== null && showSobrietyCounter && (
        <View style={styles.sobrietyCard}>
          <View style={styles.sobrietyHeader}>
            <Text style={styles.sobrietyIcon}>🌟</Text>
            <Text style={styles.sobrietyDays}>
              {sobrietyDays}
            </Text>
          </View>
          <Text style={styles.sobrietyLabel}>
            {formatSobrietyTime(sobrietyDays)}
          </Text>
          <Text style={styles.sobrietySubtext}>
            {sobrietyData?.tracking_mode === 'trying' 
              ? 'Every effort counts - you\'re doing amazing'
              : 'Every day is a victory - you\'re incredible'
            }
          </Text>
        </View>
      )}
      
      {encouragement && (
        <TouchableOpacity 
          style={styles.encouragementCard}
          onPress={handleEncouragementPress}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <Text style={styles.encouragementIcon}>
            {isEncouragementLiked ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.encouragementText}>
            {encouragement.message}
          </Text>
          <Text style={styles.encouragementHint}>
            {isEncouragementLiked ? 'Liked!' : 'Tap to like this message'}
          </Text>
        </TouchableOpacity>
      )}
      
      {!encouragement && (
        <View style={styles.noEncouragementCard}>
          <Text style={styles.noEncouragementText}>
            No encouragements available 😔
          </Text>
          <Text style={styles.noEncouragementSubtext}>
            Check the debug screen to reset them
          </Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.journalButton}
        onPress={() => router.push('/journal')}
        activeOpacity={0.8}
      >
        <View style={styles.journalHeader}>
          <Text style={styles.journalText}>My Journal</Text>
        </View>
        <Text style={styles.journalSubtext}>Let your thoughts settle here.</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.intentionButton}
        onPress={() => router.push('/intention')}
        activeOpacity={0.8}
      >
        <Text style={styles.intentionText}>Intention</Text>
        <Text style={styles.intentionSubtext}>
          {currentIntention ? `${currentIntention.content.substring(0, 30)}${currentIntention.content.length > 30 ? '...' : ''}` : 'Set your current intention'}
        </Text>
      </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 120, // Increased padding to account for tab bar height + safe area
  },
  greeting: {
    ...Fonts.largeTitle,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    ...Fonts.body,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  sobrietyCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sobrietyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  sobrietyIcon: {
    fontSize: 40,
    marginRight: 12,
  },
  sobrietyDays: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.surface,
  },
  sobrietyLabel: {
    ...Fonts.headline,
    color: Colors.surface,
    textAlign: 'center',
    marginBottom: 8,
  },
  sobrietySubtext: {
    ...Fonts.caption,
    color: Colors.surface,
    textAlign: 'center',
    opacity: 0.9,
  },
  encouragementCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginTop: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  encouragementIcon: {
    fontSize: 32,
    marginBottom: 16,
  },
  encouragementIconLiked: {
    // This style can be used for additional styling when liked
  },
  encouragementIconOutline: {
    // Green outline effect for the heart
    textShadowColor: Colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    opacity: 0.8,
  },
  encouragementText: {
    ...Fonts.title,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  encouragementHint: {
    ...Fonts.caption,
    color: Colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noEncouragementCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
  },
  noEncouragementText: {
    ...Fonts.headline,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  noEncouragementSubtext: {
    ...Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 40,
    marginTop: 20,
  },
  placeholderText: {
    ...Fonts.headline,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  placeholderSubtext: {
    ...Fonts.body,
    color: Colors.textLight,
    textAlign: 'center',
  },
  journalButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  journalIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  journalText: {
    ...Fonts.title,
    color: Colors.text,
  },
  journalSubtext: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  intentionButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    marginTop: 20,
    marginBottom: 20, // Add bottom margin to ensure proper spacing
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  intentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  intentionIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  intentionText: {
    ...Fonts.title,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  intentionSubtext: {
    ...Fonts.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  checkInButton: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    
  },
  checkInText: {
    ...Fonts.title,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  checkInSubtext: {
    ...Fonts.caption,
    color: Colors.text,
    textAlign: 'center',
    opacity: 0.9,
  },
  checkInCompleteCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    textAlign: 'center',
  },
  checkInCompleteText: {
    ...Fonts.title,
    color: Colors.surface,
    marginBottom: 8,
    textAlign: 'center',
  },
  checkInCompleteSubtext: {
    ...Fonts.caption,
    color: Colors.surface,
    textAlign: 'center',
    opacity: 0.9,
  },
});
