import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useStore } from '../store/useStore';
import { getApiUrl, setApiUrl } from '../api/client';
import { useTheme } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<AuthStackParamList, 'Setup'>;

const STEPS = ['credentials', 'code', '2fa'] as const;

const SetupScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const sendCode = useStore((s) => s.sendCode);
  const verifyCode = useStore((s) => s.verifyCode);
  const verify2FA = useStore((s) => s.verify2FA);

  const [step, setStep] = useState<typeof STEPS[number]>('credentials');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const url = await getApiUrl();
      if (url) setServerUrl(url);
    })();
  }, []);

  const handleSendCode = async () => {
    if (!apiId.trim() || !apiHash.trim() || !phone.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill all fields' });
      return;
    }
    setLoading(true);
    try {
      console.log('[SetupScreen] handleSendCode — sending code', {
        apiId: apiId.trim(),
        phone: phone.trim().slice(0, 5) + '***',
        serverUrl: serverUrl.trim() || '(default)',
      });
      if (serverUrl.trim()) {
        await setApiUrl(serverUrl.trim().replace(/\/+$/, ''));
        console.log('[SetupScreen] handleSendCode — custom server URL set:', serverUrl.trim());
      }
      await sendCode(Number(apiId), apiHash.trim(), phone.trim());
      console.log('[SetupScreen] handleSendCode — code sent successfully');
      setStep('code');
      Toast.show({ type: 'success', text1: 'Code sent', text2: 'Check Telegram for the code' });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      console.error('[SetupScreen] handleSendCode — error:', msg, err.stack);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Enter the verification code' });
      return;
    }
    setLoading(true);
    try {
      console.log('[SetupScreen] handleVerifyCode — verifying');
      const result = await verifyCode(phone.trim(), code.trim());
      console.log('[SetupScreen] handleVerifyCode — result:', result);
      if (result.needPassword) {
        setStep('2fa');
      } else {
        Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Authentication successful' });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      console.error('[SetupScreen] handleVerifyCode — error:', msg, err.stack);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!password.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Enter your 2FA password' });
      return;
    }
    setLoading(true);
    try {
      console.log('[SetupScreen] handleVerify2FA — verifying 2FA');
      await verify2FA(phone.trim(), password.trim());
      console.log('[SetupScreen] handleVerify2FA — success');
      Toast.show({ type: 'success', text1: 'Welcome!', text2: 'Authentication successful' });
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message;
      console.error('[SetupScreen] handleVerify2FA — error:', msg, err.stack);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <MaterialCommunityIcons name="cloud-upload" size={48} color={colors.primary} />
            <Text style={styles.title}>TeleDrive</Text>
            <Text style={styles.subtitle}>Connect to your Telegram Drive</Text>
          </View>

          {step === 'credentials' && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons name="server" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Server URL (optional)"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={serverUrl}
                  onChangeText={setServerUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                />
              </View>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons name="key-variant" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="API ID"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={apiId}
                  onChangeText={setApiId}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons name="lock" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="API Hash"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={apiHash}
                  onChangeText={setApiHash}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons name="phone" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number (+1234567890)"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSendCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Send Code</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {step === 'code' && (
            <View style={styles.form}>
              <Text style={styles.instruction}>
                Enter the verification code sent to your Telegram account
              </Text>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons name="message-text" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Verification code"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Verify Code</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('credentials')} style={styles.link}>
                <Text style={styles.linkText}>Back to credentials</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === '2fa' && (
            <View style={styles.form}>
              <Text style={styles.instruction}>
                Two-factor authentication is enabled. Enter your password.
              </Text>
              <View style={styles.inputGroup}>
                <MaterialCommunityIcons name="shield-key" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="2FA Password"
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoFocus
                />
              </View>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleVerify2FA}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.buttonText}>Verify Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 24,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
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
    form: {
      gap: 12,
    },
    instruction: {
      fontSize: 14,
      color: colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 20,
    },
    inputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 16,
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inputIcon: {
      marginRight: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.onSurface,
      height: '100%',
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 8,
      elevation: 2,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: colors.onPrimary,
      fontSize: 17,
      fontWeight: '600',
    },
    link: {
      alignItems: 'center',
      padding: 12,
      marginTop: 4,
    },
    linkText: {
      color: colors.primary,
      fontSize: 15,
    },
  });

export default SetupScreen;
