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
import { theme } from '../theme/theme';
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
    navigation.navigate('PickupMap', { mode: 'admin', donationId: pickup.id });
  };

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
          <Text style={styles.headerTitle}>Routes</Text>
        </View>
        <TouchableOpacity onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.surface} />
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
            <Icon name="map-outline" size={24} color={theme.colors.surface} />
          </View>
          <View style={styles.routeTextCol}>
            <Text style={styles.routeTitle}>Route map</Text>
            <Text style={styles.routeSubtitle}>View optimized pickup route</Text>
          </View>
          <Icon name="arrow-right" size={24} color={theme.colors.surface} />
        </TouchableOpacity>

        {/* Today's Pickups Section */}
        <Text style={styles.sectionTitle}>Today's pickups</Text>

        {pickups.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="truck-check-outline" size={48} color={theme.colors.border} />
            <Text style={styles.emptyText}>No pickups assigned yet for today.</Text>
          </View>
        ) : (
          pickups.map((item) => (
            <View key={item.id} style={styles.pickupCard}>
              <View style={styles.cardTopRow}>
                <View style={styles.userAvatar}>
                  <Icon name="account-outline" size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.userInfoCol}>
                  <Text style={styles.userName}>{item.donor_name}</Text>
                  <Text style={styles.userId}>ID #{item.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <Text style={styles.weightText}>{item.weight_summary}</Text>
              </View>

              <View style={styles.infoMetaRow}>
                <View style={styles.metaItem}>
                  <Icon name="map-marker-outline" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.metaText}>{item.address}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Icon name="clock-outline" size={16} color={theme.colors.textSecondary} />
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
                    <Icon name="checkbox-marked-circle-outline" size={18} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.assessBtnText}>Assess</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={() => handleConfirmPickup(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.confirmCheckIconCircle}>
                    <Icon name="check-circle-outline" size={18} color={theme.colors.primary} />
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
  dashboardCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  dashboardTitle: {
    fontSize: 26,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
    marginBottom: 4,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: theme.colors.primaryContainer,
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
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primaryContainer,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 34,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
  },
  routeMapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryDark,
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
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
  },
  routeSubtitle: {
    fontSize: 13,
    color: theme.colors.primaryContainer,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 14,
  },
  pickupCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfoCol: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  userId: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontFamily: theme.fonts.bodySemiBold,
  },
  weightText: {
    fontSize: 22,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
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
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.bodyMedium,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: 25,
    height: 46,
    gap: 8,
  },
  badgeCheckIconCircle: {
    marginRight: 2,
  },
  assessBtnText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontFamily: theme.fonts.bodyBold,
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    height: 46,
    gap: 8,
  },
  confirmCheckIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: theme.colors.surface,
    fontSize: 15,
    fontFamily: theme.fonts.bodyBold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

