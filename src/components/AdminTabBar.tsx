import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppData } from '../data/AppDataContext';
import { fetchNewAreaRequestPincodes } from '../services/api';
import { theme } from '../theme/theme';

export type AdminTab = 'routes' | 'map' | 'calendar' | 'areas' | 'drives';

const TABS: { key: AdminTab; label: string; icon: string; activeIcon: string; route: string; params?: object }[] = [
  { key: 'routes', label: 'Routes', icon: 'truck', activeIcon: 'truck', route: 'CollectorDashboard' },
  { key: 'map', label: 'Map', icon: 'map-outline', activeIcon: 'map', route: 'PickupMap', params: { mode: 'admin' } },
  { key: 'calendar', label: 'Calendar', icon: 'calendar-month-outline', activeIcon: 'calendar-month', route: 'AdminAvailability' },
  { key: 'areas', label: 'Areas', icon: 'map-marker-radius-outline', activeIcon: 'map-marker-radius', route: 'AdminAreas' },
  { key: 'drives', label: 'Drives', icon: 'calendar-star', activeIcon: 'calendar-star', route: 'AdminDrives' },
];

// Shared admin bottom bar. `active` is the current tab (omit on screens that aren't a tab, e.g. Profile).
export const AdminTabBar = ({ active }: { active?: AdminTab }) => {
  const navigation = useNavigation<any>();
  const { serviceablePincodes } = useAppData();
  const [newAreaRequests, setNewAreaRequests] = useState(0);

  // Badge on Areas: pincodes people asked for that the admin hasn't looked at yet.
  useFocusEffect(
    useCallback(() => {
      const tick = () => fetchNewAreaRequestPincodes(serviceablePincodes).then(p => setNewAreaRequests(p.length)).catch(() => {});
      tick();
      const timer = setInterval(tick, 15000);
      return () => clearInterval(timer);
    }, [serviceablePincodes])
  );

  const go = (tab: typeof TABS[number]) => {
    if (tab.key === active) { return; }
    if (tab.key === 'routes') {
      navigation.popTo('CollectorDashboard');
    } else if (active === 'routes' || !active) {
      navigation.navigate(tab.route, tab.params);
    } else {
      navigation.replace(tab.route, tab.params);
    }
  };

  return (
    <View style={styles.bar}>
      {TABS.map(tab => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity key={tab.key} style={styles.item} activeOpacity={0.7} onPress={() => go(tab)}>
            {isActive ? (
              <View style={styles.iconActiveBg}>
                <Icon name={tab.activeIcon} size={24} color={theme.colors.primary} />
              </View>
            ) : (
              <View>
                <Icon name={tab.icon} size={24} color={theme.colors.textSecondary} />
                {tab.key === 'areas' && newAreaRequests > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{newAreaRequests > 9 ? '9+' : newAreaRequests}</Text>
                  </View>
                )}
              </View>
            )}
            <Text style={isActive ? styles.labelActive : styles.label}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  item: { alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconActiveBg: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
  },
  labelActive: { fontSize: 12, fontFamily: theme.fonts.bodyBold, color: theme.colors.text },
  label: { fontSize: 12, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary },
  badge: {
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
  badgeText: { fontSize: 10, fontFamily: theme.fonts.bodyBold, color: theme.colors.surface },
});
