import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Image } from 'react-native';
import { theme } from '../theme/theme';
import { Button } from '../components/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const UserProfileScreen = ({ navigation }: any) => {
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
          <Text style={styles.userName}>Marcus Thorne</Text>
          <Text style={styles.userEmail}>marcus.thorne@company.com</Text>
          <Button 
            title="EDIT PROFILE" 
            variant="outlined"
            style={styles.editBtn}
            textStyle={styles.editBtnText}
            onPress={() => {}}
          />
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>TOTAL IMPACT POINTS</Text>
          <Text style={styles.pointsValue}>14,280 <Text style={styles.pointsUnit}>POINTS</Text></Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>642 kg</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>1.2 t</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT ACTIVITY</Text>
          <TouchableOpacity>
            <Text style={styles.viewAll}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Icon name="package" size={24} color={theme.colors.primaryDark} />
            </View>
            <View style={styles.activityDetails}>
              <Text style={styles.activityTitle}>Bulk Purchase of Recyclables</Text>
              <Text style={styles.activityDate}>Yesterday</Text>
            </View>
            <Text style={styles.activityAmount}>+$4.20</Text>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Icon name="factory" size={24} color={theme.colors.primaryDark} />
            </View>
            <View style={styles.activityDetails}>
              <Text style={styles.activityTitle}>Industrial Scale...</Text>
              <Text style={styles.activityDate}>Oct 24</Text>
            </View>
            <Text style={styles.activityAmount}>+$1.00</Text>
          </View>
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>ACCOUNT SETTINGS</Text>
        <View style={styles.settingsList}>
          {[
            { icon: 'account-outline', label: 'Personal Information' },
            { icon: 'history', label: 'Collection History' },
            { icon: 'shield-check-outline', label: 'Privacy & Security' },
            { icon: 'help-circle-outline', label: 'Help Center' }
          ].map((item, index) => (
            <TouchableOpacity key={index} style={styles.settingsItem}>
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
    borderRadius: theme.radius,
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
    borderRadius: theme.radius,
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
