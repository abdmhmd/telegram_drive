import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '../theme';

interface Props {
  promptMessage?: string;
  onAuthenticated: () => void;
  children?: React.ReactNode;
}

const BiometricGuard: React.FC<Props> = ({ promptMessage, onAuthenticated, children }) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        onAuthenticated();
      } else {
        const msg = errorMessages[result.error] || 'Authentication failed';
        setError(msg);
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }, [promptMessage, onAuthenticated]);

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="fingerprint" size={64} color={colors.primary} />
      <Text style={[styles.title, { color: colors.onSurface }]}>
        {promptMessage || 'Authentication required'}
      </Text>
      {error && (
        <Text style={[styles.error, { color: colors.error }]}>{error}</Text>
      )}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            Authenticate
          </Text>
        )}
      </TouchableOpacity>
      {children}
    </View>
  );
};

const errorMessages: Record<string, string> = {
  not_enrolled: 'No biometrics enrolled. Set up fingerprint or face ID in device settings.',
  user_cancel: 'Authentication cancelled.',
  lockout: 'Too many attempts. Try again later.',
  not_available: 'Biometrics not available on this device.',
  passcode_not_set: 'No device passcode set. Please set a passcode in device settings.',
  authentication_failed: 'Authentication failed. Try again.',
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor: colors.background,
      gap: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    error: {
      fontSize: 14,
      textAlign: 'center',
    },
    button: {
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
      minWidth: 200,
      alignItems: 'center',
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default BiometricGuard;
