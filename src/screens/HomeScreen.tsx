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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase, fetchUserDonations, getStatusLabel, cancelDonationRequest, DonationItem } from '../services/api';
import { theme } from '../theme/theme';

export const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [scheduledPickup, setScheduledPickup] = useState<string | null>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [donationsById, setDonationsById] = useState<Record<string, DonationItem>>({});

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
        const donations = await fetchUserDonations(user.id);
        if (donations && donations.length > 0) {
          setDonationsById(Object.fromEntries(donations.map((d) => [d.id, d])));
          setContributions(donations.map((d) => ({
            id: d.id,
            title: d.category || 'Donation',
            date: `${d.pickup_day}${d.weight_kg ? ' · ' + d.weight_kg + ' kg' : ''}`,
            status: getStatusLabel(d.status),
            rawStatus: d.status,
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
          setDonationsById({});
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

  const handleEdit = (id: string) => {
    const donation = donationsById[id];
    if (!donation) return;
    navigation.navigate('Donate', { editDonation: donation });
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Cancel Pickup',
      'Are you sure you want to cancel this donation pickup?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelDonationRequest(id);
              await loadLiveData();
            } catch (e: any) {
              Alert.alert('Unable to Cancel', e?.message || 'This pickup could no longer be cancelled.');
            }
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
            source={require('../assets/image.png')}
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
                {item.rawStatus === 'pending' && (
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleEdit(item.id)}
                      activeOpacity={0.7}
                    >
                      <Icon name="pencil-outline" size={14} color={theme.colors.text} />
                      <Text style={styles.cardActionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleDelete(item.id)}
                      activeOpacity={0.7}
                    >
                      <Icon name="trash-can-outline" size={14} color={theme.colors.error} />
                      <Text style={[styles.cardActionText, { color: theme.colors.error }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemTitle: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  statusBadge: {
    flexShrink: 0,
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
  cardActionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardActionText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.text,
  },
});

