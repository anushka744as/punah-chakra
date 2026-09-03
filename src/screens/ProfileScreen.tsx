import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { USER_LOGGED_IN_KEY, LAST_ROLE_KEY } from '../navigation/AppNavigator';
import { supabase, fetchUserProfile, fetchUserDonations, cancelDonationRequest, type UserProfile, type DonationItem } from '../services/api';
import { theme } from '../theme/theme';

export const ProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [donations, setDonations] = useState<DonationItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const p = await fetchUserProfile(user.id);
        if (p) {
          setProfile(p);
          if (p.role === 'admin') setRole('admin');
        }
        const d = await fetchUserDonations(user.id);
        setDonations(d || []);
      }
    } catch { /* Graceful fallback */ }
  };

  const displayName = profile?.full_name || 'PunahChakra User';
  const displayEmail = profile?.email || '';
  const displayPoints = profile?.points ?? 0;
  const displayCo2 = profile?.co2_offset_kg ?? 0;
  const totalWeightKg = donations.reduce((sum, d) => sum + Number(d.weight_kg || 0), 0);
  const displayWasteDiverted = totalWeightKg >= 1000 ? `${(totalWeightKg / 1000).toFixed(1)} t` : `${totalWeightKg.toFixed(1)} kg`;

  const handleEditDonation = (item: DonationItem) => {
    navigation.navigate('Donate', { editDonation: item });
  };

  const handleCancelDonation = (item: DonationItem) => {
    Alert.alert(
      'Cancel Pickup Request?',
      'This will cancel your pickup request. You can schedule a new one anytime.',
      [
        { text: 'Keep Request', style: 'cancel' },
        {
          text: 'Cancel Pickup',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelDonationRequest(item.id, item.request_id);
              await loadProfileData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not cancel pickup request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(USER_LOGGED_IN_KEY);
              await AsyncStorage.removeItem(LAST_ROLE_KEY);
            } catch {}
            await supabase.auth.signOut();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/logo_icon.png')}
            style={styles.headerLogoImg}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.textInverse} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Icon
              name={role === 'user' ? 'account-outline' : 'truck-check-outline'}
              size={44}
              color={theme.colors.primary}
            />
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
        </View>

        {/* Impact Banner Card */}
        {role === 'user' ? (
          <View style={styles.impactCard}>
            <Text style={styles.impactTitleLabel}>ENVIRONMENTAL IMPACT</Text>
            <View style={styles.ptsRow}>
              <Text style={styles.ptsValue}>{displayPoints.toLocaleString()}</Text>
              <Text style={styles.ptsUnit}>PTS</Text>
            </View>

            <View style={styles.impactDivider} />

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.subLabel}>CO₂ OFFSET</Text>
                <Text style={styles.subVal}>{displayCo2} kg</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.subLabel}>WASTE DIVERTED</Text>
                <Text style={styles.subVal}>{displayWasteDiverted}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.impactCard}>
            <Text style={styles.impactTitleLabel}>COLLECTION LOGISTICS IMPACT</Text>
            <View style={styles.ptsRow}>
              <Text style={styles.ptsValue}>{totalWeightKg.toFixed(1)}</Text>
              <Text style={styles.ptsUnit}>KG COLLECTED</Text>
            </View>

            <View style={styles.impactDivider} />

            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.subLabel}>PICKUPS DONE</Text>
                <Text style={styles.subVal}>{donations.length} Jobs</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.subLabel}>STATUS</Text>
                <Text style={styles.subVal}>Active</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>
          {role === 'user' ? 'Recent activity' : 'Collection history'}
        </Text>
        <View style={styles.activityCard}>
          {donations.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Icon name="package-variant" size={28} color={theme.colors.primary} style={{ marginBottom: 6 }} />
              <Text style={{ fontFamily: theme.fonts.body, fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' }}>
                No recent activity — it appears here after your first pickup.
              </Text>
            </View>
          ) : (
            donations.map((item, idx) => (
              <React.Fragment key={item.id || idx}>
                {idx > 0 && <View style={styles.itemDivider} />}
                <View style={styles.activityRow}>
                  <View style={styles.activityIconBg}>
                    <Icon name="package-variant-closed" size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{item.category || 'Donation Batch'}</Text>
                    <Text style={styles.activityMeta}>{item.pickup_day} · {item.address}</Text>
                  </View>
                  <Text style={styles.pointsEarned}>+{item.points_awarded || 0} pts</Text>
                </View>
                {role === 'user' && item.status === 'pending' && (
                  <View style={styles.activityActionsRow}>
                    <TouchableOpacity
                      style={styles.activityActionBtn}
                      onPress={() => handleEditDonation(item)}
                      activeOpacity={0.7}
                    >
                      <Icon name="pencil-outline" size={16} color={theme.colors.primary} />
                      <Text style={styles.activityActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.activityActionBtn}
                      onPress={() => handleCancelDonation(item)}
                      activeOpacity={0.7}
                    >
                      <Icon name="close-circle-outline" size={16} color={theme.colors.error} />
                      <Text style={[styles.activityActionText, { color: theme.colors.error }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </React.Fragment>
            ))
          )}
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionTitle}>Account settings</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('PersonalSettings')}
            activeOpacity={0.7}
          >
            <Icon name="account-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.settingText}>Personal Information</Text>
            <Icon name="chevron-right" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('AlertSettings')}
            activeOpacity={0.7}
          >
            <Icon name="bell-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.settingText}>Collection Alerts</Text>
            <Icon name="chevron-right" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('PrivacySettings')}
            activeOpacity={0.7}
          >
            <Icon name="shield-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.settingText}>Privacy & Security</Text>
            <Icon name="chevron-right" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('HelpSettings')}
            activeOpacity={0.7}
          >
            <Icon name="help-circle-outline" size={22} color={theme.colors.primary} />
            <Text style={styles.settingText}>Help Center</Text>
            <Icon name="chevron-right" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.colors.textInverse,
  },
  userAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  roleToggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.radius.full,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    gap: 6,
  },
  roleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  roleBtnText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.primary,
    letterSpacing: 0.4,
  },
  roleBtnTextActive: {
    color: theme.colors.textInverse,
  },
  userCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontFamily: theme.fonts.heading,
    fontSize: 17,
    color: theme.colors.text,
    marginBottom: 3,
  },
  userEmail: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  certifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    gap: 6,
  },
  certifiedText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.primary,
    letterSpacing: 0.4,
  },
  impactCard: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.md,
    padding: 20,
    marginBottom: 20,
  },
  impactTitleLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  ptsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 16,
  },
  ptsValue: {
    fontFamily: theme.fonts.heading,
    fontSize: 32,
    color: theme.colors.secondary,
  },
  ptsUnit: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  impactDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  subLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  subVal: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.textInverse,
  },
  sectionTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 12,
  },
  activityCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.text,
  },
  activityMeta: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  pointsEarned: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.secondary,
  },
  activityActionsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    marginTop: -6,
  },
  activityActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background,
  },
  activityActionText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12,
    color: theme.colors.primary,
  },
  itemDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  settingsCard: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  signOutBtn: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.full,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signOutText: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textInverse,
    fontSize: 14,
    letterSpacing: 0.8,
  },
});


