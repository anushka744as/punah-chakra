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
import { theme } from '../theme/theme';
import { ProgressRing } from '../components/ProgressRing';

const TIER_SIZE = 1000;

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
            status: (d.status || 'pending').toUpperCase(),
            icon: (d.category || '').toLowerCase().includes('textile') || (d.category || '').toLowerCase().includes('clothes')
              ? 'tshirt-crew-outline'
              : (d.category || '').toLowerCase().includes('shoe')
              ? 'shoe-sneaker'
              : (d.category || '').toLowerCase().includes('blanket') || (d.category || '').toLowerCase().includes('bedsheet')
              ? 'bed-king-outline'
              : (d.category || '').toLowerCase().includes('bag')
              ? 'bag-personal-outline'
              : 'package-variant-closed',
          })));

          const active = donations.find((d) => d.status === 'pending' || d.status === 'scheduled' || d.status === 'assigned');
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

  const pointsIntoTier = points % TIER_SIZE;
  const pointsToGo = TIER_SIZE - pointsIntoTier;

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
          <Text style={styles.logoText}>PunahChakra</Text>
        </View>
        <TouchableOpacity style={styles.userAvatarBtn} onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.textInverse} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Total Impact Points Card */}
        <View style={styles.impactCard}>
          <ProgressRing
            progress={pointsIntoTier / TIER_SIZE}
            centerValue={points.toLocaleString()}
            centerLabel="POINTS"
          />
          <View style={styles.impactCopy}>
            <Text style={styles.impactLabel}>EARTH WARRIOR TIER</Text>
            <Text style={styles.impactSubtext}>
              <Text style={styles.impactSubtextEmphasis}>{pointsToGo} pts</Text> to go — keep donating to level up.
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon name="pine-tree" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.statValue}>{co2Offset}</Text>
            <Text style={styles.statLabel}>CO₂ OFFSET</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Icon name="star-circle-outline" size={16} color={theme.colors.secondary} />
            </View>
            <Text style={styles.statValue}>{String(badgesCount).padStart(2, '0')}</Text>
            <Text style={styles.statLabel}>BADGES</Text>
          </View>
        </View>

        {/* Pickup Scheduled Banner */}
        <View style={styles.scheduledBanner}>
          <View style={styles.truckIconBg}>
            <Icon name="truck-delivery" size={20} color={theme.colors.textInverse} />
          </View>
          <View style={styles.scheduledTextCol}>
            <Text style={styles.scheduledLabel}>PICKUP STATUS</Text>
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
          <Icon name="plus" size={18} color={theme.colors.secondary} />
          <Text style={styles.scheduleBtnText}>Schedule new donation</Text>
        </TouchableOpacity>

        {/* Recent Contributions Section */}
        <Text style={styles.sectionTitle}>Recent contributions</Text>

        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : contributions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Icon name="package-variant-closed" size={28} color={theme.colors.primary} />
            <Text style={styles.emptyTitle}>Nothing here yet</Text>
            <Text style={styles.emptyText}>Schedule your first pickup and it will show up here.</Text>
          </View>
        ) : (
          contributions.map((item) => (
            <View key={item.id} style={styles.contributionCard}>
              <View style={styles.itemIconBg}>
                <Icon name={item.icon || 'package-variant-closed'} size={24} color={theme.colors.primary} />
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
  logoText: {
    fontFamily: theme.fonts.heading,
    fontSize: 20,
    color: theme.colors.textInverse,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: 20,
    marginBottom: 16,
  },
  impactCopy: {
    flex: 1,
  },
  impactLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  impactSubtext: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.textInverse,
  },
  impactSubtextEmphasis: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.secondary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statIconBg: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  statValue: {
    fontFamily: theme.fonts.heading,
    fontSize: 19,
    color: theme.colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10,
    color: theme.colors.textSecondary,
    letterSpacing: 0.4,
  },
  scheduledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondaryContainer,
    borderWidth: 1,
    borderColor: '#BFDCE6',
    borderRadius: theme.radius.lg,
    padding: 12,
    marginBottom: 14,
  },
  truckIconBg: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  scheduledTextCol: {
    flex: 1,
  },
  scheduledLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 9.5,
    color: theme.colors.clay,
    letterSpacing: 0.4,
  },
  scheduledTime: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12.5,
    color: theme.colors.text,
    marginTop: 2,
  },
  viewBtn: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  viewBtnText: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textInverse,
    fontSize: 12,
  },
  scheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.full,
    height: 52,
    gap: 8,
    marginBottom: 24,
  },
  scheduleBtnText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.textInverse,
  },
  sectionTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 14,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 18,
    gap: 6,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.text,
    marginTop: 6,
  },
  emptyText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  contributionCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  itemIconBg: {
    width: 48,
    height: 64,
    borderRadius: 14,
    backgroundColor: theme.colors.primaryContainer,
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
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  statusBadge: {
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  statusText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 9,
    color: theme.colors.clay,
    letterSpacing: 0.4,
  },
  itemMeta: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  itemPoints: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.secondary,
  },
});

