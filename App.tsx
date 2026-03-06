/**
 * Math.AI — Your AI Math Companion
 * Main Entry Point
 */

import React, { useEffect, useRef } from 'react';
import { StatusBar, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { SoundProvider } from './src/context/SoundContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import NotificationService from './src/services/NotificationService';
import NotificationPermissionModal from './src/components/NotificationPermissionModal';
import { loadAppOpenAd, showAppOpenAd } from './src/services/adService';

function AppContent() {
  const { colors, isDark } = useTheme();
  const [isModalVisible, setIsModalVisible] = React.useState(false);
  const appState = useRef(AppState.currentState);

  React.useEffect(() => {
    // Bind modal control to service
    NotificationService.bindModalControl(setIsModalVisible);

    // Initialize notification service
    NotificationService.initialize();

    // Pre-load App Open ad
    loadAppOpenAd().catch(() => { });
  }, []);

  // App Open Ad — show when user returns from background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        showAppOpenAd().catch(() => { });
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  const handleAccept = () => {
    setIsModalVisible(false);
    NotificationService.requestNativePermissions();
  };

  const handleDecline = () => {
    setIsModalVisible(false);
  };

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
      <NotificationPermissionModal
        isVisible={isModalVisible}
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SoundProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </SoundProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

export default App;
