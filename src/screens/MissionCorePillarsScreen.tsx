import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { MissionHeader } from '../components/MissionHeader';
import { ONBOARDING_COMPLETE_KEY } from '../navigation/AppNavigator';

export const MissionCorePillarsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const completeOnboarding = async (targetScreen: string) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    } catch (e) {
      console.warn('Failed to save onboarding state', e);
    }
    navigation.navigate(targetScreen);
  };

  return (
    <SafeAreaView style={styles.container}>
      <MissionHeader 
        rightElement={
          <View style={styles.badgeBox}>
            <Text style={styles.badgeText}>2/4</Text>
          </View>
        }
      />
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>STEP 2: SORTING</Text>
        <Text style={styles.title}>How We Sort Your Donations</Text>

        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>01</Text>
          <View style={styles.pillarHeader}>
            <View style={styles.iconBox}>
              <Icon name="hanger" size={26} color={theme.colors.primary} />
            </View>
            <Text style={styles.pillarTitle}>Careful Sorting</Text>
          </View>
          <Text style={styles.pillarText}>
            Every donation is sorted by category — clothes, shoes, blankets/bedsheets, and bags — so it reaches the right place quickly.
          </Text>
          <View style={styles.featureBadgeRow}>
            <Icon name="checkbox-marked-circle" size={16} color={theme.colors.primary} />
            <Text style={styles.featureBadgeText}>Sorted by Category</Text>
          </View>
        </View>

        <View style={styles.pillarCard}>
          <Text style={styles.pillarNumber}>02</Text>
          <View style={styles.pillarHeader}>
            <View style={styles.iconBox}>
              <Icon name="check-decagram" size={26} color={theme.colors.primary} />
            </View>
            <Text style={styles.pillarTitle}>Quality Checked</Text>
          </View>
          <Text style={styles.pillarText}>
            We check that every item is clean and usable before it's passed on, so your donation actually helps whoever receives it.
          </Text>
          <View style={styles.featureBadgeRow}>
            <Icon name="shield-check" size={16} color={theme.colors.primary} />
            <Text style={styles.featureBadgeText}>Checked Before Redistribution</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footerRow, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
        <Button 
          title="BACK"
          variant="outlined"
          style={styles.flex1}
          onPress={() => navigation.goBack()} 
        />
        <View style={{ width: theme.spacing.md }} />
        <Button 
          title="NEXT: REDISTRIBUTION"
          style={styles.flex2}
          onPress={() => navigation.navigate('MissionLogistics')} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  badgeBox: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: theme.colors.textInverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    padding: theme.spacing.xl,
  },
  subtitle: {
    ...theme.typography.label,
    color: theme.colors.primary,
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primaryDark,
    marginBottom: theme.spacing.xl,
  },
  pillarCard: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    position: 'relative',
  },
  pillarNumber: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.surfaceVariant,
  },
  pillarHeader: {
    marginBottom: theme.spacing.md,
  },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillarTitle: {
    ...theme.typography.h3,
    fontWeight: 'bold',
  },
  pillarText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  featureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.primaryContainer,
  },
  featureBadgeText: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
  },
  footerRow: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  flex1: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
});
