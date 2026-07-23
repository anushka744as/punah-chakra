import React, { useState } from 'react';
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

export const CollectorDashboardScreen = ({ navigation }: any) => {
  const { donations, authUser, refreshDonations } = useAppData();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const activeDonations = donations.filter(item => ['scheduled', 'assigned', 'in_transit'].includes(item.status));
  const totalWeight = activeDonations.reduce((sum, item) => sum + Number(item.weight_kg || item.estimated_quantity_kg || 10), 0);

  const handleConfirmPickup = async (item: DonationItem) => {
    try {
      setConfirmingId(item.id);

      // Attempt status update to 'in_transit'. Fall back to 'assigned' if live Supabase check constraint hasn't been updated yet.
      const res1 = await supabase
        .from('donations')
        .update({ status: 'in_transit' })
        .eq('id', item.id);

      if (res1.error) {
        const res2 = await supabase
          .from('donations')
          .update({ status: 'assigned' })
          .eq('id', item.id);

        if (res2.error) throw res2.error;
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

      Alert.alert('Pickup Confirmed! 🚚', 'Notifications sent to both Donor & Collector. You can now tap "View Map" to navigate!');
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
              <Text style={styles.dashStatValue}>{activeDonations.length}</Text>
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

        <Text style={styles.sectionTitle}>Today's pickups</Text>

        {/* Pickup List */}
        {activeDonations.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="check-circle-outline" size={48} color="#15A800" />
            <Text style={styles.emptyStateText}>All caught up for today!</Text>
          </View>
        ) : (
          activeDonations.map((item, index) => (
            <View key={item.id} style={styles.pickupCard}>
              
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.avatar}>
                    <Icon name="account-outline" size={24} color="#15A800" />
                  </View>
                  <View>
                    <Text style={styles.donorName}>{item.category} Donor</Text>
                    <Text style={styles.donorId}>ID #REC-982{index + 1}</Text>
                  </View>
                </View>
                <Text style={styles.weightText}>{item.weight_kg || item.estimated_quantity_kg || 10} kg</Text>
              </View>

              {/* Card Info (Address / Time) */}
              <View style={styles.cardInfoBox}>
                <TouchableOpacity
                  style={styles.infoItemAddress}
                  onPress={() => navigation.navigate('PickupMap', { mode: 'collector', donationId: item.id })}
                  activeOpacity={0.7}
                >
                  <Icon name="map-marker-outline" size={18} color="#15A800" style={{ marginTop: 2 }} />
                  <Text style={styles.infoTextAddress}>
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
                <TouchableOpacity
                  style={styles.assessBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Quality', { donationId: item.id })}
                >
                  <Icon name="decagram-outline" size={18} color="#15A800" />
                  <Text style={styles.assessBtnText}>Assess</Text>
                </TouchableOpacity>
                
                {item.status === 'scheduled' ? (
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
                ) : (
                  <TouchableOpacity
                    style={styles.confirmBtn}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PickupMap', { mode: 'collector', donationId: item.id })}
                  >
                    <Icon name="map-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.confirmBtnText}>View Map</Text>
                  </TouchableOpacity>
                )}
              </View>

            </View>
          ))
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
  btnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
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
