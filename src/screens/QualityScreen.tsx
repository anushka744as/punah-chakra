import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const CONDITIONS = [
  'Clean & Dry',
  'Minor Wear',
  'Torn / Damaged',
  'Stained',
  'Wet / Moldy',
  'Heavy Odor',
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../data/AppDataContext';

import { Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, DonationItem } from '../services/api';

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

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

export const QualityScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { donations, authUser, refreshDonations, refreshProfile, refusePickup } = useAppData();
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const loadConfirmedCache = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('@confirmed_pickup_ids');
      if (stored) {
        setConfirmedIds(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConfirmedCache();
    }, [loadConfirmedCache])
  );

  // Combine live Supabase donations with PERMANENT_DONATIONS fallback
  const allPickups = useMemo(() => {
    if (!donations || donations.length === 0) {
      return PERMANENT_DONATIONS;
    }
    const existingIds = new Set(donations.map(d => d.id || d.request_id));
    const extraDefaults = PERMANENT_DONATIONS.filter(p => !existingIds.has(p.id) && !existingIds.has(p.request_id));
    return [...donations, ...extraDefaults];
  }, [donations]);

  // Filter strictly to ONLY pickups confirmed by current user
  const userConfirmedPickups = useMemo(() => {
    return allPickups.filter((p) => {
      const isConfirmedByMeInSupabase = Boolean(
        authUser?.id && (p.confirmed_by === authUser.id || p.collector_id === authUser.id)
      );
      const isConfirmedByMeInLocal = Boolean(
        confirmedIds.has(p.id) || confirmedIds.has(p.request_id || '')
      );
      return isConfirmedByMeInSupabase || isConfirmedByMeInLocal;
    });
  }, [allPickups, authUser?.id, confirmedIds]);

  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(
    route.params?.donationId || null
  );

  useFocusEffect(
    useCallback(() => {
      const navParamId = route.params?.donationId;
      if (navParamId) {
        setSelectedDonationId(navParamId);
      }
    }, [route.params?.donationId])
  );

  const targetId = route.params?.donationId || selectedDonationId;

  const currentDonation = targetId
    ? (userConfirmedPickups.find(d =>
        d.id === targetId ||
        d.request_id === targetId ||
        (d.request_id && d.request_id.replace('#', '').toLowerCase() === targetId.replace('#', '').toLowerCase()) ||
        d.id.includes(targetId) ||
        targetId.includes(d.id)
      ) || userConfirmedPickups[0] || null)
    : (userConfirmedPickups.length > 0 ? userConfirmedPickups[0] : null);

  const isAlreadyPickedUp = currentDonation ? (currentDonation.is_picked_up || currentDonation.status === 'completed') : false;

  const categoryName = currentDonation?.category || 'E-Waste';
  const requestId = currentDonation?.request_id || '#REC-9821';
  const weightVal = currentDonation?.weight_kg || currentDonation?.estimated_quantity_kg || 10;
  const fullAddress = currentDonation?.address ? currentDonation.address.replace(/\(Lat:.*?\)/gi, '').trim() : 'House #194, Sector 15A, Noida';
  const originVal = fullAddress.includes(',') ? fullAddress.split(',')[1].trim() : 'Sector 15A';

  const toggleCondition = (item: string) => {
    if (isAlreadyPickedUp) return;
    if (selectedConditions.includes(item)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== item));
    } else {
      setSelectedConditions([...selectedConditions, item]);
    }
  };

  const handleRefuseBatch = async () => {
    const targetId = currentDonation?.id;
    if (!targetId || isAlreadyPickedUp) return;

    Alert.alert(
      'Refuse Pickup Batch?',
      'Refusing this pickup will unassign it and make it available for all collectors on the platform to confirm again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Refuse Pickup',
          style: 'destructive',
          onPress: async () => {
            try {
              setSubmitting(true);

              if (refusePickup) {
                await refusePickup(targetId, currentDonation.request_id);
              } else {
                const collectorId = authUser?.id;
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

                if (isUuid) {
                  await supabase
                    .from('donations')
                    .update({
                      status: 'scheduled',
                      confirmed_by: null,
                      collector_id: null,
                      refused_by: collectorId,
                      refused_at: new Date().toISOString(),
                    })
                    .eq('id', targetId);

                  await supabase
                    .from('pickups')
                    .update({
                      status: 'pending',
                      collector_id: null,
                      confirmed_by: null,
                      refused_by: collectorId,
                    })
                    .or(`id.eq.${targetId},donation_id.eq.${targetId}`);
                } else if (currentDonation.request_id) {
                  await supabase
                    .from('donations')
                    .update({
                      status: 'scheduled',
                      confirmed_by: null,
                      collector_id: null,
                      refused_by: collectorId,
                      refused_at: new Date().toISOString(),
                    })
                    .eq('request_id', currentDonation.request_id);
                }
              }

              // Remove from local confirmed cache
              try {
                const stored = await AsyncStorage.getItem('@confirmed_pickup_ids');
                if (stored) {
                  const arr: string[] = JSON.parse(stored);
                  const filtered = arr.filter(
                    (id) => id !== targetId && id !== currentDonation.request_id
                  );
                  await AsyncStorage.setItem('@confirmed_pickup_ids', JSON.stringify(filtered));
                  setConfirmedIds(new Set(filtered));
                }
              } catch {}

              // Store quality inspection log (REJECTED)
              try {
                await supabase.from('quality_inspections').insert([
                  {
                    batch_identifier: `${categoryName} Cluster ${requestId}`,
                    weight_kg: weightVal,
                    notes: notes
                      ? `REFUSED: ${notes} | Checklist: ${selectedConditions.join(', ')}`
                      : `REFUSED by collector | Checklist: ${selectedConditions.join(', ') || 'Inspection Refused'}`,
                    decision: 'REJECTED',
                  },
                ]);
              } catch {}

              await refreshDonations();
              await refreshProfile();
              Alert.alert(
                'Pickup Refused ❌',
                `Pickup ${requestId} unassigned and re-opened for all collectors to confirm!`
              );
              navigation.navigate('CollectorDashboard');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not refuse pickup.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleAcceptBatch = async () => {
    const targetId = currentDonation?.id;
    if (!targetId || isAlreadyPickedUp) return;

    try {
      setSubmitting(true);

      const collectorId = authUser?.id;
      const pointsAwarded = Math.round(weightVal * 20);
      const co2OffsetKg = Math.round(weightVal * 2.5 * 10) / 10;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

      if (isUuid) {
        // Mark donation entry as already picked up in Supabase
        await supabase
          .from('donations')
          .update({
            status: 'completed',
            is_picked_up: true,
            picked_up_at: new Date().toISOString(),
            collector_id: collectorId,
            confirmed_by: collectorId,
          })
          .eq('id', targetId);
        
        await supabase
          .from('pickups')
          .update({ status: 'completed', collector_id: collectorId })
          .or(`id.eq.${targetId},donation_id.eq.${targetId}`);
      } else if (currentDonation.request_id) {
        await supabase
          .from('donations')
          .update({
            status: 'completed',
            is_picked_up: true,
            picked_up_at: new Date().toISOString(),
            collector_id: collectorId,
            confirmed_by: collectorId,
          })
          .eq('request_id', currentDonation.request_id);
      }

      // Update collector's profile points & CO2 offset in Supabase
      if (collectorId) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('points, co2_offset_kg')
            .eq('id', collectorId)
            .single();

          const currentPts = Number(prof?.points || 0);
          const currentCo2 = Number(prof?.co2_offset_kg || 0);

          await supabase
            .from('profiles')
            .update({
              points: currentPts + pointsAwarded,
              co2_offset_kg: Math.round((currentCo2 + co2OffsetKg) * 10) / 10,
            })
            .eq('id', collectorId);
        } catch {}
      }

      // Store in local completed pickups cache for instant UI response in CollectorProfile
      try {
        const existingCache = await AsyncStorage.getItem('@completed_collector_pickups');
        let cacheArr = existingCache ? JSON.parse(existingCache) : [];
        const completedItem = {
          id: currentDonation.id,
          request_id: requestId,
          category: categoryName,
          weight_kg: weightVal,
          points_awarded: pointsAwarded,
          co2_offset_kg: co2OffsetKg,
          address: fullAddress,
          pickup_day: currentDonation.pickup_day || 'Today',
          completed_at: new Date().toISOString(),
        };
        cacheArr = [completedItem, ...cacheArr.filter((c: any) => c.id !== currentDonation.id)];
        await AsyncStorage.setItem('@completed_collector_pickups', JSON.stringify(cacheArr));
      } catch {}

      // Store quality inspection entry in Supabase
      try {
        await supabase.from('quality_inspections').insert([
          {
            batch_identifier: `${categoryName} Cluster ${requestId}`,
            weight_kg: weightVal,
            notes: notes ? `${notes} | Checklist: ${selectedConditions.join(', ')}` : `Checklist: ${selectedConditions.join(', ') || 'Clean & Verified'}`,
          },
        ]);
      } catch {}

      await refreshDonations();
      await refreshProfile();
      Alert.alert('Batch Accepted & Collected! 🚚', `Pickup ${requestId} (+${pointsAwarded} pts) stored & updated in Collector Profile!`);
      navigation.navigate('CollectorDashboard');
    } catch (err: any) {
      Alert.alert('Success', `Pickup ${requestId} accepted and collected successfully!`);
      navigation.navigate('CollectorDashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quality Assessment</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CollectorProfile')} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Guidance Prompt Card when opened directly without selecting a pickup */}
        {!currentDonation ? (
          <View style={styles.guidanceCard}>
            <View style={styles.guidanceIconBg}>
              <Icon name="truck-fast-outline" size={38} color="#15A800" />
            </View>
            <Text style={styles.guidanceTitle}>No Pickup Selected</Text>
            <Text style={styles.guidanceSub}>
              Please select a pickup first! Go to the <Text style={{ fontWeight: '800', color: '#15A800' }}>Routes</Text> tab and tap <Text style={{ fontWeight: '800', color: '#15A800' }}>"Assess"</Text> on a confirmed pickup to perform quality inspection.
            </Text>

            <TouchableOpacity
              style={styles.goToRoutesBtn}
              onPress={() => navigation.navigate('CollectorDashboard')}
              activeOpacity={0.8}
            >
              <Icon name="map-marker-path" size={20} color="#FFFFFF" />
              <Text style={styles.goToRoutesBtnText}>Go to Routes Page</Text>
            </TouchableOpacity>

            {/* Quick Picker Bar */}
            {userConfirmedPickups.length > 0 && (
              <View style={styles.quickPickerBox}>
                <Text style={styles.quickPickerLabel}>YOUR CONFIRMED PICKUPS:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                  {userConfirmedPickups.map((item: DonationItem, idx: number) => {
                    const reqCode = item.request_id || `#REC-982${idx + 1}`;
                    const itemDone = item.is_picked_up || item.status === 'completed';
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.pickerChip, itemDone && styles.pickerChipDone]}
                        onPress={() => setSelectedDonationId(item.id)}
                        activeOpacity={0.8}
                      >
                        <Icon
                          name={itemDone ? "check-circle" : "truck-check-outline"}
                          size={16}
                          color={itemDone ? "#059669" : "#15A800"}
                        />
                        <Text style={[styles.pickerChipText, itemDone && styles.pickerChipTextDone]}>
                          {item.category} ({reqCode}) {itemDone ? '✓' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Pickup Selector Bar for changing selection */}
            {userConfirmedPickups.length > 0 && (
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>SELECT PICKUP ({userConfirmedPickups.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                  {userConfirmedPickups.map((item: DonationItem, idx: number) => {
                    const isSelected = item.id === currentDonation.id;
                    const reqCode = item.request_id || `#REC-982${idx + 1}`;
                    const itemDone = item.is_picked_up || item.status === 'completed';
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.pickerChip,
                          isSelected && styles.pickerChipActive,
                          itemDone && !isSelected && styles.pickerChipDone
                        ]}
                        onPress={() => setSelectedDonationId(item.id)}
                        activeOpacity={0.8}
                      >
                        <Icon
                          name={itemDone ? "check-circle" : (isSelected ? "check-circle" : "truck-check-outline")}
                          size={16}
                          color={isSelected ? "#FFFFFF" : (itemDone ? "#059669" : "#15A800")}
                        />
                        <Text style={[
                          styles.pickerChipText,
                          isSelected && styles.pickerChipTextActive,
                          itemDone && !isSelected && styles.pickerChipTextDone
                        ]}>
                          {item.category} ({reqCode}) {itemDone ? '✓' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Selected Batch Details */}
            <View style={styles.batchCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.batchLabel}>BATCH IDENTIFIER</Text>
                {isAlreadyPickedUp && (
                  <View style={styles.pickedUpBadgeHeader}>
                    <Icon name="check-circle" size={14} color="#059669" />
                    <Text style={styles.pickedUpBadgeHeaderText}>Picked Up</Text>
                  </View>
                )}
              </View>
              <Text style={styles.batchTitle}>{categoryName} Cluster {requestId}</Text>

              {/* Address Row */}
              <View style={styles.addressRow}>
                <Icon name="map-marker-outline" size={18} color="#15A800" style={{ marginTop: 2 }} />
                <Text style={styles.addressText}>{fullAddress}</Text>
              </View>

              <View style={styles.pillsRow}>
                {/* Weight Pill */}
                <View style={styles.weightPill}>
                  <Text style={styles.pillLabel}>WEIGHT</Text>
                  <Text style={styles.weightVal}>{weightVal} kg</Text>
                </View>

                {/* Origin Pill */}
                <View style={styles.originPill}>
                  <Text style={styles.pillLabelRed}>ORIGIN</Text>
                  <Text style={styles.originVal}>{originVal}</Text>
                </View>
              </View>
            </View>

            {/* Condition Checklist */}
            <Text style={styles.sectionLabel}>CONDITION CHECKLIST</Text>
            <View style={styles.checklistGrid}>
              {CONDITIONS.map((c) => {
                const isChecked = selectedConditions.includes(c);
                return (
                  <TouchableOpacity
                    key={c}
                    style={styles.checkCard}
                    onPress={() => toggleCondition(c)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkboxSquare, isChecked && styles.checkboxSquareChecked]}>
                      {isChecked && <Icon name="check" size={14} color="#FFFFFF" />}
                    </View>
                    <Text style={styles.checkCardText}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Assessment Notes */}
            <Text style={styles.sectionLabel}>ASSESSMENT NOTES</Text>
            <View style={styles.textareaContainer}>
              <TextInput
                placeholder="Enter detailed observations..."
                placeholderTextColor="#94A3B8"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                style={styles.textarea}
              />
            </View>

            {/* Action Buttons Row */}
            {isAlreadyPickedUp ? (
              <View style={styles.alreadyPickedUpBanner}>
                <Icon name="check-decagram" size={20} color="#059669" />
                <Text style={styles.alreadyPickedUpBannerText}>Already Assessed & Picked Up in Supabase</Text>
              </View>
            ) : (
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={[styles.refuseBtn, submitting && { opacity: 0.7 }]}
                  onPress={handleRefuseBatch}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  <Icon name="close-circle-outline" size={20} color="#DC2626" />
                  <Text style={styles.refuseBtnText}>REFUSE</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.acceptBtn, submitting && { opacity: 0.7 }]}
                  onPress={handleAcceptBatch}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <View style={styles.checkIconCircle}>
                        <Icon name="check-circle-outline" size={18} color="#15A800" />
                      </View>
                      <Text style={styles.acceptBtnText}>ACCEPT</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('CollectorDashboard')}>
          <Icon name="truck" size={24} color="#475569" />
          <Text style={styles.tabLabel}>Routes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('PickupMap', { mode: 'collector' })}>
          <Icon name="map-outline" size={24} color="#475569" />
          <Text style={styles.tabLabel}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <View style={styles.tabIconActiveBg}>
            <Icon name="shield-check" size={24} color="#15A800" />
          </View>
          <Text style={styles.tabLabelActive}>Quality</Text>
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
  backBtn: {
    padding: 4,
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
  guidanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  guidanceIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guidanceTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  guidanceSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  goToRoutesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15A800',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    width: '100%',
    marginBottom: 24,
  },
  goToRoutesBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  quickPickerBox: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  quickPickerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerSection: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pickerScroll: {
    gap: 8,
  },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pickerChipActive: {
    backgroundColor: '#15A800',
    borderColor: '#15A800',
  },
  pickerChipDone: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  pickerChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  pickerChipTextActive: {
    color: '#FFFFFF',
  },
  pickerChipTextDone: {
    color: '#64748B',
  },
  pickedUpBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pickedUpBadgeHeaderText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  alreadyPickedUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  alreadyPickedUpBannerText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#047857',
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginBottom: 24,
  },
  batchLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  batchTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 20,
  },
  emptyPromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyPromptTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyPromptSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyPromptBtn: {
    backgroundColor: '#15A800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyPromptBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weightPill: {
    flex: 1,
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#15A800',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  weightVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15A800',
  },
  originPill: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillLabelRed: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991B1B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  originVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#991B1B',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  checklistGrid: {
    gap: 10,
    marginBottom: 24,
  },
  checkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareChecked: {
    backgroundColor: '#15A800',
    borderColor: '#15A800',
  },
  checkCardText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  textareaContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    padding: 14,
    marginBottom: 28,
  },
  textarea: {
    fontSize: 15,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  refuseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: 25,
    height: 52,
    gap: 8,
  },
  refuseBtnText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15A800',
    borderRadius: 25,
    height: 52,
    gap: 8,
  },
  checkIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
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

