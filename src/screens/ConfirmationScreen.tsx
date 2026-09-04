import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';

import { useAppData } from '../data/AppDataContext';

export const ConfirmationScreen = ({ navigation, route }: any) => {
  const { donations } = useAppData();

  const donationId = route.params?.donationId;
  const currentDonation = donations.find(d => d.id === donationId) || donations[0];

  const requestId = currentDonation?.request_id || '—';
  const category = currentDonation?.category || '—';
  const weight = currentDonation?.weight_kg || currentDonation?.estimated_quantity_kg
    ? (currentDonation.weight_kg || currentDonation.estimated_quantity_kg) + ' kg'
    : '—';
  const slot = currentDonation?.pickup_day || currentDonation?.time_slot
    ? [currentDonation?.pickup_day, currentDonation?.time_slot].filter(Boolean).join(', ')
    : '—';
  const points = currentDonation?.points_awarded ? '+' + currentDonation.points_awarded + ' PTS' : '—';

  const handleReturnHome = () => {
    try {
      navigation.navigate('MainTabs', { screen: 'Home' });
    } catch {
      navigation.navigate('Home');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.successIconWrapper}>
          <Icon name="check-circle" size={80} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>Pickup Request Submitted!</Text>
        <Text style={styles.subtitle}>
          Request ID <Text style={styles.boldText}>{requestId}</Text> is awaiting confirmation from a nearby collector.
        </Text>

        <Card variant="outlined" style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>Pickup Summary</Text>
            <Badge label="Pending" variant="warning" />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Material Category</Text>
            <Text style={styles.val}>{category}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Estimated Weight</Text>
            <Text style={styles.val}>{weight}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Scheduled Slot</Text>
            <Text style={styles.val}>{slot}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Estimated EcoPoints</Text>
            <Text style={styles.valGreen}>{points}</Text>
          </View>
        </Card>

        <View style={styles.btnGroup}>
          <Button
            title="Return to Home"
            variant="primary"
            size="lg"
            onPress={handleReturnHome}
          />
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
  scrollContent: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  successIconWrapper: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  boldText: {
    fontWeight: '700',
    color: theme.colors.text,
  },
  receiptCard: {
    width: '100%',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  val: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  valGreen: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  qrPlaceholder: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    gap: 8,
  },
  qrText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  btnGroup: {
    width: '100%',
    gap: theme.spacing.md,
  },
});
