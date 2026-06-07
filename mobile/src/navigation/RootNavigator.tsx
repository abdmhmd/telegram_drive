import React from 'react';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';

import SetupScreen from '../screens/SetupScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import PreviewScreen from '../screens/PreviewScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MovePickerScreen from '../screens/MovePickerScreen';

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  Preview: { itemId: number };
  MovePicker: { itemId: number };
};

export type AuthStackParamList = {
  Login: undefined;
  Setup: undefined;
};

export type MainTabParamList = {
  Files: undefined;
  Settings: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen
      name="Setup"
      component={SetupScreen}
      options={{
        animation: 'slide_from_right',
        headerShown: true,
        headerTitle: 'New Account',
        headerBackTitle: 'Back',
      }}
    />
  </AuthStack.Navigator>
);

const TabIcon: React.FC<{ name: React.ComponentProps<typeof MaterialCommunityIcons>['name']; focused: boolean; color: string }> = ({
  name,
  focused,
  color,
}) => (
  <MaterialCommunityIcons name={focused ? name : (`${name}-outline` as any)} size={24} color={color} />
);

const MainTabs: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 0.5,
          paddingBottom: insets.bottom ? insets.bottom + 4 : 8,
          paddingTop: 6,
          height: insets.bottom ? 56 + insets.bottom : 60,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Files"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Files',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="folder" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <TabIcon name="cog" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const RootNavigator: React.FC = () => {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const isInitialized = useStore((s) => s.isInitialized);
  const themeContext = useTheme();
  const { colors } = themeContext;

  console.log('[Navigation] RootNavigator render —', { isAuthenticated, isInitialized });

  const navTheme = {
    ...(themeContext.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(themeContext.isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.onSurface,
      border: colors.border,
      notification: colors.error,
    },
  };

  if (!isInitialized) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabs} />
            <RootStack.Screen
              name="Preview"
              component={PreviewScreen}
              options={{
                headerShown: true,
                headerTitle: '',
                headerTransparent: true,
                headerTintColor: '#FFF',
                animation: 'slide_from_bottom',
              }}
            />
            <RootStack.Screen
              name="MovePicker"
              component={MovePickerScreen}
              options={{
                headerShown: true,
                headerTitle: 'Move to...',
                headerBackTitle: 'Cancel',
                presentation: 'modal',
              }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RootNavigator;
