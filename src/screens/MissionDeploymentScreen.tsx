import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { MissionHeader } from '../components/MissionHeader';

export const MissionDeploymentScreen = ({ navigation }: any) => {
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
          title="JOIN AS PROVIDER 🏢"
          style={styles.primaryButton}
          onPress={() => navigation.navigate('SignUp')} 
        />
        <Button 
          title="JOIN AS RECYCLER ♻️"
          style={styles.secondaryButton}
          textStyle={styles.secondaryButtonText}
          onPress={() => navigation.navigate('SignUp')} 
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate 900
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
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
    backgroundColor: theme.colors.primaryDark, // It looks like dark green bg
  },
  secondaryButtonText: {
    color: theme.colors.textInverse,
  },
});
