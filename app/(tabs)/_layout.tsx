import { Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { storage } from '../../utils/storage';
import { database } from '../../utils/database';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const [hasSupportPerson, setHasSupportPerson] = useState(false);

  type TabIconProps = {
    emoji: string;
    color: string;
    size: number;
  };

  const TabIcon = ({ emoji, color, size }: TabIconProps) => (
    <View style={{ paddingBottom: 10 }}>
      <Text style={{ fontSize: size, color }}>{emoji}</Text>
    </View>
  );

  useEffect(() => {
    const checkSupportPerson = async () => {
      try {
        // Check if onboarding is complete first
        const hasOnboarded = await storage.getHasCompletedOnboarding();
        if (!hasOnboarded) {
          setHasSupportPerson(false);
          return;
        }

        const supportPerson = await database.getSupportPerson();
        setHasSupportPerson(!!supportPerson);
      } catch (error) {
        console.error('Error checking support person:', error);
        setHasSupportPerson(false);
      }
    };

    checkSupportPerson();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 15,
          paddingTop: 10,
          height: 90,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sos"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pulse-outline" size={size} color={color} />
          ),
        }}
      />
      {hasSupportPerson && (
        <Tabs.Screen
          name="support"
          options={{
            title: 'Support',
            tabBarIcon: ({ color, size }) => (
              // <Text style={{ fontSize: size, color }}></Text>
              <Ionicons name="heart-outline" size={size} color={color} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // This is all you need
        }}
      />
      </Tabs>
      );
}
