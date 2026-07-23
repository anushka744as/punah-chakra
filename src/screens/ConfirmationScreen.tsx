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

export const ConfirmationScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.successIconWrapper}>
          <Icon name="check-circle" size={80} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>Pickup Scheduled Successfully!</Text>
        <Text style={styles.subtitle}>
          Request ID <Text style={styles.boldText}>#PC-88942</Text> has been dispatched to nearby logistics partners.
        </Text>

        <Card variant="outlined" style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptTitle}>Pickup Summary</Text>
            <Badge label="Confirmed" variant="success" />
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Material Category</Text>
            <Text style={styles.val}>Mixed Plastics & E-Waste</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Estimated Weight</Text>
            <Text style={styles.val}>15 kg</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Scheduled Slot</Text>
            <Text style={styles.val}>Tomorrow, 10:00 AM - 12:00 PM</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Estimated EcoPoints</Text>
            <Text style={styles.valGreen}>+150 PTS</Text>
          </View>

          <View style={styles.qrPlaceholder}>
            <Icon name="qrcode-scan" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.qrText}>Show QR code to driver during collection</Text>
          </View>
        </Card>

        <View style={styles.btnGroup}>
          <Button
            title="Track Live Dispatch"
            variant="primary"
            size="lg"
            rightIcon={<Icon name="truck-fast" size={20} color="#FFF" />}
            onPress={() => navigation.navigate('Collection')}
          />
          <Button
            title="Return to Home"
            variant="outlined"
            size="lg"
            onPress={() => navigation.navigate('Home')}
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
