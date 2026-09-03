import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppData } from '../data/AppDataContext';

export const UserProfileScreen = ({ navigation }: any) => {
  const { donations, profile } = useAppData();
  const scheduledCount = donations.filter(item => item.status === 'pending' || item.status === 'scheduled' || item.status === 'assigned').length;
  const collectedCount = donations.filter(item => item.status === 'collected').length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder}>
              <Icon name="account" size={40} color={theme.colors.textInverse} />
            </View>
          </View>
          <Text style={styles.userName}>{profile?.full_name || 'PunahChakra User'}</Text>
          <Text style={styles.userEmail}>{profile?.email || 'No email added'}</Text>
          <Button 
            title="EDIT PROFILE" 
            variant="outlined"
            style={styles.editBtn}
            textStyle={styles.editBtnText}
            onPress={() => navigation.navigate('ProfileDetail', { type: 'personal' })}
          />
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>TOTAL IMPACT POINTS</Text>
          <Text style={styles.pointsValue}>0 <Text style={styles.pointsUnit}>POINTS</Text></Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{scheduledCount} scheduled</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{collectedCount} collected</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileDetail', { type: 'history' })}>
            <Text style={styles.viewAll}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        {donations.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Text style={styles.emptyActivityText}>No recent activity yet.</Text>
          </View>
        ) : (
          <View style={styles.activityList}>
            {donations.slice(0, 2).map(item => (
              <View key={item.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Icon name="package" size={24} color={theme.colors.primaryDark} />
                </View>
                <View style={styles.activityDetails}>
                  <Text style={styles.activityTitle}>{item.category}</Text>
                  <Text style={styles.activityDate}>{item.pickup_day} · {item.time_slot}</Text>
                </View>
                <Text style={styles.activityAmount}>{item.status.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
        <View style={styles.settingsList}>
          {[
            { icon: 'account-outline', label: 'Personal Information', type: 'personal' },
            { icon: 'history', label: 'Collection History', type: 'history' },
            { icon: 'shield-check-outline', label: 'Privacy & Security', type: 'privacy' },
            { icon: 'help-circle-outline', label: 'Help Center', type: 'help' }
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.settingsItem}
              onPress={() => navigation.navigate('ProfileDetail', { type: item.type })}
            >
              <Icon name={item.icon} size={24} color={theme.colors.textSecondary} />
              <Text style={styles.settingsLabel}>{item.label}</Text>
              <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <Button 
          title="LOG OUT"
          style={styles.logoutBtn}
          onPress={() => {
            // Navigate back to Login or Welcome
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }}
        />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  avatarContainer: {
    marginBottom: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    ...theme.typography.h3,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  editBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderColor: theme.colors.primary,
  },
  editBtnText: {
    fontSize: 10,
    color: theme.colors.primary,
  },
  pointsCard: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderRadius: theme.radius.md,
  },
  pointsLabel: {
    fontSize: 10,
    color: theme.colors.textInverse,
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.textInverse,
    marginBottom: theme.spacing.md,
  },
  pointsUnit: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statBox: {
    paddingHorizontal: theme.spacing.lg,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textInverse,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  viewAll: {
    fontSize: 10,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  activityList: {
    marginBottom: theme.spacing.xl,
  },
  emptyActivity: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.md,
  },
  emptyActivityText: {
    ...theme.typography.bodySmall,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    ...theme.typography.label,
    fontSize: 12,
  },
  activityDate: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  activityAmount: {
    ...theme.typography.label,
    color: theme.colors.primary,
  },
  settingsList: {
    marginBottom: theme.spacing.xl,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingsLabel: {
    ...theme.typography.body,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  logoutBtn: {
    backgroundColor: theme.colors.primaryDark,
  },
});
