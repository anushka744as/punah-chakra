import React, { useEffect, useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchActivePickups, updatePickupStatus, type PickupJob } from '../services/api';
import { useAppData } from '../data/AppDataContext';

export const CollectionScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { authUser, confirmPickup } = useAppData();
  const [pickups, setPickups] = useState<PickupJob[]>([]);
  const [totalWeight, setTotalWeight] = useState('0 kg');

  useEffect(() => {
    loadPickups();
  }, []);

  const loadPickups = async () => {
    try {
      const data = await fetchActivePickups();
      setPickups(data);
      const total = data.reduce((acc, p) => {
        const kg = parseFloat(p.weight_summary?.replace(' kg', '') || '0');
        return acc + kg;
      }, 0);
      setTotalWeight(`${total.toFixed(1)} kg`);
    } catch {
      // Keep empty state
    }
  };

  const handleConfirmPickup = (pickup: PickupJob) => {
    Alert.alert(
      'Confirm Pickup Assignment? 🚚',
      'Only confirm if you want to pickup this donation. Please refuse it after confirming if you change your decision.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Pickup',
          onPress: () => executeConfirmPickup(pickup),
        },
      ]
    );
  };

  const executeConfirmPickup = async (pickup: PickupJob) => {
    try {
      if (confirmPickup) {
        await confirmPickup(pickup.id);
      } else {
        await updatePickupStatus(pickup.id, 'in_transit');
      }
      await loadPickups();
    } catch { /* silent */ }
    navigation.navigate('PickupMap', { mode: 'collector', donationId: pickup.id });
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
          <Text style={styles.headerTitle}>Routes</Text>
        </View>
        <TouchableOpacity onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Collection Dashboard Banner */}
        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardTitle}>Collection dashboard</Text>
          <Text style={styles.dashboardSubtitle}>Today's logistics & recovery ops.</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>ASSIGNED</Text>
              <Text style={styles.statValue}>{pickups.length}</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>TOTAL WEIGHT</Text>
              <Text style={styles.statValue}>{totalWeight}</Text>
            </View>
          </View>
        </View>

        {/* Route Map Card */}
        <TouchableOpacity
          style={styles.routeMapCard}
          onPress={() => navigation.navigate('PickupMap')}
          activeOpacity={0.8}
        >
          <View style={styles.mapIconBg}>
            <Icon name="map-outline" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.routeTextCol}>
            <Text style={styles.routeTitle}>Route map</Text>
            <Text style={styles.routeSubtitle}>View optimized pickup route</Text>
          </View>
          <Icon name="arrow-right" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Today's Pickups Section */}
        <Text style={styles.sectionTitle}>Today's pickups</Text>

        {pickups.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="truck-check-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No pickups assigned yet for today.</Text>
          </View>
        ) : (
          pickups.map((item) => (
            <View key={item.id} style={styles.pickupCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.userAvatar}>
                  <Icon name="account-outline" size={22} color="#15A800" />
                </View>
                <View style={styles.userInfoCol}>
                  <Text style={styles.userName}>{item.donor_name}</Text>
                  <Text style={styles.userId}>ID #{item.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <Text style={styles.weightText}>{item.weight_summary}</Text>
              </View>

              <View style={styles.infoMetaRow}>
                <View style={styles.metaItem}>
                  <Icon name="map-marker-outline" size={16} color="#64748B" />
                  <Text style={styles.metaText}>{item.address}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="clock-outline" size={16} color="#64748B" />
                  <Text style={styles.metaText}>{item.time_window}</Text>
                </View>
              </View>

              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={styles.assessBtn}
                  onPress={() => navigation.navigate('Quality')}
                  activeOpacity={0.8}
                >
                  <View style={styles.badgeCheckIconCircle}>
                    <Icon name="checkbox-marked-circle-outline" size={18} color="#15A800" />
                  </View>
                  <Text style={styles.assessBtnText}>Assess</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => handleConfirmPickup(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.confirmCheckIconCircle}>
                    <Icon name="check-circle-outline" size={18} color="#15A800" />
                  </View>
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                </TouchableOpacity>
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
  dashboardCard: {
    backgroundColor: '#15A800',
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  dashboardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  routeMapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F5B37',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
  },
  mapIconBg: {
    marginRight: 14,
  },
  routeTextCol: {
    flex: 1,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  routeSubtitle: {
    fontSize: 13,
    color: '#D1FAE5',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  pickupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    marginBottom: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  userId: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  weightText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#15A800',
  },
  infoMetaRow: {
    gap: 6,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  assessBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#15A800',
    borderRadius: 25,
    height: 46,
    gap: 8,
  },
  badgeCheckIconCircle: {
    marginRight: 2,
  },
  assessBtnText: {
    color: '#15A800',
    fontSize: 15,
    fontWeight: '800',
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15A800',
    borderRadius: 25,
    height: 46,
    gap: 8,
  },
  confirmCheckIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

