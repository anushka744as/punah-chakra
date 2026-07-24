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

const PERMANENT_DONATIONS: DonationItem[] = [
  {
    id: 'rec-9821',
    request_id: '#REC-9821',
    category: 'E-Waste',
    weight_kg: 3,
    estimated_quantity_kg: 3,
    pickup_day: 'Today',
    time_slot: '4:32 PM',
    instructions: 'Doorstep pickup',
    address: 'House #194, Sector 15A, Noida, Uttar Pradesh 201301',
    status: 'scheduled',
    points_awarded: 30,
    is_picked_up: false,
  },
  {
    id: 'rec-9822',
    request_id: '#REC-9822',
    category: 'E-Waste',
    weight_kg: 5.5,
    estimated_quantity_kg: 5.5,
    pickup_day: 'Today',
    time_slot: '10:00 AM',
    instructions: 'Call on arrival',
    address: 'House #134, Sector 15A, Noida, Uttar Pradesh 201301',
    status: 'scheduled',
    points_awarded: 55,
    is_picked_up: false,
  },
  {
    id: 'rec-9823',
    request_id: '#REC-9823',
    category: 'Textiles',
    weight_kg: 12.4,
    estimated_quantity_kg: 12.4,
    pickup_day: 'Today',
    time_slot: '11:30 AM',
    instructions: 'Ring doorbell',
    address: 'Flat 402, Sector 44, Noida, Uttar Pradesh 201301',
    status: 'scheduled',
    points_awarded: 120,
    is_picked_up: false,
  },
  {
    id: 'rec-9824',
    request_id: '#REC-9824',
    category: 'Plastics',
    weight_kg: 8.0,
    estimated_quantity_kg: 8.0,
    pickup_day: 'Today',
    time_slot: '2:15 PM',
    instructions: 'Leave at security desk',
    address: 'Tower B-902, Jaypee Greens, Noida, Uttar Pradesh 201304',
    status: 'scheduled',
    points_awarded: 80,
    is_picked_up: false,
  },
  {
    id: 'rec-9825',
    request_id: '#REC-9825',
    category: 'Paper & Cardboard',
    weight_kg: 15.2,
    estimated_quantity_kg: 15.2,
    pickup_day: 'Today',
    time_slot: '5:00 PM',
    instructions: 'Gate 2 entrance',
    address: 'Plot 55, Sector 62, Noida, Uttar Pradesh 201309',
    status: 'scheduled',
    points_awarded: 150,
    is_picked_up: false,
  },
  {
    id: 'rec-9826',
    request_id: '#REC-9826',
    category: 'Glass & Metals',
    weight_kg: 6.8,
    estimated_quantity_kg: 6.8,
    pickup_day: 'Today',
    time_slot: '6:30 PM',
    instructions: 'Call donor',
    address: 'Villa #12, Sector 128, Noida, Uttar Pradesh 201304',
    status: 'scheduled',
    points_awarded: 70,
    is_picked_up: false,
  },
];

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
    if (!donations || donations.length === 0) {
      return PERMANENT_DONATIONS;
    }
    const existingIds = new Set(donations.map(d => d.id || d.request_id));
    const extraDefaults = PERMANENT_DONATIONS.filter(p => !existingIds.has(p.id) && !existingIds.has(p.request_id));
    return [...donations, ...extraDefaults];
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
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="recycle" size={26} color="#FFFFFF" />
          <Text style={styles.headerTitle}>Routes</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('CollectorProfile')} activeOpacity={0.7}>
          <Icon name="account-circle-outline" size={26} color="#FFFFFF" />
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
          onPress={() => navigation.navigate('PickupMap', { mode: 'collector' })}
        >
          <View style={styles.routeMapLeft}>
            <Icon name="map-outline" size={28} color="#FFFFFF" />
            <View>
              <Text style={styles.routeMapTitle}>Route map</Text>
              <Text style={styles.routeMapSub}>View optimized pickup route</Text>
            </View>
          </View>
          <Icon name="arrow-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>All Pickups</Text>

        {/* Pickup List */}
        {allDonations.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="check-circle-outline" size={48} color="#15A800" />
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
                      <Icon name="account-outline" size={24} color={isPickedUp ? "#94A3B8" : "#15A800"} />
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
                    onPress={() => navigation.navigate('PickupMap', { mode: 'collector', donationId: item.id })}
                    activeOpacity={0.7}
                  >
                    <Icon name="map-marker-outline" size={18} color={isPickedUp ? "#94A3B8" : "#15A800"} style={{ marginTop: 2 }} />
                    <Text style={[styles.infoTextAddress, isPickedUp && styles.textMuted]}>
                      {item.address.replace(/\(Lat:.*?\)/gi, '').trim()}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.infoItemTime}>
                    <Icon name="clock-outline" size={16} color="#475569" />
                    <Text style={styles.infoTextTime}>{item.time_slot}</Text>
                  </View>
                </View>

                {/* Card Actions */}
                <View style={styles.cardActions}>
                  {isPickedUp ? (
                    <View style={styles.alreadyPickedUpBtn}>
                      <Icon name="check-circle" size={18} color="#059669" />
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
                        <Icon name="decagram-outline" size={18} color="#15A800" />
                        <Text style={styles.assessBtnText}>Assess</Text>
                      </TouchableOpacity>
                      
                      {isConfirmedByMe ? (
                        <TouchableOpacity
                          style={styles.viewMapBtn}
                          activeOpacity={0.8}
                          onPress={() => navigation.navigate('PickupMap', { mode: 'collector', donationId: item.id })}
                        >
                          <Icon name="map-marker-path" size={18} color="#FFFFFF" />
                          <Text style={styles.viewMapBtnText}>View Map</Text>
                        </TouchableOpacity>
                      ) : isConfirmedByOther ? (
                        <View style={[styles.confirmBtn, styles.btnDisabled, { backgroundColor: '#94A3B8' }]}>
                          <Icon name="account-lock-outline" size={18} color="#FFFFFF" />
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
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Icon name="check-circle-outline" size={18} color="#FFFFFF" />
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
            <Icon name="truck" size={24} color="#15A800" />
          </View>
          <Text style={styles.tabLabelActive}>Routes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('PickupMap', { mode: 'collector' })}>
          <Icon name="map-outline" size={24} color="#475569" />
          <Text style={styles.tabLabel}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('Quality')}>
          <Icon name="shield-check-outline" size={24} color="#475569" />
          <Text style={styles.tabLabel}>Quality</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('CollectorProfile')}>
          <Icon name="account-outline" size={24} color="#475569" />
          <Text style={styles.tabLabel}>Profile</Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    padding: 20,
    paddingBottom: 40,
  },
  dashboardCard: {
    backgroundColor: '#15A800',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  dashTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dashSub: {
    fontSize: 14,
    color: '#DCFCE7',
    fontWeight: '500',
    marginBottom: 24,
  },
  dashStatsRow: {
    flexDirection: 'row',
    gap: 40,
  },
  dashStat: {},
  dashStatLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DCFCE7',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dashStatValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  routeMapBtn: {
    backgroundColor: '#128800',
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
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  routeMapSub: {
    fontSize: 13,
    color: '#DCFCE7',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  pickupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  donorId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  weightText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15A800',
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
    fontWeight: '500',
    color: '#475569',
    flex: 1,
    flexWrap: 'wrap',
    lineHeight: 19,
  },
  infoTextTime: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
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
    borderColor: '#15A800',
    borderRadius: 24,
    gap: 6,
  },
  assessBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15A800',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#15A800',
    borderRadius: 24,
    gap: 6,
  },
  viewMapBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#0EA5E9',
    borderRadius: 24,
    gap: 6,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  viewMapBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 12,
  },
  pickupCardDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  avatarDisabled: {
    backgroundColor: '#F1F5F9',
  },
  textMuted: {
    color: '#64748B',
  },
  weightTextDisabled: {
    color: '#64748B',
  },
  alreadyPickedUpBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 24,
    gap: 8,
  },
  alreadyPickedUpText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
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
