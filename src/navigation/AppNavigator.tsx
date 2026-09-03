import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Linking } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';

// Onboarding Steps
import { MissionFoundationsScreen } from '../screens/MissionFoundationsScreen';
import { MissionCorePillarsScreen } from '../screens/MissionCorePillarsScreen';
import { MissionLogisticsScreen } from '../screens/MissionLogisticsScreen';
import { MissionDeploymentScreen } from '../screens/MissionDeploymentScreen';

// Auth
import { LandingScreen } from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignUpScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';

// Core Tabs
import { TabNavigator } from './TabNavigator';
import { CollectorDashboardScreen } from '../screens/CollectorDashboardScreen';
import { CollectorProfileScreen } from '../screens/CollectorProfileScreen';

// Modals & Action Screens
import { ConfirmationScreen } from '../screens/ConfirmationScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { QualityScreen } from '../screens/QualityScreen';
import { PickupMapScreen } from '../screens/PickupMapScreen';

// Settings Screens
import { PersonalSettingsScreen } from '../screens/PersonalSettingsScreen';
import { AlertSettingsScreen } from '../screens/AlertSettingsScreen';
import { PrivacySettingsScreen } from '../screens/PrivacySettingsScreen';
import { HelpSettingsScreen } from '../screens/HelpSettingsScreen';

import { supabase, fetchUserProfile } from '../services/api';

const Stack = createNativeStackNavigator();
export const ONBOARDING_COMPLETE_KEY = '@punahchakra_onboarding_completed';
export const USER_LOGGED_IN_KEY = '@punahchakra_user_logged_in';
export const LAST_ROLE_KEY = '@punahchakra_last_role';
export const navigationRef = createNavigationContainerRef();

// Supabase's password-reset email links to `punahchakra://reset-password` with the
// recovery credentials in either the URL fragment (implicit flow) or a `code` query
// param (PKCE flow) — parse whichever shape shows up.
type RecoveryParams =
  | { kind: 'code'; code: string }
  | { kind: 'tokens'; access_token: string; refresh_token: string };

const parseRecoveryParams = (url: string): RecoveryParams | null => {
  const [, afterHash] = url.split('#');
  const [, afterQuery] = url.split('?');
  const params = new URLSearchParams(afterHash || afterQuery || '');
  const code = params.get('code');
  if (code) return { kind: 'code', code };
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');
  if (params.get('type') === 'recovery' && access_token && refresh_token) {
    return { kind: 'tokens', access_token, refresh_token };
  }
  return null;
};

const handleRecoveryUrl = async (url: string | null) => {
  if (!url || !url.includes('reset-password')) return;
  const parsed = parseRecoveryParams(url);
  if (!parsed) return;
  try {
    if (parsed.kind === 'code') {
      await supabase.auth.exchangeCodeForSession(parsed.code);
    } else {
      await supabase.auth.setSession({ access_token: parsed.access_token, refresh_token: parsed.refresh_token });
    }
    if (navigationRef.isReady()) {
      navigationRef.navigate('ResetPassword' as never);
    }
  } catch {
    // ResetPasswordScreen itself handles the "no active session" case
  }
};

export const AppNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<'MissionFoundations' | 'Landing' | 'MainTabs' | 'CollectorDashboard' | 'ResetPassword'>('Landing');

  useEffect(() => {
    (async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl && initialUrl.includes('reset-password')) {
        await handleRecoveryUrl(initialUrl);
        setInitialRoute('ResetPassword');
        setLoading(false);
      } else {
        checkInitialSession();
      }
    })();

    const subscription = Linking.addEventListener('url', ({ url }) => handleRecoveryUrl(url));
    return () => subscription.remove();
  }, []);

  const checkInitialSession = async () => {
    try {
      // 1. Check local session cache first for instant boot
      const isUserLoggedIn = await AsyncStorage.getItem(USER_LOGGED_IN_KEY);
      const lastRole = await AsyncStorage.getItem(LAST_ROLE_KEY);

      if (isUserLoggedIn === 'true') {
        if (lastRole === 'admin') {
          setInitialRoute('CollectorDashboard');
        } else {
          setInitialRoute('MainTabs');
        }
      }

      // 2. Check active Supabase Auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await AsyncStorage.setItem(USER_LOGGED_IN_KEY, 'true');
        try {
          const profile = await fetchUserProfile(session.user.id);
          if (profile?.role === 'admin') {
            await AsyncStorage.setItem(LAST_ROLE_KEY, 'admin');
            setInitialRoute('CollectorDashboard');
          } else {
            await AsyncStorage.setItem(LAST_ROLE_KEY, 'user');
            setInitialRoute('MainTabs');
          }
        } catch {
          // If profile fetch fails, user is still authenticated -> default to MainTabs/Dashboard
          if (lastRole === 'admin') {
            setInitialRoute('CollectorDashboard');
          } else {
            setInitialRoute('MainTabs');
          }
        }
        return;
      }

      // 3. No active Supabase session — clear any stale "logged in" cache from a
      // previous session that never got persisted/expired, then check onboarding.
      if (isUserLoggedIn === 'true') {
        await AsyncStorage.removeItem(USER_LOGGED_IN_KEY);
        await AsyncStorage.removeItem(LAST_ROLE_KEY);
      }
      const onboardingDone = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
      if (onboardingDone === 'true') {
        setInitialRoute('Landing');
      } else {
        setInitialRoute('MissionFoundations');
      }
    } catch (e) {
      // Graceful fallback to Landing
      setInitialRoute('Landing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
        initialRouteName={initialRoute}
      >
        {/* Onboarding Flow for First Time Users */}
        <Stack.Screen name="MissionFoundations" component={MissionFoundationsScreen} />
        <Stack.Screen name="MissionCorePillars" component={MissionCorePillarsScreen} />
        <Stack.Screen name="MissionLogistics" component={MissionLogisticsScreen} />
        <Stack.Screen name="MissionDeployment" component={MissionDeploymentScreen} />

        {/* Auth */}
        <Stack.Screen name="Landing" component={LandingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignupScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* Main Application */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="CollectorDashboard" component={CollectorDashboardScreen} />
        <Stack.Screen name="Collection" component={CollectorDashboardScreen} />
        <Stack.Screen name="CollectorProfile" component={CollectorProfileScreen} />

        {/* Action & Modal Screens */}
        <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Quality" component={QualityScreen} />
        <Stack.Screen name="PickupMap" component={PickupMapScreen} />

        {/* Settings */}
        <Stack.Screen name="PersonalSettings" component={PersonalSettingsScreen} />
        <Stack.Screen name="AlertSettings" component={AlertSettingsScreen} />
        <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
        <Stack.Screen name="HelpSettings" component={HelpSettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
