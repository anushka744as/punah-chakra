import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AlertSettingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [pickupReminders, setPickupReminders] = useState(true);
  const [statusUpdates, setStatusUpdates] = useState(true);

  const handleProfileNav = () => {
    try {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } catch {
      navigation.navigate('Profile');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collection Alerts</Text>
        <TouchableOpacity onPress={handleProfileNav} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* Item 1 */}
          <View style={styles.itemRow}>
            <View style={styles.iconBg}>
              <Icon name="truck-delivery-outline" size={22} color="#15A800" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.itemTitle}>Pickup reminders</Text>
              <Text style={styles.itemSubtitle}>Get notified before scheduled pickups</Text>
            </View>
            <Switch
              value={pickupReminders}
              onValueChange={setPickupReminders}
              trackColor={{ false: '#CBD5E1', true: '#15A800' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Item 2 */}
          <View style={styles.itemRow}>
            <View style={styles.iconBg}>
              <Icon name="recycle" size={22} color="#15A800" />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.itemTitle}>Status updates</Text>
              <Text style={styles.itemSubtitle}>When a collector accepts or completes a job</Text>
            </View>
            <Switch
              value={statusUpdates}
              onValueChange={setStatusUpdates}
              trackColor={{ false: '#CBD5E1', true: '#15A800' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
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
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
});

