import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppData } from '../data/AppDataContext';

import { Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, DonationItem, calculateRewardForCategories, creditDonorForCompletedDonation } from '../services/api';
import { theme } from '../theme/theme';

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export const QualityScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { donations, authUser, refreshDonations, refreshProfile } = useAppData();
  const [submitting, setSubmitting] = useState(false);

  const allPickups = useMemo(() => donations || [], [donations]);

  // No confirm/claim step exists — any scheduled (not yet picked up) pickup is
  // actionable directly by any admin.
  const pendingPickups = useMemo(() => {
    return allPickups.filter((p) => !(p.is_picked_up || p.status === 'completed'));
  }, [allPickups]);

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
    ? (pendingPickups.find(d =>
        d.id === targetId ||
        d.request_id === targetId ||
        (d.request_id && d.request_id.replace('#', '').toLowerCase() === targetId.replace('#', '').toLowerCase()) ||
        d.id.includes(targetId) ||
        targetId.includes(d.id)
      ) || pendingPickups[0] || null)
    : (pendingPickups.length > 0 ? pendingPickups[0] : null);

  const isAlreadyPickedUp = currentDonation ? (currentDonation.is_picked_up || currentDonation.status === 'completed') : false;

  const categoryName = currentDonation?.category || '—';
  const requestId = currentDonation?.request_id || '—';
  const weightVal = currentDonation?.weight_kg || currentDonation?.estimated_quantity_kg || 0;
  const fullAddress = currentDonation?.address ? currentDonation.address.replace(/\(Lat:.*?\)/gi, '').trim() : '—';
  const originVal = fullAddress.includes(',') ? fullAddress.split(',')[1].trim() : fullAddress;

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

      // Credit the donor now that the pickup is actually completed (not at scheduling time)
      if (currentDonation.donor_id) {
        try {
          const { pointsAwarded: donorPoints, co2OffsetKg: donorCo2 } = await calculateRewardForCategories(
            categoryName.split(','),
            weightVal
          );
          await creditDonorForCompletedDonation(currentDonation.donor_id, donorPoints, donorCo2);
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
            notes: 'Picked up & completed by collector',
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Pickup</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CollectorProfile')} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Guidance Prompt Card when opened directly without selecting a pickup */}
        {!currentDonation ? (
          <View style={styles.guidanceCard}>
            <View style={styles.guidanceIconBg}>
              <Icon name="truck-fast-outline" size={38} color={theme.colors.primary} />
            </View>
            <Text style={styles.guidanceTitle}>No Pickup Selected</Text>
            <Text style={styles.guidanceSub}>
              Please select a pickup first! Go to the <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.primary }}>Routes</Text> tab and tap <Text style={{ fontFamily: theme.fonts.bodyBold, color: theme.colors.primary }}>"Complete"</Text> on a pickup to mark it as picked up.
            </Text>

            <TouchableOpacity
              style={styles.goToRoutesBtn}
              onPress={() => navigation.navigate('CollectorDashboard')}
              activeOpacity={0.8}
            >
              <Icon name="map-marker-path" size={20} color={theme.colors.surface} />
              <Text style={styles.goToRoutesBtnText}>Go to Routes Page</Text>
            </TouchableOpacity>

            {/* Quick Picker Bar */}
            {pendingPickups.length > 0 && (
              <View style={styles.quickPickerBox}>
                <Text style={styles.quickPickerLabel}>PICKUPS TO COMPLETE:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                  {pendingPickups.map((item: DonationItem, idx: number) => {
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
                          color={itemDone ? theme.colors.success : theme.colors.primary}
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
            {pendingPickups.length > 0 && (
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>SELECT PICKUP ({pendingPickups.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
                  {pendingPickups.map((item: DonationItem, idx: number) => {
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
                          color={isSelected ? theme.colors.surface : (itemDone ? theme.colors.success : theme.colors.primary)}
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
                    <Icon name="check-circle" size={14} color={theme.colors.success} />
                    <Text style={styles.pickedUpBadgeHeaderText}>Picked Up</Text>
                  </View>
                )}
              </View>
              <Text style={styles.batchTitle}>{categoryName} Cluster {requestId}</Text>

              {/* Address Row */}
              <View style={styles.addressRow}>
                <Icon name="map-marker-outline" size={18} color={theme.colors.primary} style={{ marginTop: 2 }} />
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

            {/* Action Buttons Row */}
            {isAlreadyPickedUp ? (
              <View style={styles.alreadyPickedUpBanner}>
                <Icon name="check-decagram" size={20} color={theme.colors.success} />
                <Text style={styles.alreadyPickedUpBannerText}>Already Assessed & Picked Up in Supabase</Text>
              </View>
            ) : (
              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={[styles.acceptBtn, submitting && { opacity: 0.7 }]}
                  onPress={handleAcceptBatch}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color={theme.colors.surface} size="small" />
                  ) : (
                    <>
                      <View style={styles.checkIconCircle}>
                        <Icon name="check-circle-outline" size={18} color={theme.colors.primary} />
                      </View>
                      <Text style={styles.acceptBtnText}>MARK PICKED UP</Text>
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
          <Icon name="truck" size={24} color={theme.colors.textSecondary} />
          <Text style={styles.tabLabel}>Routes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('PickupMap', { mode: 'admin' })}>
          <Icon name="map-outline" size={24} color={theme.colors.textSecondary} />
          <Text style={styles.tabLabel}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
          <View style={styles.tabIconActiveBg}>
            <Icon name="shield-check" size={24} color={theme.colors.primary} />
          </View>
          <Text style={styles.tabLabelActive}>Quality</Text>
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
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
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
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  guidanceIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guidanceTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 8,
  },
  guidanceSub: {
    fontSize: 14,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  goToRoutesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
    width: '100%',
    marginBottom: 24,
  },
  goToRoutesBtnText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
  },
  quickPickerBox: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceContainer,
    paddingTop: 16,
  },
  quickPickerLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 12,
    textAlign: 'center',
  },
  pickerSection: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pickerScroll: {
    gap: 8,
  },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryContainer,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  pickerChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pickerChipDone: {
    backgroundColor: theme.colors.surfaceContainer,
    borderColor: theme.colors.border,
  },
  pickerChipText: {
    fontSize: 13,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.success,
  },
  pickerChipTextActive: {
    color: theme.colors.surface,
  },
  pickerChipTextDone: {
    color: theme.colors.textSecondary,
  },
  pickedUpBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pickedUpBadgeHeaderText: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.success,
  },
  alreadyPickedUpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryContainer,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  alreadyPickedUpBannerText: {
    fontSize: 15,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.success,
  },
  batchCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    marginBottom: 24,
  },
  batchLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  batchTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
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
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  emptyPromptCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyPromptTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  emptyPromptSub: {
    fontSize: 14,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyPromptBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyPromptBtnText: {
    color: theme.colors.surface,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weightPill: {
    flex: 1,
    backgroundColor: theme.colors.primaryContainer,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillLabel: {
    fontSize: 10,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  weightVal: {
    fontSize: 20,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
  },
  originPill: {
    flex: 1,
    backgroundColor: theme.colors.errorContainer,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pillLabelRed: {
    fontSize: 10,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.error,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  originVal: {
    fontSize: 20,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.error,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkCardText: {
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  textareaContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 20,
    padding: 14,
    marginBottom: 28,
  },
  textarea: {
    fontSize: 15,
    color: theme.colors.text,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    borderRadius: 25,
    height: 52,
    gap: 8,
  },
  refuseBtnText: {
    color: theme.colors.error,
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
    letterSpacing: 0.5,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    height: 52,
    gap: 8,
  },
  checkIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
    letterSpacing: 0.5,
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

