import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
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
import { getStatusLabel } from '../services/api';
import { theme } from '../theme/theme';

export const PickupMapScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { donations, authUser, serviceablePincodes } = useAppData();
  const [locationGranted, setLocationGranted] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [areaPincode, setAreaPincode] = useState<string>('all');
  const [areaPickerOpen, setAreaPickerOpen] = useState(false);

  const mode = route.params?.mode === 'admin' ? 'admin' : 'user';
  const targetDonationId = route.params?.donationId;
  // This screen is registered both as the "Map" tab (TabNavigator.tsx) and as the
  // "PickupMap" stack screen (AppNavigator.tsx, pushed from "Track this pickup" flows) —
  // route.name tells us which one we're rendered as, so the back arrow only shows when
  // we're a pushed stack screen and goBack() actually makes sense.
  const isTabRoot = route.name === 'Map';

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
    if (mode !== 'admin') {
      // Donor mode must only ever plot the current donor's own pickups — never other
      // donors' addresses.
      return donations.filter((d) => d.donor_id === authUser?.id);
    }
    // Completed pickups are deliberately excluded — marking a pickup done removes its pin.
    const active = donations.filter((d) => d.status !== 'completed' && d.status !== 'cancelled');
    const confirmed = active.filter((d) => ['assigned', 'in_transit'].includes(d.status));
    const base = confirmed.length > 0 ? confirmed : active;
    return areaPincode === 'all' ? base : base.filter((d) => d.pincode === areaPincode);
  }, [donations, mode, authUser?.id, areaPincode]);

  // All orders (any status) in the selected area — not just the confirmed/mapped subset —
  // so the admin can see everything happening in that pincode, not only what's pinned.
  const areaOrders = useMemo(() => {
    if (mode !== 'admin' || areaPincode === 'all') return [];
    return donations.filter((d) => d.pincode === areaPincode && d.status !== 'cancelled');
  }, [donations, mode, areaPincode]);

  // Falls back to the donor's most recently active pickup when no explicit donationId is
  // given (e.g. opened from the Map tab rather than "Track this pickup").
  const targetDonation =
    donations.find((d) => d.id === targetDonationId) ||
    (mode === 'user' ? confirmedDonations[0] : undefined);

  const initialCenter = targetDonation ? parseCoords(targetDonation.address) : { lat: 28.5833, lng: 77.3167 };

  const showEmptyState = mode === 'user' && confirmedDonations.length === 0;

  const markersJs = useMemo(() => {
    if (!confirmedDonations || confirmedDonations.length === 0) {
      if (mode === 'user') return '';
      return `L.marker([28.5833, 77.3167]).addTo(map).bindPopup("<div class='popup-title'>Sector 15A Center</div>");`;
    }

    return confirmedDonations
      .map((item) => {
        const { lat, lng } = parseCoords(item.address);
        const cleanAddress = item.address.replace(/\(Lat:.*?\)/gi, '').trim();
        const isTarget = item.id === targetDonationId;
        const weight = item.weight_kg || item.estimated_quantity_kg || 10;
        const donorLabel = (item.donor_name || `${item.category} Donor`).replace(/"/g, '\\"');
        const phoneLabel = item.donor_phone ? ` &bull; ${item.donor_phone}` : '';
        return `
          (function() {
            var marker = L.marker([${lat}, ${lng}]).addTo(map)
              .bindPopup("<div class='popup-title'>${donorLabel}</div><div class='popup-sub'>${cleanAddress.replace(/"/g, '\\"')}${phoneLabel}</div><span class='popup-badge'>${item.category} &bull; ${weight} kg &bull; ${item.time_slot} &bull; ${getStatusLabel(item.status).toUpperCase()}</span>");
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
    html, body, #map { height: 100%; margin: 0; padding: 0; background: ${theme.colors.background}; }
    .leaflet-popup-content-wrapper { border-radius: 16px; padding: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .popup-title { font-size: 14px; font-weight: 800; color: ${theme.colors.text}; margin-bottom: 2px; }
    .popup-sub { font-size: 12px; color: ${theme.colors.textSecondary}; margin-bottom: 6px; }
    .popup-badge { display: inline-block; background: ${theme.colors.primaryContainer}; color: ${theme.colors.primary}; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    // Surfaces otherwise-silent errors in this inline script to the RN console (there's no
    // other way to see a WebView's JS errors here) — this is how the "theme is not defined"
    // bug below was actually found, since it silently halted the whole script before any
    // markers were ever drawn.
    window.onerror = function(msg, url, line) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage('JS ERROR: ' + msg + ' @ line ' + line);
    };

    // Leaflet auto-detects its default marker icon path from the <script> tag's own URL,
    // which fails when the page is loaded from an inline HTML string (no real page URL) —
    // without this, markers render with no visible icon at all.
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

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
    L.circle([28.5833, 77.3167], { color: '${theme.colors.primary}', fillColor: '${theme.colors.primaryContainer}', fillOpacity: 0.2, radius: 700 }).addTo(map);

    // Dynamic Real Donor Markers from Supabase
    ${markersJs}
  </script>
</body>
</html>`,
    [mapType, initialCenter.lat, initialCenter.lng, markersJs, targetDonation],
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header Bar */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        {isTabRoot ? (
          <View style={styles.backBtn} />
        ) : (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Icon name="arrow-left" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>
          {mode === 'admin' ? 'Pickup Routes & Map' : 'Donation Map'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            if (mode === 'admin') {
              navigation.navigate('CollectorProfile');
              return;
            }
            try {
              navigation.navigate('MainTabs', { screen: 'Profile' });
            } catch {
              navigation.navigate('Profile');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.surface} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Map Control Bar */}
      <View style={styles.mapControlBar}>
        {mode === 'admin' ? (
          <TouchableOpacity
            style={styles.zoneChip}
            onPress={() => setAreaPickerOpen(true)}
            activeOpacity={0.8}
          >
            <Icon name="map-marker-check" size={16} color={theme.colors.primary} />
            <Text style={styles.zoneChipText}>
              {areaPincode === 'all' ? 'All Areas' : areaPincode}
            </Text>
            <Icon name="chevron-down" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.zoneChip}>
            <Icon name="map-marker-check" size={16} color={theme.colors.primary} />
            <Text style={styles.zoneChipText}>Noida Sector 15A & 44</Text>
          </View>
        )}

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

      {mode === 'admin' && (
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
      )}

      {/* Mode Specific Info Banner */}
      {mode === 'admin' && !targetDonationId && (
        <View style={styles.promptBanner}>
          <Icon name="information-outline" size={20} color={theme.colors.primary} />
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
            <Icon name="navigation" size={20} color={theme.colors.surface} />
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
          onMessage={(e) => console.log('[PickupMap WebView]', e.nativeEvent.data)}
          style={styles.map}
        />
        {showEmptyState && (
          <View style={styles.emptyStateOverlay} pointerEvents="box-none">
            <View style={styles.emptyStateCard}>
              <Icon name="map-marker-off-outline" size={32} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>No pickups yet</Text>
              <Text style={styles.emptyStateSub}>
                Schedule a donation and its pickup location will show up here.
              </Text>
              <TouchableOpacity
                style={styles.emptyStateBtn}
                activeOpacity={0.85}
                onPress={() => {
                  try {
                    navigation.navigate('MainTabs', { screen: 'Donate' });
                  } catch {
                    navigation.navigate('Donate');
                  }
                }}
              >
                <Text style={styles.emptyStateBtnText}>Schedule a Pickup</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Orders in the selected area */}
      {mode === 'admin' && areaPincode !== 'all' && (
        <View style={styles.areaOrdersPanel}>
          <Text style={styles.areaOrdersTitle}>
            ORDERS IN {areaPincode} ({areaOrders.length})
          </Text>
          {areaOrders.length === 0 ? (
            <Text style={styles.areaOrdersEmpty}>No orders in this pincode yet.</Text>
          ) : (
            <ScrollView style={styles.areaOrdersList} showsVerticalScrollIndicator={false}>
              {areaOrders.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.areaOrderRow}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('PickupMap', { mode: 'admin', donationId: item.id })}
                >
                  <View style={styles.areaOrderIconBg}>
                    <Icon name="package-variant-closed" size={16} color={theme.colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.areaOrderTitle} numberOfLines={1}>
                      {item.donor_name || item.category || 'Donation'} · {item.category} · {item.weight_kg || item.estimated_quantity_kg || 10} kg
                    </Text>
                    <Text style={styles.areaOrderSub} numberOfLines={1}>
                      {item.address.replace(/\(Lat:.*?\)/gi, '').trim()}
                      {item.donor_phone ? ` · ${item.donor_phone}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.areaOrderStatus}>{getStatusLabel(item.status).toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Info Banner */}
      {mode === 'user' && (
        <View style={styles.bottomInfoPanel}>
          <Text style={styles.infoHeading}>YOUR PICKUP ACTIVITY</Text>
          <Text style={styles.infoBody}>
            {confirmedDonations.length === 0
              ? 'No scheduled pickups yet.'
              : `You have ${confirmedDonations.length} pickup${confirmedDonations.length === 1 ? '' : 's'} shown on the map above.`}
          </Text>
        </View>
      )}

      {/* Bottom Navigation Tab Bar for Collector */}
      {mode === 'admin' && (
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('CollectorDashboard')}>
            <Icon name="truck" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.tabLabel}>Routes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7}>
            <View style={styles.tabIconActiveBg}>
              <Icon name="map" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.tabLabelActive}>Map</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('AdminAvailability')}>
            <Icon name="calendar-month-outline" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.tabLabel}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} activeOpacity={0.7} onPress={() => navigation.navigate('CollectorProfile')}>
            <Icon name="account-outline" size={24} color={theme.colors.textSecondary} />
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
    fontSize: 20,
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
  mapControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  zoneChipText: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 16,
    padding: 2,
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleBtnText: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: theme.colors.surface,
  },
  mapFrame: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  emptyStateOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginTop: 10,
  },
  emptyStateSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
  },
  emptyStateBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyStateBtnText: {
    fontSize: 13,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
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
  areaOrdersPanel: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: 220,
  },
  areaOrdersTitle: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  areaOrdersEmpty: {
    fontSize: 13,
    fontFamily: theme.fonts.body,
    color: theme.colors.textSecondary,
    paddingBottom: 12,
  },
  areaOrdersList: {
    maxHeight: 180,
  },
  areaOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  areaOrderIconBg: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaOrderTitle: {
    fontSize: 13,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  areaOrderSub: {
    fontSize: 11,
    fontFamily: theme.fonts.body,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  areaOrderStatus: {
    fontSize: 9,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
    letterSpacing: 0.3,
  },
  bottomInfoPanel: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: 16,
  },
  infoHeading: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoBody: {
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  promptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.warning,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  promptTitle: {
    fontSize: 13,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.warning,
  },
  promptSub: {
    fontSize: 11,
    color: theme.colors.warning,
    marginTop: 2,
    lineHeight: 15,
  },
  promptActionBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  promptActionText: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
  },
  targetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  targetIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetTitle: {
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.success,
  },
  targetAddress: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.success,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
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

