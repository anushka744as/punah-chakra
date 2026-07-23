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

export const PickupMapScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [locationGranted, setLocationGranted] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const mode = route.params?.mode === 'collector' ? 'collector' : 'donor';

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

    // Noida Center
    var map = L.map('map', {
      center: [28.5721, 77.3261],
      zoom: 13,
      layers: [${mapType === 'satellite' ? 'esriSat' : 'osm'}]
    });

    // Noida Sector 15A Zone
    var sec15 = L.circle([28.5833, 77.3167], {
      color: '#15A800',
      fillColor: '#6EE7B7',
      fillOpacity: 0.25,
      radius: 700
    }).addTo(map).bindPopup("<div class='popup-title'>Noida Sector 15A</div><div class='popup-sub'>Active Service Zone</div><span class='popup-badge'>SERVICE COVERAGE</span>");

    // Noida Sector 44 Zone
    var sec44 = L.circle([28.5611, 77.3389], {
      color: '#15A800',
      fillColor: '#6EE7B7',
      fillOpacity: 0.25,
      radius: 700
    }).addTo(map).bindPopup("<div class='popup-title'>Noida Sector 44</div><div class='popup-sub'>Active Service Zone</div><span class='popup-badge'>SERVICE COVERAGE</span>");

    // Donor & Collector Markers
    L.marker([28.5833, 77.3167]).addTo(map)
      .bindPopup("<div class='popup-title'>Johnathan Miller (#REC-9821)</div><div class='popup-sub'>42 Industrial Way, Unit B</div><span class='popup-badge'>45.5 kg Clothes & E-Waste</span>");

    L.marker([28.5611, 77.3389]).addTo(map)
      .bindPopup("<div class='popup-title'>K. Vance (#REC-9822)</div><div class='popup-sub'>Apt 4B, 128 North St.</div><span class='popup-badge'>12.4 kg Mixed Textiles</span>");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        map.setView([lat, lng], 14);
        L.marker([lat, lng]).addTo(map).bindPopup("<div class='popup-title'>Your Location</div><span class='popup-badge'>Live Position</span>");
      });
    }
  </script>
</body>
</html>`,
    [mapType],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'collector' ? 'Pickup Routes & Map' : 'Donation Map'}
        </Text>
        <TouchableOpacity onPress={() => { try { navigation.navigate('MainTabs', { screen: 'Profile' }); } catch { navigation.navigate('Profile'); } }} activeOpacity={0.7}>
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
          Doorstep pickups currently live in <Text style={styles.boldText}>Noida Sector 15A</Text> and <Text style={styles.boldText}>Noida Sector 44</Text>. Expanding to new sectors soon!
        </Text>
      </View>
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
});

