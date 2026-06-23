import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const DonatorDashboardScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={styles.headerLogo}>
          <Icon name="recycle" size={18} color={theme.colors.primaryDark} />
          <Text style={styles.logoText}>PUNAHCHAKRA</Text>
        </View>
        <Icon name="account-circle-outline" size={24} color={theme.colors.textInverse} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Pickup Status Card */}
        <View style={styles.pickupCard}>
          <Icon name="truck" size={24} color={theme.colors.primaryDark} style={{ marginBottom: 8 }} />
          <Text style={styles.pickupLabel}>PICKUP STATUS</Text>
          <Text style={styles.pickupTitle}>Scheduled for Tomorrow</Text>
          <Text style={styles.pickupSubtitle}>Estimated window: 09:00 AM - 12:00 PM</Text>
          <Button 
            title="VIEW DETAILS" 
            style={styles.viewDetailsBtn} 
            textStyle={styles.viewDetailsBtnText}
            onPress={() => {}}
          />
        </View>

        {/* Schedule New Donation */}
        <Button 
          title="+ SCHEDULE NEW DONATION"
          style={styles.scheduleBtn}
          onPress={() => navigation.navigate('ScheduleDonation')}
        />

        {/* Recent Contributions */}
        <Text style={styles.sectionTitle}>RECENT CONTRIBUTIONS</Text>
        <View style={styles.contributionList}>
          <View style={styles.contributionItem}>
            <View style={styles.contributionIcon}>
              <Icon name="package-variant" size={24} color={theme.colors.primaryDark} />
            </View>
            <View style={styles.contributionDetails}>
              <View style={styles.contributionHeader}>
                <Text style={styles.contributionTitle}>Plastic & Paper</Text>
                <View style={styles.badgeCollected}>
                  <Text style={styles.badgeCollectedText}>COLLECTED</Text>
                </View>
              </View>
              <Text style={styles.contributionDate}>OCT 24, 2023 • 4.5 KG</Text>
              <Text style={styles.contributionPoints}>+450 Points Earned</Text>
            </View>
          </View>
          
          <View style={styles.contributionItem}>
            <View style={[styles.contributionIcon, { backgroundColor: '#E0F2FE' }]}>
              <Icon name="lightning-bolt" size={24} color="#0284C7" />
            </View>
            <View style={styles.contributionDetails}>
              <View style={styles.contributionHeader}>
                <Text style={styles.contributionTitle}>E-Waste Cluster</Text>
                <View style={styles.badgeCollected}>
                  <Text style={styles.badgeCollectedText}>COLLECTED</Text>
                </View>
              </View>
              <Text style={styles.contributionDate}>OCT 18, 2023 • 12.0 KG</Text>
              <Text style={styles.contributionPoints}>+1,200 Points Earned</Text>
            </View>
          </View>
        </View>

        {/* Total Impact Points */}
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>TOTAL IMPACT POINTS</Text>
          <Text style={styles.impactScore}>12,450</Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.impactSubtitle}>Next Tier: Earth Warrior (750 points to go)</Text>
        </View>

        {/* CO2 Offset */}
        <View style={styles.co2Card}>
          <Icon name="pine-tree" size={32} color={theme.colors.primary} />
          <Text style={styles.co2Score}>14.2 kg</Text>
          <Text style={styles.co2Label}>CO2 OFFSET</Text>
        </View>

        {/* Your Local Contribution */}
        <View style={styles.localCard}>
          <Text style={styles.localTitle}>YOUR LOCAL CONTRIBUTION</Text>
          <Text style={styles.localText}>
            You are in the top 5% of recyclers in your metropolitan area. Your efforts have directly contributed to the restoration of the Evergreen Park project.
          </Text>
          
          <View style={styles.localStatsRow}>
            <View style={styles.localStatBox}>
              <Text style={styles.localStatValue}>12</Text>
              <Text style={styles.localStatLabel}>COLLECTIONS</Text>
            </View>
            <View style={styles.localStatBox}>
              <Text style={styles.localStatValue}>03</Text>
              <Text style={styles.localStatLabel}>BADGES</Text>
            </View>
          </View>
          
          <View style={styles.mapPlaceholder}>
            <View style={styles.mapOverlay}>
              <Button 
                title="VIEW IMPACT MAP" 
                style={styles.mapButton} 
                textStyle={styles.mapButtonText}
              />
            </View>
          </View>
        </View>
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
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  pickupCard: {
    backgroundColor: '#D1FAE5', // Light green
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius,
  },
  pickupLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  pickupTitle: {
    ...theme.typography.label,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
    marginBottom: 4,
  },
  pickupSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.primaryDark,
    opacity: 0.8,
    marginBottom: theme.spacing.md,
  },
  viewDetailsBtn: {
    backgroundColor: theme.colors.textSecondary,
    paddingVertical: 8,
    paddingHorizontal: 24,
    width: '100%',
  },
  viewDetailsBtnText: {
    color: theme.colors.textInverse,
    fontSize: 12,
  },
  scheduleBtn: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  contributionList: {
    marginBottom: theme.spacing.xl,
  },
  contributionItem: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  contributionIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#ECFDF5', // Light primary
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderRadius: theme.radius,
  },
  contributionDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  contributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  contributionTitle: {
    ...theme.typography.label,
    fontWeight: 'bold',
  },
  badgeCollected: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
  },
  badgeCollectedText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.colors.primaryDark,
  },
  contributionDate: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  contributionPoints: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  impactCard: {
    backgroundColor: theme.colors.primaryDark,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  impactTitle: {
    fontSize: 10,
    color: theme.colors.textInverse,
    letterSpacing: 1,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  impactScore: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.md,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '70%',
    height: '100%',
    backgroundColor: theme.colors.primaryLight,
  },
  impactSubtitle: {
    fontSize: 10,
    color: theme.colors.textInverse,
  },
  co2Card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  co2Score: {
    ...theme.typography.label,
    fontWeight: 'bold',
    marginTop: theme.spacing.xs,
  },
  co2Label: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  localCard: {
    backgroundColor: '#0F172A', // Slate 900
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  localTitle: {
    fontSize: 10,
    color: theme.colors.textInverse,
    letterSpacing: 1,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  localText: {
    fontSize: 12,
    color: theme.colors.textInverse,
    opacity: 0.8,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  localStatsRow: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  localStatBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
  },
  localStatValue: {
    color: theme.colors.primaryLight,
    fontWeight: 'bold',
    fontSize: 16,
  },
  localStatLabel: {
    fontSize: 8,
    color: theme.colors.textInverse,
    opacity: 0.8,
  },
  mapPlaceholder: {
    height: 120,
    backgroundColor: '#334155', // Slate 700
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButton: {
    backgroundColor: theme.colors.primaryDark,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  mapButtonText: {
    fontSize: 10,
  },
});
