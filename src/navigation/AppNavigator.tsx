import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
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
import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';

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

export const AppNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<'MissionFoundations' | 'Landing' | 'MainTabs' | 'CollectorDashboard'>('Landing');

  useEffect(() => {
    checkInitialSession();
  }, []);

  const checkInitialSession = async () => {
    try {
      // 1. Check local session cache first for instant boot
      const isUserLoggedIn = await AsyncStorage.getItem(USER_LOGGED_IN_KEY);
      const lastRole = await AsyncStorage.getItem(LAST_ROLE_KEY);

      if (isUserLoggedIn === 'true') {
        if (lastRole === 'collector') {
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
          if (profile?.role === 'collector') {
            await AsyncStorage.setItem(LAST_ROLE_KEY, 'collector');
            setInitialRoute('CollectorDashboard');
          } else {
            await AsyncStorage.setItem(LAST_ROLE_KEY, 'donor');
            setInitialRoute('MainTabs');
          }
        } catch {
          // If profile fetch fails, user is still authenticated -> default to MainTabs/Dashboard
          if (lastRole === 'collector') {
            setInitialRoute('CollectorDashboard');
          } else {
            setInitialRoute('MainTabs');
          }
        }
        return;
      }

      // 3. Not logged in -> check onboarding
      if (isUserLoggedIn !== 'true') {
        const onboardingDone = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
        if (onboardingDone === 'true') {
          setInitialRoute('Landing');
        } else {
          setInitialRoute('MissionFoundations');
        }
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
    <NavigationContainer>
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
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />

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
