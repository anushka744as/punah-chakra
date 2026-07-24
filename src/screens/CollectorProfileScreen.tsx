import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppData } from '../data/AppDataContext';
import { supabase } from '../services/api';

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useMemo } from 'react';

export const CollectorProfileScreen = ({ navigation }: any) => {
  const { profile, authUser, donations, signOut, refreshProfile } = useAppData();
  const [cachedCompleted, setCachedCompleted] = useState<any[]>([]);
  const [dbProfileData, setDbProfileData] = useState<{ full_name?: string; email?: string } | null>(null);

  const fetchDirectProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .single();

        setDbProfileData({
          full_name: data?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
          email: data?.email || user.email,
        });
      }
    } catch {}
  };

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      loadCachedCompleted();
      fetchDirectProfile();
    }, [])
  );

  const loadCachedCompleted = async () => {
    try {
      const raw = await AsyncStorage.getItem('@completed_collector_pickups');
      if (raw) {
        setCachedCompleted(JSON.parse(raw));
      }
    } catch {}
  };

  const displayName = dbProfileData?.full_name || profile?.full_name || authUser?.full_name || (authUser?.email ? authUser.email.split('@')[0] : 'Collector');
  const displayEmail = dbProfileData?.email || profile?.email || authUser?.email || '';

  // Combine completed donations from Supabase with cached local completed pickups
  const completedDonations = useMemo(() => {
    const list: any[] = [];
    const seen = new Set<string>();

    donations
      .filter(d => d.is_picked_up || d.status === 'completed')
      .forEach(d => {
        const key = d.id || d.request_id || '';
        if (key && !seen.has(key)) {
          seen.add(key);
          list.push(d);
        }
      });

    cachedCompleted.forEach(c => {
      const key = c.id || c.request_id || '';
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(c);
      }
    });

    return list;
  }, [donations, cachedCompleted]);

  // Calculate stats from accepted/completed pickups
  const totalKg = completedDonations.reduce((sum, d) => sum + Number(d.weight_kg || d.estimated_quantity_kg || 10), 0);
  const computedPoints = completedDonations.reduce((sum, d) => sum + Number(d.points_awarded || Math.round((d.weight_kg || 10) * 20)), 0);
  const computedCo2 = completedDonations.reduce((sum, d) => sum + Math.round(Number(d.weight_kg || 10) * 2.5 * 10) / 10, 0);

  const totalPoints = Math.max(Number(profile?.points || 0), computedPoints);
  const co2Offset = Math.max(Number(profile?.co2_offset_kg || 0), computedCo2);
  const wasteDivertedText = totalKg >= 1000
    ? `${(totalKg / 1000).toFixed(2)} t`
    : totalKg > 0
      ? `${totalKg.toFixed(1)} kg`
      : '0.0 kg';

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Landing' }],
            });
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Could not sign out.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.profileBtn}>
          <Icon name="account-circle-outline" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Icon name="account-outline" size={42} color="#15A800" />
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>
        </View>

        {/* Environmental Impact Card */}
        <View style={styles.impactCard}>
          <Text style={styles.impactTitle}>ENVIRONMENTAL IMPACT</Text>
          <Text style={styles.impactPts}>{totalPoints.toLocaleString()} <Text style={styles.impactPtsSub}>PTS</Text></Text>

          <View style={styles.divider} />

          <View style={styles.impactStatsRow}>
            <View style={styles.impactStat}>
              <Text style={styles.statLabel}>CO₂ OFFSET</Text>
              <Text style={styles.statVal}>{co2Offset} kg</Text>
            </View>
            <View style={styles.impactStat}>
              <Text style={styles.statLabel}>WASTE DIVERTED</Text>
              <Text style={styles.statVal}>{wasteDivertedText}</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Recent activity</Text>

          {completedDonations.length === 0 ? (
            <View style={styles.emptyActivityContainer}>
              <Icon name="history" size={28} color="#94A3B8" />
              <Text style={styles.emptyActivityText}>No completed pickup activity yet.</Text>
            </View>
          ) : (
            completedDonations.slice(0, 5).map((item, idx) => (
              <View key={item.id || idx} style={idx === 0 ? styles.activityItem : styles.activityItemBordered}>
                <View style={styles.activityIconBg}>
                  <Icon name="package-variant-closed" size={20} color="#15A800" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{item.category || 'Recycling'} Pickup</Text>
                  <Text style={styles.activitySub}>
                    {item.pickup_day || 'Today'} • {item.address ? item.address.split(',')[0] : 'Noida'}
                  </Text>
                </View>
                <Text style={styles.activityPts}>+{item.points_awarded || Math.round((item.weight_kg || 10) * 20)} pts</Text>
              </View>
            ))
          )}
        </View>

        {/* Account Settings Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Account settings</Text>

          <TouchableOpacity style={styles.settingRow} onPress={() => navigation.navigate('PersonalSettings')} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="account-cog-outline" size={22} color="#475569" />
              <Text style={styles.settingText}>Personal Information</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRowBordered} onPress={() => navigation.navigate('AlertSettings')} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="bell-outline" size={22} color="#475569" />
              <Text style={styles.settingText}>Collection Alerts</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRowBordered} onPress={() => navigation.navigate('PrivacySettings')} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="shield-lock-outline" size={22} color="#475569" />
              <Text style={styles.settingText}>Privacy & Security</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRowBordered} onPress={() => navigation.navigate('HelpSettings')} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Icon name="help-circle-outline" size={22} color="#475569" />
              <Text style={styles.settingText}>Help Center</Text>
            </View>
            <Icon name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Text style={styles.signOutBtnText}>SIGN OUT</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('CollectorDashboard')}>
          <Icon name="truck" size={24} color="#475569" />
          <Text style={styles.tabLabel}>Routes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('PickupMap', { mode: 'collector' })}>
          <Icon name="map-outline" size={24} color="#475569" />
          <Text style={styles.tabLabel}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('Quality')}>
          <Icon name="shield-check-outline" size={24} color="#475569" />
          <Text style={styles.tabLabel}>Quality</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <View style={styles.tabIconActiveBg}>
            <Icon name="account" size={24} color="#15A800" />
          </View>
          <Text style={styles.tabLabelActive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#15A800',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileBtn: {
    padding: 4,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#15A800',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 14,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15A800',
    letterSpacing: 0.5,
  },
  impactCard: {
    backgroundColor: '#15A800',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  impactTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DCFCE7',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  impactPts: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  impactPtsSub: {
    fontSize: 18,
    fontWeight: '700',
    color: '#DCFCE7',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 16,
  },
  impactStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  impactStat: {},
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DCFCE7',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15A800',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  activityItemBordered: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  activityIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  activitySub: {
    fontSize: 12,
    color: '#64748B',
  },
  activityPts: {
    fontSize: 14,
    fontWeight: '800',
    color: '#15A800',
  },
  emptyActivityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 6,
  },
  emptyActivityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingRowBordered: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  signOutBtn: {
    backgroundColor: '#235E44',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  signOutBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIconActiveBg: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tabLabelActive: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});
