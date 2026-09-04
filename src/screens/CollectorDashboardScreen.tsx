import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppData } from '../data/AppDataContext';
import { supabase, createNotification, DonationItem } from '../services/api';
import { theme } from '../theme/theme';

import AsyncStorage from '@react-native-async-storage/async-storage';

export const CollectorDashboardScreen = ({ navigation }: any) => {
  const { donations, authUser, refreshDonations, confirmPickup } = useAppData();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    refreshDonations();
    loadConfirmedCache();
  }, []);

  const loadConfirmedCache = async () => {
    try {
      const stored = await AsyncStorage.getItem('@confirmed_pickup_ids');
      if (stored) {
        const arr = JSON.parse(stored);
        setConfirmedIds(new Set(arr));
      }
    } catch {}
  };

  const allDonations = useMemo(() => {
    return (donations || []).filter(d => d.status !== 'cancelled');
  }, [donations]);

  const pendingCount = allDonations.filter(item => !item.is_picked_up && item.status !== 'completed').length;
  const totalWeight = allDonations
    .filter(item => !item.is_picked_up && item.status !== 'completed')
    .reduce((sum, item) => sum + Number(item.weight_kg || item.estimated_quantity_kg || 10), 0);

  const handleConfirmPickup = (item: DonationItem) => {
    if (item.confirmed_by && authUser?.id && item.confirmed_by !== authUser.id) {
      Alert.alert('Already Confirmed', 'This pickup has already been confirmed by another collector.');
      refreshDonations();
      return;
    }

    Alert.alert(
      'Confirm Pickup Assignment? 🚚',
      'Only confirm if you want to pickup this donation. Please refuse it after confirming if you change your decision.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Pickup',
          onPress: () => executeConfirmPickup(item),
        },
      ]
    );
  };

  const executeConfirmPickup = async (item: DonationItem) => {
    try {
      setConfirmingId(item.id);
      
      const updatedSet = new Set(confirmedIds);
      if (item.id) updatedSet.add(item.id);
      if (item.request_id) updatedSet.add(item.request_id);
      setConfirmedIds(updatedSet);
      await AsyncStorage.setItem('@confirmed_pickup_ids', JSON.stringify(Array.from(updatedSet)));

      if (confirmPickup) {
        await confirmPickup(item.id, item.request_id);
      } else {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id);
        const currentUserId = authUser?.id;
        if (isUuid) {
          await supabase
            .from('donations')
            .update({ status: 'in_transit', confirmed_by: currentUserId, collector_id: currentUserId })
            .eq('id', item.id);
        } else if (item.request_id) {
          await supabase
            .from('donations')
            .update({ status: 'in_transit', confirmed_by: currentUserId, collector_id: currentUserId })
            .eq('request_id', item.request_id);
        }
      }

      // 1. Notify Donor
      if (item.donor_id) {
        try {
          await createNotification(
            item.donor_id,
            'Pickup Confirmed! 🚚',
            `A collector has confirmed your pickup request for ${item.category}. They are currently en route to your address.`,
            'PICKUP CONFIRMED'
          );
        } catch {}
      }

      // 2. Notify Collector
      if (authUser?.id) {
        try {
          await createNotification(
            authUser.id,
            'Pickup Schedule Confirmed',
            `You confirmed pickup for ${item.category} at ${item.address}.`,
            'COLLECTOR'
          );
        } catch {}
      }

      Alert.alert('Pickup Confirmed! 🚚', 'Pickup recorded in Supabase. You can now tap "View Map" to navigate!');
      await refreshDonations();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not update donation status in Supabase.');
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="recycle" size={26} color={theme.colors.surface} />
          <Text style={styles.headerTitle}>Routes</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('CollectorProfile')} activeOpacity={0.7}>
          <Icon name="account-circle-outline" size={26} color={theme.colors.surface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Main Dashboard Card */}
        <View style={styles.dashboardCard}>
          <Text style={styles.dashTitle}>Collection dashboard</Text>
          <Text style={styles.dashSub}>Today's logistics & recovery ops.</Text>
          
          <View style={styles.dashStatsRow}>
            <View style={styles.dashStat}>
              <Text style={styles.dashStatLabel}>ASSIGNED</Text>
              <Text style={styles.dashStatValue}>{pendingCount}</Text>
            </View>
            <View style={styles.dashStat}>
              <Text style={styles.dashStatLabel}>TOTAL WEIGHT</Text>
              <Text style={styles.dashStatValue}>{totalWeight.toFixed(1)} kg</Text>
            </View>
          </View>
        </View>

        {/* Route Map Button */}
        <TouchableOpacity 
          style={styles.routeMapBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PickupMap', { mode: 'admin' })}
        >
          <View style={styles.routeMapLeft}>
            <Icon name="map-outline" size={28} color={theme.colors.surface} />
            <View>
              <Text style={styles.routeMapTitle}>Route map</Text>
              <Text style={styles.routeMapSub}>View optimized pickup route</Text>
            </View>
          </View>
          <Icon name="arrow-right" size={24} color={theme.colors.surface} />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>All Pickups</Text>

        {/* Pickup List */}
        {allDonations.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="check-circle-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.emptyStateText}>No pickup requests available.</Text>
          </View>
        ) : (
          allDonations.map((item, index) => {
            const isPickedUp = Boolean(item.is_picked_up || item.status === 'completed' || item.status === 'collected');
            const isConfirmedByMe = Boolean(
              (authUser?.id && (item.confirmed_by === authUser.id || item.collector_id === authUser.id)) ||
              confirmedIds.has(item.id) ||
              confirmedIds.has(item.request_id || '')
            );
            const isConfirmedByOther = Boolean(
              !isConfirmedByMe &&
              ((item.confirmed_by && authUser?.id && item.confirmed_by !== authUser.id) ||
               (item.collector_id && authUser?.id && item.collector_id !== authUser.id) ||
               item.status === 'in_transit' ||
               item.status === 'assigned')
            );
            const reqId = item.request_id || `#REC-982${index + 1}`;

            return (
              <View key={item.id} style={[styles.pickupCard, isPickedUp && styles.pickupCardDisabled]}>
                
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View style={[styles.avatar, isPickedUp && styles.avatarDisabled]}>
                      <Icon name="account-outline" size={24} color={isPickedUp ? theme.colors.textSecondary : theme.colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.donorName, isPickedUp && styles.textMuted]}>{item.category} Donor</Text>
                      <Text style={styles.donorId}>ID {reqId}</Text>
                    </View>
                  </View>
                  <Text style={[styles.weightText, isPickedUp && styles.weightTextDisabled]}>
                    {item.weight_kg || item.estimated_quantity_kg || 10} kg
                  </Text>
                </View>

                {/* Card Info (Address / Time) */}
                <View style={styles.cardInfoBox}>
                  <TouchableOpacity
                    style={styles.infoItemAddress}
                    onPress={() => navigation.navigate('PickupMap', { mode: 'admin', donationId: item.id })}
                    activeOpacity={0.7}
                  >
                    <Icon name="map-marker-outline" size={18} color={isPickedUp ? theme.colors.textSecondary : theme.colors.primary} style={{ marginTop: 2 }} />
                    <Text style={[styles.infoTextAddress, isPickedUp && styles.textMuted]}>
                      {item.address.replace(/\(Lat:.*?\)/gi, '').trim()}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.infoItemTime}>
                    <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.infoTextTime}>{item.time_slot}</Text>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.cardActions}>
                  {isPickedUp ? (
                    <View style={styles.alreadyPickedUpBtn}>
                      <Icon name="check-circle" size={18} color={theme.colors.success} />
                      <Text style={styles.alreadyPickedUpText}>This is already picked up</Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.assessBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (!isConfirmedByMe) {
                            Alert.alert(
                              'Confirm Pickup First 🚚',
                              'You must tap "Confirm" on this pickup before you can perform quality assessment and pick it up.',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Confirm Now', onPress: () => handleConfirmPickup(item) },
                              ]
                            );
                            return;
                          }
                          navigation.navigate('Quality', { donationId: item.id });
                        }}
                      >
                        <Icon name="decagram-outline" size={18} color={theme.colors.primary} />
                        <Text style={styles.assessBtnText}>Complete</Text>
                      </TouchableOpacity>
                      
                      {isConfirmedByMe ? (
                        <TouchableOpacity
                          style={styles.viewMapBtn}
                          activeOpacity={0.8}
                          onPress={() => navigation.navigate('PickupMap', { mode: 'admin', donationId: item.id })}
                        >
                          <Icon name="map-marker-path" size={18} color={theme.colors.surface} />
                          <Text style={styles.viewMapBtnText}>View Map</Text>
                        </TouchableOpacity>
                      ) : isConfirmedByOther ? (
                        <View style={[styles.confirmBtn, styles.btnDisabled, { backgroundColor: theme.colors.textSecondary }]}>
                          <Icon name="account-lock-outline" size={18} color={theme.colors.surface} />
                          <Text style={styles.confirmBtnText}>Confirmed</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[styles.confirmBtn, confirmingId === item.id && styles.btnDisabled]}
                          activeOpacity={0.8}
                          disabled={confirmingId === item.id}
                          onPress={() => handleConfirmPickup(item)}
                        >
                          {confirmingId === item.id ? (
                            <ActivityIndicator size="small" color={theme.colors.surface} />
                          ) : (
                            <>
                              <Icon name="check-circle-outline" size={18} color={theme.colors.surface} />
                              <Text style={styles.confirmBtnText}>Confirm</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>

              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <View style={styles.tabIconActiveBg}>
            <Icon name="truck" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.tabLabelActive}>Routes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('PickupMap', { mode: 'admin' })}>
          <Icon name="map-outline" size={24} color={theme.colors.textSecondary} />
          <Text style={styles.tabLabel}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('Quality')}>
          <Icon name="shield-check-outline" size={24} color={theme.colors.textSecondary} />
          <Text style={styles.tabLabel}>Quality</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('CollectorProfile')}>
          <Icon name="account-outline" size={24} color={theme.colors.textSecondary} />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
  },
  profileBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  dashboardCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  dashTitle: {
    fontSize: 24,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
    marginBottom: 4,
  },
  dashSub: {
    fontSize: 14,
    color: theme.colors.primaryContainer,
    fontFamily: theme.fonts.bodyMedium,
    marginBottom: 24,
  },
  dashStatsRow: {
    flexDirection: 'row',
    gap: 40,
  },
  dashStat: {},
  dashStatLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primaryContainer,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dashStatValue: {
    fontSize: 28,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
  },
  routeMapBtn: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  routeMapLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  routeMapTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
    marginBottom: 2,
  },
  routeMapSub: {
    fontSize: 13,
    color: theme.colors.primaryContainer,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 16,
  },
  pickupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorName: {
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 2,
  },
  donorId: {
    fontSize: 12,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.textSecondary,
  },
  weightText: {
    fontSize: 20,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
  },
  cardInfoBox: {
    gap: 8,
    marginBottom: 20,
  },
  infoItemAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingRight: 12,
  },
  infoItemTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTextAddress: {
    fontSize: 13,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.textSecondary,
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 19,
  },
  infoTextTime: {
    fontSize: 13,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  assessBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 24,
    gap: 6,
  },
  assessBtnText: {
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    gap: 6,
  },
  viewMapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: theme.colors.secondary,
    borderRadius: 24,
    gap: 6,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
  },
  viewMapBtnText: {
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
  pickupCardDisabled: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
  },
  avatarDisabled: {
    backgroundColor: theme.colors.surfaceContainer,
  },
  textMuted: {
    color: theme.colors.textSecondary,
  },
  weightTextDisabled: {
    color: theme.colors.textSecondary,
  },
  alreadyPickedUpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1,
    borderColor: theme.colors.primaryContainer,
    borderRadius: 24,
    gap: 8,
  },
  alreadyPickedUpText: {
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.success,
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabIconActiveBg: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tabLabelActive: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.textSecondary,
  },
});
