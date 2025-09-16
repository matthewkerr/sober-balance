import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { database } from '@/utils/database';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Initialize database
  useEffect(() => {
    const initDatabase = async () => {
      try {
        // console.log('Initializing database...');
        
        // Add a longer timeout for slow devices and retry mechanism
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Database initialization timeout after 15 seconds')), 15000);
        });
        
        const initPromise = database.init();
        
        await Promise.race([initPromise, timeoutPromise]);
        // console.log('Database initialized successfully');
      } catch (error) {
        // console.error('Failed to initialize database:', error);
        
        // Try to initialize again after a delay for slow devices
        try {
          // console.log('Retrying database initialization...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          await database.init();
          // console.log('Database initialized successfully on retry');
        } catch (retryError) {
          // console.error('Database initialization failed on retry:', retryError);
          // Continue even if database fails to initialize
        }
      }
    };
    
    initDatabase();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      //console.log('Fonts loaded, hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootLayoutNav />
    </SafeAreaProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            headerShown: false,
            gestureEnabled: false, // Disable back gesture for onboarding
          }} 
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
