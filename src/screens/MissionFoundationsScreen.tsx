import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { MissionHeader } from '../components/MissionHeader';
import { ONBOARDING_COMPLETE_KEY } from '../navigation/AppNavigator';

export const MissionFoundationsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const completeOnboarding = async (targetScreen: string) => {
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
        <View style={styles.subtitleContainer}>
          <View style={styles.line} />
          <Text style={styles.subtitle}>STEP 1: COLLECTION</Text>
          <View style={styles.line} />
        </View>

        <Text style={styles.title}>
          From Your Door,{'\n'}
          <Text style={styles.titleHighlight}>To Their Need</Text>
        </Text>

        <Text style={styles.bodyText}>
          PunahChakra is a community-driven initiative that makes donating easy. We pick up your clothes, shoes, blankets, bedsheets and bags right from your doorstep and deliver them to the people and causes that need them most.
        </Text>

        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Icon name="home-map-marker" size={24} color={theme.colors.primary} />
            <Text style={styles.chipTitle}>Doorstep</Text>
            <Text style={styles.chipSubtitle}>Easy Pickup</Text>
          </View>
          <View style={styles.chip}>
            <Icon name="account-heart-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.chipTitle}>Community</Text>
            <Text style={styles.chipSubtitle}>Local Impact</Text>
          </View>
        </View>

        <View style={styles.logoBox}>
          <View style={styles.logoCircle}>
            <Text style={styles.hindiLogo}>पुनः</Text>
          </View>
          <Text style={styles.logoTextMain}>PunahChakra</Text>
          <Text style={styles.logoTextSub}>A Community Platform{'\n'}for Reuse, Redistribution, and Impact</Text>
        </View>
      </ScrollView>

      <View style={[styles.footerRow, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
        <Button 
          title="Skip"
          variant="outlined"
          style={styles.flex1}
          onPress={() => completeOnboarding('Landing')} 
        />
        <View style={{ width: theme.spacing.md }} />
        <Button 
          title="Next"
          style={styles.flex1}
          onPress={() => navigation.navigate('MissionCorePillars')} 
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
  content: {
    padding: theme.spacing.xl,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.primary,
  },
  subtitle: {
    ...theme.typography.label,
    color: theme.colors.primary,
    marginHorizontal: theme.spacing.sm,
    letterSpacing: 1,
  },
  title: {
    ...theme.typography.h1,
    marginBottom: theme.spacing.md,
    lineHeight: 40,
  },
  titleHighlight: {
    color: theme.colors.primary,
  },
  bodyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
  },
  chipTitle: {
    ...theme.typography.h3,
    marginTop: theme.spacing.sm,
    fontSize: 18,
  },
  chipSubtitle: {
    ...theme.typography.bodySmall,
    marginTop: 4,
  },
  logoBox: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderBottomColor: theme.colors.primary,
    borderRightColor: theme.colors.primary,
    padding: theme.spacing.xl,
    alignItems: 'center',
    position: 'relative',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  hindiLogo: {
    fontSize: 28,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  logoTextMain: {
    fontSize: 24,
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  logoTextSub: {
    ...theme.typography.bodySmall,
    textAlign: 'center',
    marginTop: 8,
  },
  estBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  estText: {
    ...theme.typography.label,
    color: theme.colors.textInverse,
    fontSize: 10,
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
});
