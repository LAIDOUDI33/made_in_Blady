import React, { useEffect, useState, useCallback } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreenExpo from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Theme
import { Colors } from './src/utils/constants';

// Store
import { useAuthStore } from './src/store';

// Prevent native splash screen from auto-hiding
SplashScreenExpo.preventAutoHideAsync();

export default function App() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);
  
  // Auth store
  const { user, token, initializeAuth, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync({
          ...Ionicons.font,
          // Add custom fonts here if needed
          'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
          'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        });

        // Initialize auth state from storage
        await initializeAuth();
      } catch (e) {
        console.warn('[App] Preparation error:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreenExpo.hideAsync();
      }
    }

    prepare();
  }, [initializeAuth]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreenExpo.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={Colors.white} />
          <Text style={styles.loadingText}>AlgeriaTrade</Text>
          <Text style={styles.loadingSubtext}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider onLayout={onLayoutRootView}>
        <View style={{ flex: 1 }}>
          <StatusBar
            barStyle="light-content"
            backgroundColor={Colors.primary}
          />
          <RootNavigator 
            isAuthenticated={!!token && !!user}
            initialRouteName={token ? 'Main' : 'Auth'}
          />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 16,
    fontFamily: 'Inter-Bold',
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 8,
    fontFamily: 'Inter-Regular',
  },
});
