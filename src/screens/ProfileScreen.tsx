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
import { supabase, fetchUserProfile, fetchUserDonations, type UserProfile, type DonationItem } from '../services/api';

export const ProfileScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<'donor' | 'collector'>('donor');
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
          if (p.role === 'collector') setRole('collector');
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
            await supabase.auth.signOut();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

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
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Icon
              name={role === 'donor' ? 'account-outline' : 'truck-check-outline'}
              size={44}
              color="#15A800"
            />
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
        </View>

        {/* Impact Banner Card */}
        {role === 'donor' ? (
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
          {role === 'donor' ? 'Recent activity' : 'Collection history'}
        </Text>
        <View style={styles.activityCard}>
          {donations.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Icon name="package-variant" size={32} color="#94A3B8" style={{ marginBottom: 6 }} />
              <Text style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center' }}>
                No recent activity yet.
              </Text>
            </View>
          ) : (
            donations.map((item, idx) => (
              <React.Fragment key={item.id || idx}>
                {idx > 0 && <View style={styles.itemDivider} />}
                <View style={styles.activityRow}>
                  <View style={styles.activityIconBg}>
                    <Icon name="package-variant-closed" size={22} color="#15A800" />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{item.category || 'Donation Batch'}</Text>
                    <Text style={styles.activityMeta}>{item.pickup_day} · {item.address}</Text>
                  </View>
                  <Text style={styles.pointsEarned}>+{item.points_awarded || 0} pts</Text>
                </View>
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
            <Icon name="account-outline" size={22} color="#64748B" />
            <Text style={styles.settingText}>Personal Information</Text>
            <Icon name="chevron-right" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('AlertSettings')}
            activeOpacity={0.7}
          >
            <Icon name="bell-outline" size={22} color="#64748B" />
            <Text style={styles.settingText}>Collection Alerts</Text>
            <Icon name="chevron-right" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('PrivacySettings')}
            activeOpacity={0.7}
          >
            <Icon name="shield-outline" size={22} color="#64748B" />
            <Text style={styles.settingText}>Privacy & Security</Text>
            <Icon name="chevron-right" size={22} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.itemDivider} />

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('HelpSettings')}
            activeOpacity={0.7}
          >
            <Icon name="help-circle-outline" size={22} color="#64748B" />
            <Text style={styles.settingText}>Help Center</Text>
            <Icon name="chevron-right" size={22} color="#94A3B8" />
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
    backgroundColor: '#F8F9FE',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#15A800',
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
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
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
    backgroundColor: '#E2E8F0',
    borderRadius: 20,
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
    borderRadius: 16,
    gap: 6,
  },
  roleBtnActive: {
    backgroundColor: '#15A800',
  },
  roleBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15A800',
    letterSpacing: 0.5,
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
  },
  userCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#6EE7B7',
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
  },
  certifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  certifiedText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15A800',
    letterSpacing: 0.8,
  },
  impactCard: {
    backgroundColor: '#15A800',
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
  },
  impactTitleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  ptsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 18,
  },
  ptsValue: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  ptsUnit: {
    fontSize: 18,
    fontWeight: '800',
    color: '#A7F3D0',
  },
  impactDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  subVal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15A800',
    marginBottom: 12,
  },
  activityCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  activityMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  pointsEarned: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15A800',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  settingsCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  signOutBtn: {
    backgroundColor: '#15A800',
    borderRadius: 30,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signOutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
});


