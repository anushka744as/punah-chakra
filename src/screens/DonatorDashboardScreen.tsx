import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppData } from '../data/AppDataContext';

export const DonatorDashboardScreen = ({ navigation }: any) => {
  const { donations } = useAppData();
  const latestDonation = donations[0];
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
          <Text style={styles.pickupTitle}>
            {latestDonation ? `${latestDonation.category} pickup scheduled` : 'No pickup scheduled'}
          </Text>
          <Text style={styles.pickupSubtitle}>
            {latestDonation
              ? `${latestDonation.pickup_day} · ${latestDonation.time_slot}`
              : 'Schedule a new donation to create a pickup request.'}
          </Text>
          <Button 
            title={latestDonation ? 'VIEW PICKUP MAP' : 'VIEW DETAILS'} 
            style={styles.viewDetailsBtn} 
            textStyle={styles.viewDetailsBtnText}
            onPress={() =>
              latestDonation
                ? navigation.navigate('PickupMap', { mode: 'donor', donationId: latestDonation.id })
                : navigation.navigate('ProfileDetail', { type: 'history' })
            }
          />
        </View>

        {/* Schedule New Donation */}
        <Button 
          title="+ SCHEDULE NEW DONATION"
          style={styles.scheduleBtn}
          onPress={() => navigation.navigate('ScheduleDonation')}
        />

        {/* Recent Contributions */}
        <Text style={styles.sectionTitle}>RECENT REQUESTS</Text>
        {donations.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="package-variant-closed" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>No donation requests have been created yet.</Text>
          </View>
        ) : (
          <View style={styles.contributionList}>
            {donations.slice(0, 3).map(item => (
              <View key={item.id} style={styles.contributionItem}>
                <View style={styles.contributionIcon}>
                  <Icon name="package-variant" size={24} color={theme.colors.primaryDark} />
                </View>
                <View style={styles.contributionDetails}>
                  <View style={styles.contributionHeader}>
                    <Text style={styles.contributionTitle}>{item.category}</Text>
                    <View style={styles.badgeCollected}>
                      <Text style={styles.badgeCollectedText}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={styles.contributionDate}>{item.pickup_day} · {item.time_slot}</Text>
                  <Text style={styles.contributionAddress}>{item.address}</Text>
                  <Button
                    title="VIEW MAP"
                    variant="outlined"
                    style={styles.inlineMapButton}
                    textStyle={styles.inlineMapButtonText}
                    onPress={() => navigation.navigate('PickupMap', { mode: 'donor', donationId: item.id })}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
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
    borderRadius: theme.radius.md,
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
  emptyBox: {
    alignItems: 'center',
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.bodySmall,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
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
    borderRadius: theme.radius.md,
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
  contributionAddress: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  inlineMapButton: {
    alignSelf: 'flex-start',
    borderColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inlineMapButtonText: {
    color: theme.colors.primary,
    fontSize: 10,
  },
});
