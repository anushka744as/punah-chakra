import React, { useEffect, useMemo, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppData } from '../data/AppDataContext';

export const PickupMapScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { donations } = useAppData();
  const [locationGranted, setLocationGranted] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  const mode = route.params?.mode === 'collector' ? 'collector' : 'donor';
  const targetDonationId = route.params?.donationId;

  const targetDonation = donations.find((d) => d.id === targetDonationId);

  const parseCoords = (addressStr: string) => {
    if (!addressStr) return { lat: 28.5833, lng: 77.3167 };
    const match = addressStr.match(/Lat:\s*([0-9.-]+),\s*Long:\s*([0-9.-]+)/i);
    if (match && match[1] && match[2]) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }
    return { lat: 28.5833, lng: 77.3167 };
  };

  const confirmedDonations = useMemo(() => {
    if (mode !== 'collector') return donations;
    const confirmed = donations.filter((d) => ['assigned', 'in_transit', 'completed'].includes(d.status));
    return confirmed.length > 0 ? confirmed : donations;
  }, [donations, mode]);

  const initialCenter = targetDonation ? parseCoords(targetDonation.address) : { lat: 28.5833, lng: 77.3167 };

  const markersJs = useMemo(() => {
    if (!confirmedDonations || confirmedDonations.length === 0) {
      return `L.marker([28.5833, 77.3167]).addTo(map).bindPopup("<div class='popup-title'>Sector 15A Center</div>");`;
    }

    return confirmedDonations
      .map((item) => {
        const { lat, lng } = parseCoords(item.address);
        const cleanAddress = item.address.replace(/\(Lat:.*?\)/gi, '').trim();
        const isTarget = item.id === targetDonationId;
        const weight = item.weight_kg || item.estimated_quantity_kg || 10;
        return `
          (function() {
            var marker = L.marker([${lat}, ${lng}]).addTo(map)
              .bindPopup("<div class='popup-title'>${item.category} Donor</div><div class='popup-sub'>${cleanAddress.replace(/"/g, '\\"')}</div><span class='popup-badge'>${weight} kg &bull; ${item.time_slot} &bull; ${item.status.toUpperCase()}</span>");
            ${isTarget ? 'marker.openPopup();' : ''}
          })();
        `;
      })
      .join('\n');
  }, [confirmedDonations, targetDonationId]);

  const requestLocationPermission = async () => {
    if (Platform.OS !== 'android') {
      setLocationGranted(true);
      return;
    }

    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'PunahChakra needs location access to show nearby donation pickups in Noida.',
          buttonPositive: 'Allow',
          buttonNegative: 'Cancel',
        },
      );
      setLocationGranted(result === PermissionsAndroid.RESULTS.GRANTED);
    } catch (e) {
      setLocationGranted(false);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const html = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #F8F9FE; }
    .leaflet-popup-content-wrapper { border-radius: 16px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .popup-title { font-size: 14px; font-weight: 800; color: #0F172A; margin-bottom: 2px; }
    .popup-sub { font-size: 12px; color: #64748B; margin-bottom: 6px; }
    .popup-badge { display: inline-block; background: #ECFDF5; color: #15A800; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    });

    var esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: '&copy; Esri'
    });

    var map = L.map('map', {
      center: [${initialCenter.lat}, ${initialCenter.lng}],
      zoom: ${targetDonation ? 16 : 14},
      layers: [${mapType === 'satellite' ? 'esriSat' : 'osm'}]
    });

    // Active Zones
    L.circle([28.5833, 77.3167], { color: '#15A800', fillColor: '#6EE7B7', fillOpacity: 0.2, radius: 700 }).addTo(map);

    // Dynamic Real Donor Markers from Supabase
    ${markersJs}
  </script>
</body>
</html>`,
    [mapType, initialCenter.lat, initialCenter.lng, markersJs, targetDonation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'collector' ? 'Pickup Routes & Map' : 'Donation Map'}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('CollectorProfile')} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Map Control Bar */}
      <View style={styles.mapControlBar}>
        <View style={styles.zoneChip}>
          <Icon name="map-marker-check" size={16} color="#15A800" />
          <Text style={styles.zoneChipText}>Noida Sector 15A & 44</Text>
        </View>

        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[styles.toggleBtn, mapType === 'street' && styles.toggleBtnActive]}
            onPress={() => setMapType('street')}
          >
            <Text style={[styles.toggleBtnText, mapType === 'street' && styles.toggleBtnTextActive]}>
              Street
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, mapType === 'satellite' && styles.toggleBtnActive]}
            onPress={() => setMapType('satellite')}
          >
            <Text style={[styles.toggleBtnText, mapType === 'satellite' && styles.toggleBtnTextActive]}>
              Satellite
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Specific Info Banner */}
      {mode === 'collector' && !targetDonationId && (
        <View style={styles.promptBanner}>
          <Icon name="information-outline" size={20} color="#15A800" />
          <View style={{ flex: 1 }}>
            <Text style={styles.promptTitle}>Choose a Confirmed Pickup</Text>
            <Text style={styles.promptSub}>
              Confirm a pickup on the Routes tab to navigate directly to a donor's doorstep!
            </Text>
          </View>
          <TouchableOpacity
            style={styles.promptActionBtn}
            onPress={() => navigation.navigate('CollectorDashboard')}
            activeOpacity={0.8}
          >
            <Text style={styles.promptActionText}>Go to Routes</Text>
          </TouchableOpacity>
        </View>
      )}

      {targetDonation && (
        <View style={styles.targetBanner}>
          <View style={styles.targetIconBg}>
            <Icon name="navigation" size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.targetTitle}>Doorstep Destination: {targetDonation.category}</Text>
            <Text style={styles.targetAddress}>
              {targetDonation.address.replace(/\(Lat:.*?\)/gi, '').trim()}
            </Text>
          </View>
        </View>
      )}

      {/* WebView Leaflet Map */}
      <View style={styles.mapFrame}>
        <WebView
          source={{ html }}
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled
          originWhitelist={['*']}
          style={styles.map}
        />
      </View>

      {/* Service Info Banner */}
      <View style={styles.bottomInfoPanel}>
        <Text style={styles.infoHeading}>CURRENT SERVICE COVERAGE</Text>
        <Text style={styles.infoBody}>
          Doorstep pickups currently live in <Text style={styles.boldText}>Noida Sector 15A</Text> and <Text style={styles.boldText}>Noida Sector 44</Text>.
        </Text>
      </View>

      {/* Bottom Navigation Tab Bar for Collector */}
      {mode === 'collector' && (
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('CollectorDashboard')}>
            <Icon name="truck" size={24} color="#475569" />
            <Text style={styles.tabLabel}>Routes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
            <View style={styles.tabIconActiveBg}>
              <Icon name="map" size={24} color="#15A800" />
            </View>
            <Text style={styles.tabLabelActive}>Map</Text>
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
      )}
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
    fontSize: 20,
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
  mapControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  zoneChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15A800',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  toggleBtnActive: {
    backgroundColor: '#15A800',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  mapFrame: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomInfoPanel: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
  infoHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
    color: '#15A800',
  },
  promptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  promptTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  promptSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  promptActionBtn: {
    backgroundColor: '#15A800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  promptActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  targetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#A7F3D0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  targetIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#15A800',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  targetAddress: {
    fontSize: 12,
    fontWeight: '500',
    color: '#047857',
    marginTop: 2,
    flexWrap: 'wrap',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
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

