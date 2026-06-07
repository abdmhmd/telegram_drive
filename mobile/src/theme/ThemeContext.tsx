import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useStore } from '../store/useStore';

export interface ThemeColors {
  primary: string;
  primaryContainer: string;
  onPrimary: string;
  secondary: string;
  secondaryContainer: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  error: string;
  errorContainer: string;
  onError: string;
  success: string;
  warning: string;
  card: string;
  border: string;
  shadow: string;
  overlay: string;
  tabBar: string;
  tabBarBorder: string;
  statusBar: 'light' | 'dark';
}

const LightTheme: ThemeColors = {
  primary: '#4A90D9',
  primaryContainer: '#D6E8FF',
  onPrimary: '#FFFFFF',
  secondary: '#6C63FF',
  secondaryContainer: '#E8E5FF',
  background: '#F8F9FB',
  surface: '#FFFFFF',
  surfaceVariant: '#F2F3F7',
  onBackground: '#1A1A2E',
  onSurface: '#1A1A2E',
  onSurfaceVariant: '#5F6368',
  outline: '#DADCE0',
  error: '#E74C3C',
  errorContainer: '#FFEAE5',
  onError: '#FFFFFF',
  success: '#2ECC71',
  warning: '#F39C12',
  card: '#FFFFFF',
  border: '#EEEEF0',
  shadow: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.4)',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E0E0E0',
  statusBar: 'dark',
};

const DarkTheme: ThemeColors = {
  primary: '#6CB4EE',
  primaryContainer: '#1A3A5C',
  onPrimary: '#0A1929',
  secondary: '#9D97FF',
  secondaryContainer: '#2D2866',
  background: '#0D1117',
  surface: '#161B22',
  surfaceVariant: '#21262D',
  onBackground: '#E6EDF3',
  onSurface: '#E6EDF3',
  onSurfaceVariant: '#8B949E',
  outline: '#30363D',
  error: '#FF6B6B',
  errorContainer: '#3D1515',
  onError: '#FFFFFF',
  success: '#3FB950',
  warning: '#D29922',
  card: '#161B22',
  border: '#21262D',
  shadow: 'rgba(0,0,0,0.3)',
  overlay: 'rgba(0,0,0,0.6)',
  tabBar: '#161B22',
  tabBarBorder: '#30363D',
  statusBar: 'light',
};

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LightTheme,
  isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const themeMode = useStore((s) => s.themeMode);

  const isDark = useMemo(() => {
    if (themeMode === 'system') return systemScheme === 'dark';
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const colors = useMemo(() => (isDark ? DarkTheme : LightTheme), [isDark]);

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
