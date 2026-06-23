import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { theme } from '../theme/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const NotificationsScreen = () => {
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
        <Text style={styles.title}>Notifications</Text>
        <Text style={styles.subtitle}>Stay updated on your recycling impact</Text>

        <View style={styles.notificationList}>
          {/* Item 1 */}
          <View style={styles.notificationItem}>
            <View style={styles.iconContainerPrimary}>
              <Icon name="calendar-check" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.details}>
              <View style={styles.headerRow}>
                <Text style={styles.notifTitle}>Scheduled Collection Today</Text>
                <Text style={styles.timeText}>1h ago</Text>
              </View>
              <Text style={styles.notifBody}>
                Your items are scheduled to be collected by our regional team today.
              </Text>
              <View style={styles.actionsRow}>
                <View style={styles.actionButton}>
                  <Text style={styles.actionText}>VIEW DETAILS</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Item 2 */}
          <View style={styles.notificationItem}>
            <View style={styles.iconContainerDark}>
              <Icon name="star" size={20} color={theme.colors.textInverse} />
            </View>
            <View style={styles.details}>
              <View style={styles.headerRow}>
                <Text style={styles.notifTitle}>+450 Points Earned</Text>
                <Text style={styles.timeText}>2d ago</Text>
              </View>
              <Text style={styles.notifBody}>
                Points applied to your account for the latest plastic and paper drop-off.
              </Text>
            </View>
          </View>

          {/* Item 3 */}
          <View style={styles.notificationItem}>
            <View style={styles.iconContainerGrey}>
              <Icon name="check-circle-outline" size={20} color={theme.colors.textSecondary} />
            </View>
            <View style={styles.details}>
              <View style={styles.headerRow}>
                <Text style={styles.notifTitle}>Quality Check: Demand Items</Text>
                <Text style={styles.timeText}>1w ago</Text>
              </View>
              <Text style={styles.notifBody}>
                Your collection has passed review! +5% bonus on your next donation.
              </Text>
            </View>
          </View>

          {/* Item 4 */}
          <View style={styles.notificationItem}>
            <View style={styles.iconContainerDark}>
              <Icon name="truck-check" size={20} color={theme.colors.textInverse} />
            </View>
            <View style={styles.details}>
              <View style={styles.headerRow}>
                <Text style={styles.notifTitle}>Pickup Confirmation</Text>
                <Text style={styles.timeText}>2w ago</Text>
              </View>
              <Text style={styles.notifBody}>
                Driver ID #A-32 has collected your items at the chosen logistics drop off point.
              </Text>
              <View style={styles.actionsRow}>
                <View style={styles.actionButtonSolid}>
                  <Text style={styles.actionTextInverse}>VIEW BILL</Text>
                </View>
              </View>
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
    padding: theme.spacing.xl,
  },
  title: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  notificationList: {
    marginBottom: 40,
  },
  notificationItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.lg,
  },
  iconContainerPrimary: {
    width: 32,
    height: 32,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  iconContainerDark: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  iconContainerGrey: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  details: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notifTitle: {
    ...theme.typography.label,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  notifBody: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  actionButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  actionButtonSolid: {
    backgroundColor: theme.colors.primaryDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionTextInverse: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textInverse,
  },
});
