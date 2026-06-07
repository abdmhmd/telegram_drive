import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import Toast from 'react-native-toast-message';
import { useStore } from './src/store/useStore';
import { getApiUrl, resetStoredApiUrl } from './src/api/client';
import { ThemeProvider, useTheme } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';

type AuthGateState = 'loading' | 'authenticated' | 'locked';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useTheme();
  const [gateState, setGateState] = useState<AuthGateState>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync('biometric_enabled');
        const enabled = raw === 'true';

        if (!enabled) {
          setGateState('authenticated');
          return;
        }

        const [hardware, enrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);

        if (!hardware || !enrolled) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Enter device passcode to unlock TeleDrive',
            cancelLabel: 'Cancel',
          });
          setGateState(result.success ? 'authenticated' : 'loading');
          if (!result.success) {
            setErrorMsg('Authentication failed');
          }
          return;
        }

        for (let i = 0; i < 3; i++) {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to unlock TeleDrive',
            cancelLabel: 'Cancel',
            disableDeviceFallback: false,
          });

          if (result.success) {
            setGateState('authenticated');
            return;
          }

          if (result.error === 'lockout') {
            setGateState('locked');
            setErrorMsg('Too many failed attempts. Try again later.');
            return;
          }

          if (result.error !== 'user_cancel') {
            setErrorMsg('Authentication failed. Try again.');
          }
        }

        setGateState('locked');
        setErrorMsg('Too many failed attempts. Try again later.');
      } catch (err: any) {
        console.error('[AuthGate] Error:', err);
        setGateState('authenticated');
      }
    })();
  }, []);

  if (gateState === 'loading') {
    return (
      <View style={[styles.gate, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (gateState === 'locked') {
    return (
      <View style={[styles.gate, { backgroundColor: colors.background }]}>
        <Text style={[styles.gateTitle, { color: colors.onSurface }]}>Locked</Text>
        <Text style={[styles.gateSubtitle, { color: colors.onSurfaceVariant }]}>
          {errorMsg || 'Authentication required'}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const initialize = useStore((s) => s.initialize);
  const { isDark } = useTheme();

  useEffect(() => {
    (async () => {
      console.log('[App] ⚙️ EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL);
      await resetStoredApiUrl();
      const resolvedUrl = await getApiUrl();
      console.log('[App] 🔗 Resolved API baseURL:', resolvedUrl);
      console.log('[App] 🚀 App mounting, initializing store');
      initialize();
    })();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGate>
        <RootNavigator />
      </AuthGate>
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  gate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  gateSubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
});

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
