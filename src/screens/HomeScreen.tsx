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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase, fetchUserDonations, fetchUserProfile } from '../services/api';

export const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [co2Offset, setCo2Offset] = useState('0 kg');
  const [badgesCount, setBadgesCount] = useState(0);
  const [scheduledPickup, setScheduledPickup] = useState<string | null>(null);
  const [contributions, setContributions] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadLiveData();
    }, [])
  );

  const loadLiveData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const profile = await fetchUserProfile(user.id);
        if (profile) {
          setPoints(profile.points ?? 0);
          setCo2Offset(`${profile.co2_offset_kg ?? 0} kg`);
        }
        const donations = await fetchUserDonations(user.id);
        if (donations && donations.length > 0) {
          setContributions(donations.map((d) => ({
            id: d.id,
            title: d.category || 'Donation',
            date: `${d.pickup_day}${d.weight_kg ? ' · ' + d.weight_kg + ' kg' : ''}`,
            points: `+${d.points_awarded ?? 0} pts`,
            status: (d.status || 'scheduled').toUpperCase(),
            icon: (d.category || '').toLowerCase().includes('textile') || (d.category || '').toLowerCase().includes('clothes')
              ? 'tshirt-crew-outline'
              : (d.category || '').toLowerCase().includes('e-waste') || (d.category || '').toLowerCase().includes('electronic')
              ? 'flash-outline'
              : (d.category || '').toLowerCase().includes('paper')
              ? 'newspaper-variant-outline'
              : 'package-variant-closed',
          })));

          const active = donations.find((d) => d.status === 'scheduled' || d.status === 'assigned');
          setScheduledPickup(active ? `${active.pickup_day}, ${active.time_slot}` : null);
        } else {
          setContributions([]);
          setScheduledPickup(null);
        }
      }
    } catch {
      // fail silently — state stays empty
    } finally {
      setLoading(false);
    }
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
          <Text style={styles.logoText}>PunahChakra</Text>
        </View>
        <TouchableOpacity style={styles.userAvatarBtn} onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Total Impact Points Card */}
        <View style={styles.impactCard}>
          <View style={styles.impactHeader}>
            <Text style={styles.impactLabel}>TOTAL IMPACT POINTS</Text>
            <View style={styles.leafBg}>
              <Icon name="leaf-outline" size={80} color="rgba(255,255,255,0.18)" />
            </View>
          </View>

          <Text style={styles.impactValue}>{points.toLocaleString()}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.impactSubtext}>Next tier: Earth Warrior (750 pts to go)</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="pine-tree" size={32} color="#15A800" style={styles.statIcon} />
            <Text style={styles.statValue}>{co2Offset}</Text>
            <Text style={styles.statLabel}>CO₂ OFFSET</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="star-circle-outline" size={32} color="#15A800" style={styles.statIcon} />
            <Text style={styles.statValue}>{String(badgesCount).padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>BADGES</Text>
          </View>
        </View>

        {/* Pickup Scheduled Banner */}
        <View style={styles.scheduledBanner}>
          <View style={styles.truckIconBg}>
            <Icon name="truck-delivery" size={22} color="#15A800" />
          </View>
          <View style={styles.scheduledTextCol}>
            <Text style={styles.scheduledLabel}>PICKUP SCHEDULED</Text>
            <Text style={styles.scheduledTime}>
              {scheduledPickup ?? 'No pickup scheduled'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => navigation.navigate('Alerts')}
          >
            <Text style={styles.viewBtnText}>View</Text>
          </TouchableOpacity>
        </View>

        {/* Schedule New Donation Button */}
        <TouchableOpacity
          style={styles.scheduleBtn}
          onPress={() => navigation.navigate('Donate')}
          activeOpacity={0.8}
        >
          <View style={styles.plusIconBg}>
            <Icon name="plus" size={18} color="#15A800" />
          </View>
          <Text style={styles.scheduleBtnText}>Schedule new donation</Text>
        </TouchableOpacity>

        {/* Recent Contributions Section */}
        <Text style={styles.sectionTitle}>Recent contributions</Text>

        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : contributions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="package-variant-closed" size={32} color="#CBD5E1" />
            <Text style={styles.emptyText}>No donations yet. Schedule your first pickup!</Text>
          </View>
        ) : (
          contributions.map((item) => (
            <View key={item.id} style={styles.contributionCard}>
              <View style={styles.itemIconBg}>
                <Icon name={item.icon || 'package-variant-closed'} size={24} color="#15A800" />
              </View>
              <View style={styles.contributionDetails}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.itemMeta}>{item.date}</Text>
                <Text style={styles.itemPoints}>{item.points}</Text>
              </View>
            </View>
          ))
        )}
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
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  userAvatarBtn: {
    padding: 2,
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
  impactCard: {
    backgroundColor: '#15A800',
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  impactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  impactLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  leafBg: {
    position: 'absolute',
    right: -12,
    top: -12,
  },
  impactValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    marginVertical: 4,
    letterSpacing: -1,
  },
  progressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    width: '75%',
    height: '100%',
    backgroundColor: '#6EE7B7',
  },
  impactSubtext: {
    fontSize: 12,
    color: '#D1FAE5',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#15A800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  scheduledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A7F3D0',
    borderRadius: 20,
    padding: 14,
    marginBottom: 16,
  },
  truckIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#6EE7B7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scheduledTextCol: {
    flex: 1,
  },
  scheduledLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15A800',
    letterSpacing: 0.5,
  },
  scheduledTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15A800',
    marginTop: 2,
  },
  viewBtn: {
    backgroundColor: '#15A800',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15A800',
    borderRadius: 30,
    height: 54,
    gap: 10,
    marginBottom: 24,
  },
  plusIconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
  contributionCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  itemIconBg: {
    width: 48,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contributionDetails: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15A800',
    letterSpacing: 0.5,
  },
  itemMeta: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  itemPoints: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15A800',
  },
});

