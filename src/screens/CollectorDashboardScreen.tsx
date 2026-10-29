import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Linking,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppData } from '../data/AppDataContext';
import { markDonationCompleted, fetchUnreadNotificationCount, fetchNewAreaRequestPincodes, adminUpdateDonation, adminCancelDonation, DonationItem } from '../services/api';
import { stripAddressMeta } from '../utils/address';
import { theme } from '../theme/theme';
import { useTimeSlots } from '../hooks/useTimeSlots';

export const CollectorDashboardScreen = ({ navigation }: any) => {
  const { donations, authUser, refreshDonations, serviceablePincodes } = useAppData();
  const [unreadCount, setUnreadCount] = useState(0);
  const [areaPincode, setAreaPincode] = useState<string>('all');
  const [areaPickerOpen, setAreaPickerOpen] = useState(false);
  const [newAreaRequests, setNewAreaRequests] = useState(0);

  // Admin editing of any donor's pickup (date / time / address / weight, or cancel it).
  const timeSlots = useTimeSlots();
  const [editing, setEditing] = useState<DonationItem | null>(null);
  const [editDate, setEditDate] = useState(new Date());
  const [editSlot, setEditSlot] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const dayLabel = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const nextDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

  const openEdit = (item: DonationItem) => {
    const match = nextDays.find(d => dayLabel(d) === item.pickup_day);
    setEditing(item);
    setEditDate(match || nextDays[0]);
    setEditSlot(item.time_slot || timeSlots[0] || '');
    setEditAddress(stripAddressMeta(item.address));
    setEditWeight(String(item.weight_kg || item.estimated_quantity_kg || 1));
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (editAddress.trim().length < 10) {
      Alert.alert('Address too short', 'Enter the full pickup address.');
      return;
    }
    setSavingEdit(true);
    try {
      // Untouched addresses keep their "(Lat: x, Long: y)" suffix so the map pin stays put.
      const addressChanged = editAddress.trim() !== stripAddressMeta(editing.address).trim();
      await adminUpdateDonation(editing, {
        pickup_day: dayLabel(editDate),
        time_slot: editSlot,
        address: addressChanged ? editAddress.trim() : editing.address,
        weight_kg: parseFloat(editWeight) || 1,
      });
      setEditing(null);
      await refreshDonations();
    } catch (err: any) {
      Alert.alert('Could not save', err?.message || 'Try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelEdited = () => {
    if (!editing) return;
    Alert.alert('Cancel this pickup?', 'The donor will be notified.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel pickup',
        style: 'destructive',
        onPress: async () => {
          try {
            await adminCancelDonation(editing);
            setEditing(null);
            await refreshDonations();
          } catch (err: any) {
            Alert.alert('Could not cancel', err?.message || 'Try again.');
          }
        },
      },
    ]);
  };

  useEffect(() => {
    refreshDonations();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (authUser?.id) {
        fetchUnreadNotificationCount(authUser.id).then(setUnreadCount);
      }
    }, [authUser?.id])
  );

  // Badge on the Areas tab: pincodes people asked for that the admin hasn't looked at yet.
  useFocusEffect(
    useCallback(() => {
      const tick = () => fetchNewAreaRequestPincodes(serviceablePincodes).then(p => setNewAreaRequests(p.length)).catch(() => {});
      tick();
      const timer = setInterval(tick, 15000);
      return () => clearInterval(timer);
    }, [serviceablePincodes])
  );

  const handleMarkDone = (item: DonationItem) => {
    Alert.alert(
      'Mark as Done',
      `Mark this ${item.category} pickup as completed? It will be removed from the map.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Done',
          onPress: async () => {
            try {
              await markDonationCompleted(item.id, authUser?.id);
              await refreshDonations();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not mark this pickup as done.');
            }
          },
        },
      ]
    );
  };

  const allDonations = useMemo(() => {
    const notCancelled = (donations || []).filter(d => d.status !== 'cancelled');
    return areaPincode === 'all' ? notCancelled : notCancelled.filter(d => d.pincode === areaPincode);
  }, [donations, areaPincode]);

  const pendingCount = allDonations.filter(item => !item.is_picked_up && item.status !== 'completed').length;
  const totalWeight = allDonations
    .filter(item => !item.is_picked_up && item.status !== 'completed')
    .reduce((sum, item) => sum + Number(item.weight_kg || item.estimated_quantity_kg || 10), 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="recycle" size={26} color={theme.colors.surface} />
          <Text style={styles.headerTitle}>Routes</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.bellBtn} onPress={() => navigation.navigate('Notifications')} activeOpacity={0.7}>
            <Icon name="bell-outline" size={24} color={theme.colors.surface} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('CollectorProfile')} activeOpacity={0.7}>
            <Icon name="account-circle-outline" size={26} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
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

        <View style={styles.pickupsHeaderRow}>
          <Text style={styles.sectionTitle}>All Pickups</Text>
          <TouchableOpacity
            style={styles.areaFilterChip}
            onPress={() => setAreaPickerOpen(true)}
            activeOpacity={0.8}
          >
            <Icon name="map-marker-check" size={15} color={theme.colors.primary} />
            <Text style={styles.areaFilterChipText}>
              {areaPincode === 'all' ? 'All Areas' : areaPincode}
            </Text>
            <Icon name="chevron-down" size={15} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Pickup List */}
        {allDonations.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="check-circle-outline" size={48} color={theme.colors.primary} />
            <Text style={styles.emptyStateText}>No pickup requests available.</Text>
          </View>
        ) : (
          allDonations.map((item, index) => {
            const isPickedUp = Boolean(item.is_picked_up || item.status === 'completed' || item.status === 'collected');
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
                      <Text style={[styles.donorName, isPickedUp && styles.textMuted]}>{item.donor_name || `${item.category} Donor`}</Text>
                      <Text style={styles.donorId}>ID {reqId}</Text>
                    </View>
                  </View>
                  <Text style={[styles.weightText, isPickedUp && styles.weightTextDisabled]}>
                    {item.weight_kg || item.estimated_quantity_kg || 10} kg
                  </Text>
                </View>

                {/* Card Info (Item type / Phone / Address / Time) */}
                <View style={styles.cardInfoBox}>
                  <View style={styles.infoItemTime}>
                    <Icon name="tshirt-crew-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.infoTextTime}>{item.category}</Text>
                  </View>

                  {!!item.donor_phone && (
                    <TouchableOpacity
                      style={styles.infoItemTime}
                      onPress={() => Linking.openURL(`tel:${item.donor_phone}`)}
                      activeOpacity={0.7}
                    >
                      <Icon name="phone-outline" size={16} color={theme.colors.textSecondary} />
                      <Text style={styles.infoTextTime}>{item.donor_phone}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.infoItemAddress}
                    onPress={() => navigation.navigate('PickupMap', { mode: 'admin', donationId: item.id })}
                    activeOpacity={0.7}
                  >
                    <Icon name="map-marker-outline" size={18} color={isPickedUp ? theme.colors.textSecondary : theme.colors.primary} style={{ marginTop: 2 }} />
                    <Text style={[styles.infoTextAddress, isPickedUp && styles.textMuted]}>
                      {stripAddressMeta(item.address)}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.infoItemTime}>
                    <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.infoTextTime}>
                      {item.pickup_day ? `${item.pickup_day} • ${item.time_slot}` : item.time_slot}
                    </Text>
                  </View>

                  {!!item.pincode && (
                    <View style={styles.infoItemTime}>
                      <Icon name="map-marker-check-outline" size={16} color={theme.colors.textSecondary} />
                      <Text style={styles.infoTextTime}>Pincode: {item.pincode}</Text>
                    </View>
                  )}
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
                        onPress={() => navigation.navigate('Quality', { donationId: item.id })}
                      >
                        <Icon name="decagram-outline" size={18} color={theme.colors.primary} />
                        <Text style={styles.assessBtnText}>Complete</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.viewMapBtn}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('PickupMap', { mode: 'admin', donationId: item.id })}
                      >
                        <Icon name="map-marker-path" size={18} color={theme.colors.surface} />
                        <Text style={styles.viewMapBtnText}>View Map</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.markDoneBtn}
                        activeOpacity={0.8}
                        onPress={() => handleMarkDone(item)}
                      >
                        <Icon name="check-bold" size={18} color={theme.colors.success} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.editBtn}
                        activeOpacity={0.8}
                        onPress={() => openEdit(item)}
                      >
                        <Icon name="pencil-outline" size={18} color={theme.colors.primary} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>

              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={styles.editBackdrop}>
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Edit pickup</Text>
            <Text style={styles.editSub}>{editing?.donor_name || editing?.category} · the donor is notified of changes</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.editLabel}>DATE</Text>
              <View style={styles.editChipsRow}>
                {nextDays.map(d => {
                  const on = dayLabel(d) === dayLabel(editDate);
                  return (
                    <TouchableOpacity key={d.toDateString()} style={[styles.editChip, on && styles.editChipOn]} onPress={() => setEditDate(d)} activeOpacity={0.8}>
                      <Text style={[styles.editChipText, on && styles.editChipTextOn]}>{dayLabel(d)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.editLabel}>TIME</Text>
              <View style={styles.editChipsRow}>
                {timeSlots.map(slot => (
                  <TouchableOpacity key={slot} style={[styles.editChip, editSlot === slot && styles.editChipOn]} onPress={() => setEditSlot(slot)} activeOpacity={0.8}>
                    <Text style={[styles.editChipText, editSlot === slot && styles.editChipTextOn]}>{slot}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.editLabel}>WEIGHT (KG)</Text>
              <TextInput style={styles.editInput} value={editWeight} onChangeText={setEditWeight} keyboardType="decimal-pad" />
              <Text style={styles.editLabel}>ADDRESS</Text>
              <TextInput style={[styles.editInput, { minHeight: 70, textAlignVertical: 'top' }]} value={editAddress} onChangeText={setEditAddress} multiline />
            </ScrollView>
            <TouchableOpacity style={styles.editSaveBtn} onPress={saveEdit} disabled={savingEdit} activeOpacity={0.85}>
              <Text style={styles.editSaveText}>{savingEdit ? 'Saving…' : 'Save changes'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editLinkBtn} onPress={cancelEdited} activeOpacity={0.7}>
              <Text style={styles.editDangerText}>Cancel this pickup</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.editLinkBtn} onPress={() => setEditing(null)} activeOpacity={0.7}>
              <Text style={styles.editLinkText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('AdminAvailability')}>
          <Icon name="calendar-month-outline" size={24} color={theme.colors.textSecondary} />
          <Text style={styles.tabLabel}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('AdminAreas')}>
          <View>
            <Icon name="map-marker-radius-outline" size={24} color={theme.colors.textSecondary} />
            {newAreaRequests > 0 && (
              <View style={styles.areaBadge}>
                <Text style={styles.areaBadgeText}>{newAreaRequests > 9 ? '9+' : newAreaRequests}</Text>
              </View>
            )}
          </View>
          <Text style={styles.tabLabel}>Areas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('AdminDrives')}>
          <Icon name="calendar-star" size={24} color={theme.colors.textSecondary} />
          <Text style={styles.tabLabel}>Drives</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('CollectorProfile')}>
          <Icon name="account-outline" size={24} color={theme.colors.textSecondary} />
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Area (Pincode) Filter Picker */}
      <Modal
        visible={areaPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAreaPickerOpen(false)}
      >
        <View style={styles.areaModalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setAreaPickerOpen(false)}
          />
          <View style={styles.areaModalCard}>
            <Text style={styles.areaModalTitle}>View Area</Text>
            <TouchableOpacity
              style={styles.areaOption}
              onPress={() => {
                setAreaPincode('all');
                setAreaPickerOpen(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.areaOptionText, areaPincode === 'all' && styles.areaOptionTextActive]}>
                All Areas
              </Text>
              {areaPincode === 'all' && <Icon name="check" size={18} color={theme.colors.primary} />}
            </TouchableOpacity>
            {serviceablePincodes.map((pc) => (
              <TouchableOpacity
                key={pc}
                style={styles.areaOption}
                onPress={() => {
                  setAreaPincode(pc);
                  setAreaPickerOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.areaOptionText, areaPincode === pc && styles.areaOptionTextActive]}>
                  {pc}
                </Text>
                {areaPincode === pc && <Icon name="check" size={18} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileBtn: {
    padding: 4,
  },
  bellBtn: {
    padding: 4,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
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
  pickupsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  areaFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
    marginBottom: 16,
  },
  areaFilterChipText: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
  },
  areaModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  areaModalCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
  },
  areaModalTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  areaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  areaOptionText: {
    fontSize: 15,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.text,
  },
  areaOptionTextActive: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
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
  editBtn: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 24,
  },
  editBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  editCard: { backgroundColor: theme.colors.surface, borderRadius: 20, padding: 18, maxHeight: '90%' },
  editTitle: { fontSize: 18, fontFamily: theme.fonts.bodyBold, color: theme.colors.text, marginBottom: 2 },
  editSub: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginBottom: 12 },
  editLabel: { fontSize: 11, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary, letterSpacing: 0.8, marginTop: 10, marginBottom: 6 },
  editChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  editChip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.colors.surface },
  editChipOn: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  editChipText: { fontSize: 12, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary },
  editChipTextOn: { color: theme.colors.surface },
  editInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: theme.fonts.body, color: theme.colors.text },
  editSaveBtn: { marginTop: 16, backgroundColor: theme.colors.primary, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  editSaveText: { fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.surface },
  editLinkBtn: { alignItems: 'center', paddingVertical: 10 },
  editLinkText: { fontSize: 13, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.primary },
  editDangerText: { fontSize: 13, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.error },
  markDoneBtn: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.success,
    borderRadius: 24,
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
  areaBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaBadgeText: {
    fontSize: 10,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
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
