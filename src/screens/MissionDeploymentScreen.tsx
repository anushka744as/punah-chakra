import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { MissionHeader } from '../components/MissionHeader';
import { ONBOARDING_COMPLETE_KEY } from '../navigation/AppNavigator';

export const MissionDeploymentScreen = ({ navigation }: any) => {
  const completeOnboardingAndNavigate = async (targetScreen: string) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save onboarding completion state', e);
    }
    navigation.navigate(targetScreen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <MissionHeader />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.subtitleBox}>
          <Text style={styles.subtitleText}>MISSION 04/04: DEPLOYMENT</Text>
        </View>

        <Text style={styles.title}>Ready to Scale Your Impact?</Text>

        <Text style={styles.bodyText}>
          Join the industrial revolution in textile circularity. Harness our logistics network to transform waste into wealth at scale.
        </Text>

        <View style={{ flex: 1 }} />
      </ScrollView>

      <View style={styles.footerContainer}>
        <Button 
          title="CREATE AN ACCOUNT"
          style={styles.primaryButton}
          onPress={() => completeOnboardingAndNavigate('SignUp')} 
        />
        <Button 
          title="I already have an account"
          style={styles.secondaryButton}
          textStyle={styles.secondaryButtonText}
          onPress={() => completeOnboardingAndNavigate('Login')} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: theme.spacing.xl,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleBox: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  subtitleText: {
    ...theme.typography.label,
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.textInverse,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  bodyText: {
    ...theme.typography.body,
    color: theme.colors.textInverse,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  footerContainer: {
    padding: theme.spacing.xl,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryDark,
  },
  secondaryButtonText: {
    color: theme.colors.textInverse,
  },
});
