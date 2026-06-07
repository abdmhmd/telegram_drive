import { useState, useCallback, useEffect, useRef } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_KEY = 'biometric_enabled';
const MAX_ATTEMPTS = 3;

export type BiometricStatus =
  | 'unsupported'
  | 'unavailable'
  | 'not_enrolled'
  | 'available'
  | 'authenticated'
  | 'locked';

interface BiometricState {
  status: BiometricStatus;
  isHardwareAvailable: boolean;
  isEnrolled: boolean;
  attemptCount: number;
}

export function useBiometricAuth() {
  const [state, setState] = useState<BiometricState>({
    status: 'unavailable',
    isHardwareAvailable: false,
    isEnrolled: false,
    attemptCount: 0,
  });
  const enabledRef = useRef(false);

  const checkSupport = useCallback(async (): Promise<BiometricState> => {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);

    let status: BiometricStatus = 'unavailable';
    if (!hardware) {
      status = 'unsupported';
    } else if (!enrolled) {
      status = 'not_enrolled';
    } else {
      status = 'available';
    }

    const newState = {
      status,
      isHardwareAvailable: hardware,
      isEnrolled: enrolled,
      attemptCount: 0,
    };
    setState(newState);
    return newState;
  }, []);

  const authenticate = useCallback(
    async (options?: LocalAuthentication.LocalAuthenticationOptions): Promise<boolean> => {
      if (state.status === 'locked') {
        console.warn('[Biometric] Too many attempts — locked until app restart');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options?.promptMessage || 'Authenticate to unlock TeleDrive',
        cancelLabel: options?.cancelLabel || 'Cancel',
        disableDeviceFallback: false,
        ...options,
      });

      if (result.success) {
        setState((prev) => ({ ...prev, status: 'authenticated', attemptCount: 0 }));
        return true;
      }

      const error = result.error;
      console.warn('[Biometric] Auth failed:', error, result.warning);

      if (error === 'lockout') {
        setState((prev) => ({ ...prev, status: 'locked' }));
      } else if (error === 'user_cancel') {
        // User cancelled — do not count as attempt
      } else {
        setState((prev) => ({ ...prev, attemptCount: prev.attemptCount + 1 }));
      }

      return false;
    },
    [state.status]
  );

  const isEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const val = await SecureStore.getItemAsync(BIOMETRIC_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    enabledRef.current = enabled;
    if (enabled) {
      await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
    } else {
      await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    }
  }, []);

  const authenticateWithFallback = useCallback(
    async (
      options?: LocalAuthentication.LocalAuthenticationOptions
    ): Promise<boolean> => {
      const checked = await checkSupport();

      if (checked.status === 'unsupported' || checked.status === 'unavailable') {
        console.log('[Biometric] Not supported — skipping auth');
        return true;
      }

      if (checked.status === 'not_enrolled') {
        console.log('[Biometric] Not enrolled — falling back to device passcode');
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: options?.promptMessage || 'Enter device passcode',
          cancelLabel: options?.cancelLabel || 'Cancel',
          ...options,
        });
        return result.success;
      }

      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const ok = await authenticate(options);
        if (ok) return true;

        if (state.status === 'locked') break;
        if (state.attemptCount >= MAX_ATTEMPTS) {
          setState((prev) => ({ ...prev, status: 'locked' }));
          break;
        }
      }

      return false;
    },
    [checkSupport, authenticate, state.status, state.attemptCount]
  );

  return {
    ...state,
    checkSupport,
    authenticate,
    authenticateWithFallback,
    isEnabled,
    setEnabled,
  };
}
