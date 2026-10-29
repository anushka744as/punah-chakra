import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppData } from '../data/AppDataContext';
import { getStatusLabel, cancelDonationRequest, fetchUnreadNotificationCount, DonationItem } from '../services/api';
import { stripAddressMeta } from '../utils/address';
import { theme } from '../theme/theme';

const categoryIcon = (category: string) => {
  const c = (category || '').toLowerCase();
  if (c.includes('textile') || c.includes('clothes')) return 'tshirt-crew-outline';
  if (c.includes('shoe')) return 'shoe-sneaker';
  if (c.includes('blanket') || c.includes('bedsheet')) return 'bed-king-outline';
  if (c.includes('bag')) return 'bag-personal-outline';
  return 'package-variant-closed';
};

const CATEGORIES: { label: string; icon: string }[] = [
  { label: 'Clothes', icon: 'tshirt-crew-outline' },
  { label: 'Shoes', icon: 'shoe-sneaker' },
  { label: 'Bags', icon: 'bag-personal-outline' },
  { label: 'Bedsheets', icon: 'bed-king-outline' },
  { label: 'Blankets', icon: 'sofa-outline' },
];

export const HomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { donations, refreshDonations, authUser } = useAppData();
  const [unread, setUnread] = useState(0);

  // Live unread count for the bell: refreshed whenever Home is focused (so it drops to 0 after the
  // Alerts page marks everything read) and every 10s while Home stays open.
  useFocusEffect(
    useCallback(() => {
      const uid = authUser?.id;
      if (!uid) { setUnread(0); return; }
      const tick = () => fetchUnreadNotificationCount(uid).then(setUnread).catch(() => {});
      tick();
      const timer = setInterval(tick, 10000);
      return () => clearInterval(timer);
    }, [authUser?.id])
  );

  useFocusEffect(
    useCallback(() => {
      refreshDonations();
    }, [refreshDonations])
  );

  const latestPickup = donations.find(
    (d) => d.status === 'pending' || d.status === 'scheduled' || d.status === 'assigned'
  );

  const handleEdit = (donation: DonationItem) => {
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
              await refreshDonations();
            } catch (e: any) {
              Alert.alert('Unable to Cancel', e?.message || 'This pickup could no longer be cancelled.');
            }
          },
        },
      ]
    );
  };

  return (
    <ImageBackground
      source={require('../assets/home_bg.jpg')}
      style={styles.container}
      imageStyle={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.bgOverlay} />
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../assets/logo_transparent.png')}
            style={styles.headerLogoImg}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/logo_wordmark_transparent.png')}
            style={styles.headerWordmarkImg}
            resizeMode="contain"
          />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.userAvatarBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
            accessibilityLabel="Notifications"
          >
            <View style={styles.userAvatarCircle}>
              <Icon name="bell-outline" size={24} color={theme.colors.textSecondary} />
              {unread > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unread > 9 ? '9+' : unread}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.userAvatarBtn}
            onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }}
            activeOpacity={0.7}
          >
            <View style={styles.userAvatarCircle}>
              <Icon name="account-outline" size={24} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>Give Your Items{'\n'}a Second Chance</Text>
            <Text style={styles.heroSubtitle}>Have clean, usable items{'\n'}you no longer need?</Text>
            <TouchableOpacity
              style={styles.giveItemsBtn}
              onPress={() => navigation.navigate('Donate')}
              activeOpacity={0.85}
            >
              <Text style={styles.giveItemsBtnText}>GIVE ITEMS</Text>
              <Icon name="arrow-right" size={16} color={theme.colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>

        {/* We currently collect */}
        <View style={styles.collectSection}>
          <Text style={styles.collectTitle}>We currently collect:</Text>
          <View style={styles.collectRow}>
            {CATEGORIES.map((cat) => (
              <View key={cat.label} style={styles.collectItem}>
                <View style={styles.collectIconBg}>
                  <Icon name={cat.icon} size={24} color={theme.colors.primaryDark} />
                </View>
                <Text style={styles.collectLabel}>{cat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Schedule a Pickup */}
        <View style={styles.scheduleCard}>
          <View style={styles.truckIconBg}>
            <Icon name="truck-delivery-outline" size={22} color={theme.colors.primaryDark} />
          </View>
          <View style={styles.scheduleTextCol}>
            <Text style={styles.scheduleTitle}>Schedule a Pickup</Text>
            <Text style={styles.scheduleSubtitle}>We'll collect your items from your doorstep.</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.schedulePickupBtn}
          onPress={() => navigation.navigate('Donate')}
          activeOpacity={0.85}
        >
          <Text style={styles.schedulePickupBtnText}>SCHEDULE PICKUP</Text>
          <Icon name="arrow-right" size={16} color={theme.colors.textInverse} />
        </TouchableOpacity>

        {donations.length === 0 ? (
          <>
            {/* Your Latest Pickup (empty state covers both sections) */}
            <Text style={styles.sectionTitle}>Your Latest Pickup</Text>
            <View style={styles.emptyBox}>
              <Icon name="package-variant-closed" size={28} color={theme.colors.primary} />
              <Text style={styles.emptyTitle}>Nothing scheduled yet</Text>
              <Text style={styles.emptyText}>Schedule your first pickup and it will show up here.</Text>
            </View>
          </>
        ) : (
          <>
            {/* Your Latest Pickup */}
            <Text style={styles.sectionTitle}>Your Latest Pickup</Text>
            {latestPickup ? (
              <View style={styles.latestPickupCard}>
                <View style={styles.calendarIconBg}>
                  <Icon name="calendar-check-outline" size={20} color={theme.colors.primaryDark} />
                </View>
                <View style={styles.latestPickupTextCol}>
                  <Text style={styles.latestPickupStatus}>{getStatusLabel(latestPickup.status)}</Text>
                  <Text style={styles.latestPickupMeta}>
                    {latestPickup.pickup_day} · {latestPickup.time_slot}
                  </Text>
                  <Text style={styles.latestPickupAddress}>{stripAddressMeta(latestPickup.address)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() => navigation.navigate('Notifications')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewDetailsBtnText}>VIEW DETAILS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Icon name="package-variant-closed" size={28} color={theme.colors.primary} />
                <Text style={styles.emptyTitle}>Nothing scheduled yet</Text>
                <Text style={styles.emptyText}>Schedule your first pickup and it will show up here.</Text>
              </View>
            )}

            {/* Recent contributions */}
            <Text style={[styles.sectionTitle, styles.contributionsTitle]}>Recent contributions</Text>
            {donations.map((item) => (
            <View key={item.id} style={styles.contributionCard}>
              <View style={styles.itemIconBg}>
                <Icon name={categoryIcon(item.category)} size={24} color={theme.colors.primaryDark} />
              </View>
              <View style={styles.contributionDetails}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.itemTitle}>{item.category || 'Donation'}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
                  </View>
                </View>
                <Text style={styles.itemMeta}>
                  {item.pickup_day}{item.weight_kg ? ` · ${item.weight_kg} kg` : ''}
                </Text>
                {item.status === 'pending' && (
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleEdit(item)}
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
            ))}
          </>
        )}

        {/* Footer quote */}
        <View style={styles.footerDivider}>
          <View style={styles.footerLine} />
          <Icon name="leaf" size={16} color={theme.colors.primaryDark} style={styles.footerLeaf} />
          <View style={styles.footerLine} />
        </View>
        <Text style={styles.footerQuote}>Every Item Deserves Another Chance.</Text>
      </ScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  bgImage: {
    opacity: 0.5,
  },
  bgOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(239, 232, 216, 0.8)',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  headerLogoImg: {
    width: 64,
    height: 64,
  },
  headerWordmarkImg: {
    width: 170,
    height: 48,
    marginLeft: -20,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatarBtn: {
    alignItems: 'center',
  },
  userAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.radius.xl,
    padding: 20,
    marginBottom: 20,
  },
  heroTextCol: {
    flex: 1,
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 22,
    color: theme.colors.text,
    lineHeight: 28,
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  giveItemsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: 10,
    paddingHorizontal: 18,
    gap: 8,
  },
  giveItemsBtnText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.textInverse,
    letterSpacing: 0.3,
  },
  collectSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 16,
  },
  collectTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 14,
  },
  collectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  collectItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  collectIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10.5,
    color: theme.colors.text,
    textAlign: 'center',
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 16,
    gap: 12,
  },
  truckIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleTextCol: {
    flex: 1,
  },
  scheduleTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 2,
  },
  scheduleSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  schedulePickupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
    height: 48,
    gap: 8,
    marginBottom: 20,
  },
  schedulePickupBtnText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    color: theme.colors.textInverse,
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 17,
    color: theme.colors.text,
    marginBottom: 12,
  },
  latestPickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: 14,
    gap: 12,
  },
  calendarIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestPickupTextCol: {
    flex: 1,
  },
  latestPickupStatus: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    color: theme.colors.primaryDark,
    marginBottom: 2,
  },
  latestPickupMeta: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: 2,
  },
  latestPickupAddress: {
    fontFamily: theme.fonts.body,
    fontSize: 11.5,
    color: theme.colors.textSecondary,
  },
  viewDetailsBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  viewDetailsBtnText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10.5,
    color: theme.colors.primaryDark,
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
  contributionsTitle: {
    marginTop: 20,
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
  footerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 10,
    gap: 10,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  footerLeaf: {
    transform: [{ rotate: '90deg' }],
  },
  footerQuote: {
    fontFamily: theme.fonts.headingRegular,
    fontStyle: 'italic',
    fontSize: 15,
    color: theme.colors.primaryDark,
    textAlign: 'center',
  },
});
