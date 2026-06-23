import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const WelcomeScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Icon name="menu" size={24} color={theme.colors.textInverse} />
        <View style={styles.headerLogo}>
          <Icon name="recycle" size={18} color={theme.colors.textInverse} />
          <Text style={styles.logoText}>PUNAHCHAKRA</Text>
        </View>
        <Icon name="account-circle-outline" size={24} color={theme.colors.textInverse} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>
          Welcome to PunahChakra. Please choose how you would like to interact with our professional recycling network today.
        </Text>

        {/* Donate Card */}
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Icon name="hanger" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.cardTitle}>I want to Donate</Text>
          <Text style={styles.cardText}>
            Schedule pick-ups for your used clothing and household textiles. Track your environmental impact.
          </Text>
          <Button 
            title="SELECT DONOR PORTAL"
            style={styles.donorButton}
            onPress={() => navigation.navigate('MainTabs')}
          />
        </View>

        {/* Collector Card */}
        <View style={styles.card}>
          <View style={styles.iconContainerDark}>
            <Icon name="truck-outline" size={32} color={theme.colors.textInverse} />
          </View>
          <Text style={styles.cardTitle}>I am a Collector</Text>
          <Text style={styles.cardText}>
            Manage routes, process pick-ups, and update collection statuses in real-time for your logistics fleet.
          </Text>
          <Button 
            title="SELECT LOGISTICS PORTAL"
            style={styles.collectorButton}
            onPress={() => navigation.navigate('CollectorDashboard')}
          />
        </View>
        
        <View style={styles.spacer} />
        
        <Text style={styles.footerText}>
          <Icon name="shield-check" size={12} /> Secure Industrial Access
        </Text>
        <Text style={styles.copyrightText}>PUNAHCHAKRA INDUSTRIAL SYSTEMS © 2024</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  headerLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  logoText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
  },
  card: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.surfaceVariant, // light green/grey background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  iconContainerDark: {
    width: 64,
    height: 64,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.sm,
  },
  cardText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  donorButton: {
    width: '100%',
  },
  collectorButton: {
    width: '100%',
    backgroundColor: theme.colors.primaryDark,
  },
  spacer: {
    flex: 1,
  },
  footerText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    marginTop: 16,
  },
  copyrightText: {
    fontSize: 8,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
});
