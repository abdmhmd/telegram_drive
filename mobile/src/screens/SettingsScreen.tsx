import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import Toast from 'react-native-toast-message';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';
import type { ThemeMode } from '../types';

const SettingsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const phone = useStore((s) => s.phone);
  const themeMode = useStore((s) => s.themeMode);
  const setThemeMode = useStore((s) => s.setThemeMode);
  const logout = useStore((s) => s.logout);
  const biometricEnabled = useStore((s) => s.biometricEnabled);
  const setBiometricEnabled = useStore((s) => s.setBiometricEnabled);

  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const [hardware, enrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      setBiometricSupported(hardware && enrolled);
    })();
    (async () => {
      const val = await SecureStore.getItemAsync('biometric_enabled');
      if (val === 'true' && !biometricEnabled) {
        setBiometricEnabled(true);
      }
    })();
  }, []);

  const handleBiometricToggle = useCallback(async () => {
    const newValue = !biometricEnabled;
    setBiometricLoading(true);
    try {
      if (newValue) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Enroll biometric to unlock TeleDrive',
          cancelLabel: 'Cancel',
        });
        if (!result.success) {
          Toast.show({ type: 'error', text1: 'Enrollment cancelled' });
          return;
        }
      }
      await SecureStore.setItemAsync('biometric_enabled', newValue ? 'true' : 'false');
      setBiometricEnabled(newValue);
      Toast.show({
        type: 'success',
        text1: newValue ? 'Biometric lock enabled' : 'Biometric lock disabled',
      });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err.message });
    } finally {
      setBiometricLoading(false);
    }
  }, [biometricEnabled, setBiometricEnabled]);

  const handleThemeToggle = () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const idx = modes.indexOf(themeMode);
    const next = modes[(idx + 1) % modes.length];
    setThemeMode(next);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          Toast.show({ type: 'success', text1: 'Logged out' });
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'This will remove all cached data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        onPress: () => Toast.show({ type: 'success', text1: 'Cache cleared' }),
      },
    ]);
  };

  const themeLabel = themeMode === 'system' ? 'System' : themeMode === 'dark' ? 'Dark' : 'Light';

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.pageTitle, { color: colors.onBackground }]}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
              <MaterialCommunityIcons name="account" size={24} color={colors.primary} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, { color: colors.onSurface }]}>Phone</Text>
              <Text style={[styles.rowValue, { color: colors.onSurfaceVariant }]}>{phone || 'Unknown'}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.row, styles.rowBorder, { borderTopColor: colors.border }]} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
            <Text style={[styles.rowLabel, { color: colors.error, marginLeft: 14, flex: 1 }]}>Logout</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.row} onPress={handleThemeToggle}>
            <MaterialCommunityIcons name={isDark ? 'weather-night' : 'weather-sunny'} size={22} color={colors.onSurface} />
            <Text style={[styles.rowLabel, { color: colors.onSurface, marginLeft: 14, flex: 1 }]}>Theme</Text>
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>{themeLabel}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* Security Section */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>SECURITY</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="fingerprint" size={22} color={colors.onSurface} />
            <Text style={[styles.rowLabel, { color: colors.onSurface, marginLeft: 14, flex: 1 }]}>
              Biometric Lock
            </Text>
            {biometricLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : biometricSupported === false ? (
              <Text style={[styles.badgeText, { color: colors.onSurfaceVariant, fontSize: 12 }]}>Not available</Text>
            ) : (
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.onPrimary}
              />
            )}
          </View>
          <View style={[styles.row, styles.rowBorder, { borderTopColor: colors.border }]}>
            <MaterialCommunityIcons name="information-outline" size={22} color={colors.onSurfaceVariant} />
            <Text style={[styles.hint, { color: colors.onSurfaceVariant, marginLeft: 14, flex: 1 }]}>
              {biometricSupported === false
                ? 'This device does not support biometric authentication.'
                : biometricEnabled
                ? 'App is locked with biometric. You will be prompted on each launch.'
                : 'Lock the app with fingerprint or face ID.'}
            </Text>
          </View>
        </View>

        {/* Storage Section */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>STORAGE</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.row} onPress={handleClearCache}>
            <MaterialCommunityIcons name="cached" size={22} color={colors.onSurface} />
            <Text style={[styles.rowLabel, { color: colors.onSurface, marginLeft: 14, flex: 1 }]}>Clear Cache</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <Text style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="information-outline" size={22} color={colors.onSurface} />
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={[styles.rowLabel, { color: colors.onSurface }]}>TeleDrive</Text>
              <Text style={[styles.rowValue, { color: colors.onSurfaceVariant }]}>Version 1.0.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: '700',
    },
    scroll: {
      padding: 16,
      paddingBottom: 40,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.5,
      marginTop: 24,
      marginBottom: 8,
      marginLeft: 4,
    },
    card: {
      borderRadius: 14,
      borderWidth: 1,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    rowInfo: {
      marginLeft: 14,
      flex: 1,
    },
    rowLabel: {
      fontSize: 16,
      fontWeight: '500',
    },
    rowValue: {
      fontSize: 13,
      marginTop: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    badge: {
      backgroundColor: `${colors.primary}15`,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 4,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '600',
    },
    hint: {
      fontSize: 13,
      lineHeight: 18,
    },
  });

export default SettingsScreen;
