import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/RootNavigator';
import type { Account } from '../types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const accounts = useStore((s) => s.accounts);
  const loadAccounts = useStore((s) => s.loadAccounts);
  const loginAccount = useStore((s) => s.loginAccount);
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);

  useEffect(() => {
    loadAccounts().finally(() => setLoading(false));
  }, []);

  const handleLogin = async (phone: string) => {
    setLoggingIn(phone);
    try {
      await loginAccount(phone);
    } catch {
      setLoggingIn(null);
    }
  };

  const renderAccount = ({ item }: { item: Account }) => {
    const isLogging = loggingIn === item.user_phone;
    return (
      <TouchableOpacity
        style={styles.accountCard}
        onPress={() => handleLogin(item.user_phone)}
        disabled={!!loggingIn}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primaryContainer }]}>
          <MaterialCommunityIcons name="account" size={28} color={colors.primary} />
        </View>
        <View style={styles.accountInfo}>
          <Text style={[styles.phone, { color: colors.onSurface }]}>{item.user_phone}</Text>
          <Text style={[styles.date, { color: colors.onSurfaceVariant }]}>
            Created {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        {isLogging ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
        )}
      </TouchableOpacity>
    );
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="cloud-upload" size={48} color={colors.primary} />
        <Text style={styles.title}>TeleDrive</Text>
        <Text style={styles.subtitle}>Select an account to continue</Text>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => item.user_phone}
        renderItem={renderAccount}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-off" size={48} color={colors.onSurfaceVariant} />
            <Text style={styles.emptyText}>No saved accounts</Text>
            <Text style={styles.emptySubtext}>Add a new account to get started</Text>
          </View>
        }
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Setup')}
        >
          <MaterialCommunityIcons name="plus" size={24} color={colors.onPrimary} />
          <Text style={styles.addButtonText}>Add New Account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    center: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    header: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.onBackground,
      marginTop: 12,
    },
    subtitle: {
      fontSize: 15,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    list: {
      padding: 16,
      flexGrow: 1,
    },
    accountCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    accountInfo: {
      flex: 1,
    },
    phone: {
      fontSize: 16,
      fontWeight: '600',
    },
    date: {
      fontSize: 13,
      marginTop: 2,
    },
    empty: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.onSurface,
      marginTop: 12,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      marginTop: 4,
    },
    footer: {
      padding: 16,
      paddingBottom: 32,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: 14,
      height: 54,
      gap: 8,
      elevation: 2,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    addButtonText: {
      color: colors.onPrimary,
      fontSize: 17,
      fontWeight: '600',
    },
  });

export default LoginScreen;
