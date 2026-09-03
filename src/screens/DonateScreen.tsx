import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';

const ITEM_TYPES = [
  { id: 'clothes', label: 'Clothes', icon: 'hanger' },
  { id: 'shoes', label: 'Shoes', icon: 'shoe-sneaker' },
  { id: 'blankets', label: 'Blankets/Bedsheets', icon: 'bed-king-outline' },
  { id: 'bags', label: 'Bags', icon: 'bag-personal-outline' },
];

const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createDonationRequest, rescheduleDonationRequest, fetchSlotAvailability, supabase, calculateRewardForCategory, DonationItem } from '../services/api';
import { TIME_SLOTS, slotToMinutes } from '../constants/timeSlots';
import { theme } from '../theme/theme';

const deriveSelectedItems = (donation?: DonationItem) => {
  if (!donation) return ['clothes'];
  const matched = ITEM_TYPES.filter((i) =>
    donation.category?.split(',').map((c) => c.trim()).includes(i.label)
  ).map((i) => i.id);
  return matched.length > 0 ? matched : ['clothes'];
};

export const DonateScreen = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();

  // Bottom-tab screens stay mounted across tab switches, so deriving `editDonation` straight from
  // `route.params` doesn't reliably clear itself: a sibling tab's listener trying to clear it via
  // `setParams`/`navigate` targets whichever route is *currently focused* unless it explicitly
  // provides this screen's route key as `source` — a value only reliably available from inside
  // this screen itself. So instead this screen clears its own edit session, from inside, the
  // moment it loses focus — see the `blur` listener below.
  const [editDonation, setEditDonation] = useState<DonationItem | undefined>(route?.params?.editDonation);
  const isEditing = Boolean(editDonation);

  const [selectedItems, setSelectedItems] = useState<string[]>(() => deriveSelectedItems(editDonation));
  const [quantity, setQuantity] = useState(editDonation?.weight_kg || 5);
  const [pickupDate, setPickupDate] = useState(getToday());
  const [selectedSlot, setSelectedSlot] = useState(
    editDonation?.time_slot && TIME_SLOTS.includes(editDonation.time_slot) ? editDonation.time_slot : TIME_SLOTS[0]
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [address, setAddress] = useState(editDonation?.address || '');
  const [notes, setNotes] = useState(editDonation?.instructions || '');
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>({ latitude: 28.5833, longitude: 77.3167 });
  const [locating, setLocating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [estimatedPoints, setEstimatedPoints] = useState(0);
  const [adminAvailableSlots, setAdminAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const pickupDayStr = pickupDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const pickupIsToday = isSameDay(pickupDate, getToday());
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const isSlotPast = (slot: string) => pickupIsToday && slotToMinutes(slot) <= nowMinutes;
  const isSlotAdminUnavailable = (slot: string) => adminAvailableSlots.length > 0 && !adminAvailableSlots.includes(slot);
  const isSlotBooked = (slot: string) => bookedSlots.includes(slot);
  const isSlotDisabled = (slot: string) => isSlotPast(slot) || isSlotAdminUnavailable(slot) || isSlotBooked(slot);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      try {
        const { adminAvailableSlots: available, bookedSlots: booked } = await fetchSlotAvailability(
          pickupDayStr,
          editDonation?.id
        );
        if (!cancelled) {
          setAdminAvailableSlots(available);
          setBookedSlots(booked);
        }
      } catch {
        if (!cancelled) {
          setAdminAvailableSlots([]);
          setBookedSlots([]);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pickupDayStr, editDonation?.id]);

  // If the currently selected slot becomes unavailable (date changed, got booked, or fell
  // into the past), fall back to the first still-selectable slot instead of leaving a stale pick.
  React.useEffect(() => {
    if (!isSlotDisabled(selectedSlot)) return;
    const nextAvailable = TIME_SLOTS.find((slot) => !isSlotDisabled(slot));
    if (nextAvailable) setSelectedSlot(nextAvailable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupDayStr, adminAvailableSlots, bookedSlots, pickupIsToday]);

  // Picks up a fresh `editDonation` the moment ProfileScreen navigates here with one (this runs
  // whenever `route.params` actually changes, which does happen reliably for that case — it's
  // specifically the *clearing* of an old one that a differently-scoped `setParams` can't do).
  const routeEditDonationId = route?.params?.editDonation?.id;
  React.useEffect(() => {
    const fresh: DonationItem | undefined = route?.params?.editDonation;
    if (!fresh) return;
    setEditDonation(fresh);
    setSelectedItems(deriveSelectedItems(fresh));
    setQuantity(fresh.weight_kg || 5);
    setPickupDate(getToday());
    setSelectedSlot(fresh.time_slot && TIME_SLOTS.includes(fresh.time_slot) ? fresh.time_slot : TIME_SLOTS[0]);
    setAddress(fresh.address || '');
    setNotes(fresh.instructions || '');
    setCoords({ latitude: 28.5833, longitude: 77.3167 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeEditDonationId]);

  // The definitive reset: the moment this screen loses focus, end its edit session and clear the
  // route param from inside itself (a screen's own `setParams` unambiguously targets its own
  // route — no `source` guesswork needed) so the *next* focus always starts fresh unless
  // ProfileScreen's Edit action just set a new `editDonation`.
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      navigation.setParams({ editDonation: undefined });
      setEditDonation(undefined);
      setSelectedItems(['clothes']);
      setQuantity(5);
      setSelectedSlot(TIME_SLOTS[0]);
      setAddress('');
      setNotes('');
      setCoords({ latitude: 28.5833, longitude: 77.3167 });
    });
    return unsubscribe;
  }, [navigation]);

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  React.useEffect(() => {
    (async () => {
      try {
        if (selectedItems.length === 0) {
          setEstimatedPoints(0);
          return;
        }
        const labels = ITEM_TYPES.filter((i) => selectedItems.includes(i.id)).map((i) => i.label);
        const results = await Promise.all(
          labels.map((label) => calculateRewardForCategory(label, quantity))
        );
        setEstimatedPoints(results.reduce((sum, r) => sum + r.pointsAwarded, 0));
      } catch {}
    })();
  }, [selectedItems, quantity]);

  React.useEffect(() => {
    if (isEditing) return;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { fetchUserProfile } = require('../services/api');
          const p = await fetchUserProfile(user.id);
          if (p?.address) setAddress(p.address);
        }
      } catch {}
    })();
  }, []);

  const handleGetLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission to set your pickup location automatically.');
        setLocating(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setCoords({ latitude: lat, longitude: lng });

      let addressLine = '';
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (place) {
          addressLine = [place.name, place.street, place.district, place.city, place.region, place.postalCode]
            .filter(Boolean)
            .join(', ');
        }
      } catch {
        // reverse geocoding is best-effort; fall back to raw coordinates below
      }

      const formattedAddr = addressLine
        ? `${addressLine} (Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)})`
        : `Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)}`;
      setAddress(formattedAddr);
      Alert.alert('Location Pin Set', `Address set to:\n${formattedAddr}`);
    } catch {
      Alert.alert('Location Error', 'Could not retrieve coordinates. Please enter your address manually.');
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = async () => {
    if (submitting) return;
    if (selectedItems.length === 0) {
      Alert.alert('Select Item Type', 'Please select at least one type of item to donate.');
      return;
    }
    if (isSlotDisabled(selectedSlot)) {
      Alert.alert('Slot No Longer Available', 'Please pick a different pickup time slot.');
      return;
    }
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubmitting(false);
        Alert.alert('Sign In Required', 'Please sign in to schedule a donation pickup.');
        navigation.navigate('Login');
        return;
      }

      const itemLabel = ITEM_TYPES.filter((i) => selectedItems.includes(i.id))
        .map((i) => i.label)
        .join(', ') || 'Household Items';
      const dayStr = pickupDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = selectedSlot;

      if (isEditing && editDonation) {
        await rescheduleDonationRequest(editDonation.id, {
          category: itemLabel,
          weight_kg: quantity,
          pickup_day: dayStr,
          time_slot: timeStr,
          instructions: notes || 'Doorstep pickup',
          address: address.trim() || 'Address not specified',
        });
        setSubmitting(false);
        Alert.alert('Pickup Updated', 'Your donation pickup request has been updated!');
        navigation.navigate('Profile');
        return;
      }

      await createDonationRequest(
        {
          category: itemLabel,
          weight_kg: quantity,
          pickup_day: dayStr,
          time_slot: timeStr,
          instructions: notes || 'Doorstep pickup',
          address: address.trim() || 'Address not specified',
        },
        user.id
      );
      setSubmitting(false);
      Alert.alert('Pickup Requested', 'Your donation pickup request has been submitted and is awaiting collector confirmation!');
      navigation.navigate('Home');
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert('Error Scheduling Pickup', err?.message || 'Could not save donation request. Please try again.');
    }
  };

  const handleMapMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.error) {
        console.log('[Donate map WebView]', data.error);
        return;
      }
      if (data?.lat && data?.lng) {
        const lat = data.lat;
        const lng = data.lng;
        setCoords({ latitude: lat, longitude: lng });

        let addressLine = '';
        try {
          const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (place) {
            addressLine = [place.name, place.street, place.district, place.city, place.region, place.postalCode]
              .filter(Boolean)
              .join(', ');
          }
        } catch {
          // reverse geocoding is best-effort; fall back to raw coordinates below
        }

        const updatedAddr = addressLine
          ? `${addressLine} (Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)})`
          : `Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)}`;
        setAddress(updatedAddr);
      }
    } catch {}
  };

  const leafletHtml = coords ? `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html { margin:0; padding:0; height:100%; width:100%; background: ${theme.colors.background}; }
        #map { width:100%; height:100%; border-radius:14px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Surfaces otherwise-silent errors in this inline script — a WebView's JS errors
        // are invisible to RN by default, and a single uncaught error here silently halts
        // map setup entirely (see PickupMapScreen.tsx for a real example of this).
        window.onerror = function(msg, url, line) {
          if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({ error: msg + ' @ line ' + line }));
        };

        // Leaflet auto-detects its default marker icon path from the <script> tag's own
        // URL, which fails when the page is loaded from an inline HTML string — without
        // this the draggable pin renders with no visible icon at all.
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        var map = L.map('map', { zoomControl: true }).setView([${coords.latitude}, ${coords.longitude}], 16);

        var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 });
        var esriSat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 });
        ${mapType === 'satellite' ? 'esriSat' : 'osm'}.addTo(map);

        var marker = L.marker([${coords.latitude}, ${coords.longitude}], { draggable: true }).addTo(map);
        marker.bindPopup('Tap map or drag pin to select pickup location').openPopup();

        function sendCoords(lat, lng) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: lat, lng: lng }));
          }
        }

        map.on('click', function(e) {
          marker.setLatLng(e.latlng);
          sendCoords(e.latlng.lat, e.latlng.lng);
        });

        marker.on('dragend', function(e) {
          var pos = marker.getLatLng();
          sendCoords(pos.lat, pos.lng);
        });
      </script>
    </body>
    </html>
  ` : '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Pickup' : 'Schedule'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color={theme.colors.textInverse} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconBg}>
            <Icon name="hand-heart" size={32} color={theme.colors.secondary} />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>{isEditing ? 'Update your pickup.' : 'Give back.'}</Text>
            <Text style={styles.bannerSubtitle}>
              {isEditing ? 'Change items, quantity, schedule, or address.' : 'Schedule your doorstep pickup.'}
            </Text>
          </View>
        </View>

        {/* Type of Items */}
        <Text style={styles.sectionLabel}>TYPE OF ITEMS (SELECT ALL THAT APPLY)</Text>
        <View style={styles.itemsGrid}>
          {ITEM_TYPES.map((item) => {
            const isSelected = selectedItems.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                onPress={() => toggleItem(item.id)}
                activeOpacity={0.8}
              >
                <Icon
                  name={item.icon}
                  size={22}
                  color={isSelected ? theme.colors.primary : theme.colors.text}
                />
                <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                  {item.label}
                </Text>
                <View style={[styles.itemCheckbox, isSelected && styles.itemCheckboxSelected]}>
                  {isSelected && <Icon name="check" size={12} color={theme.colors.textInverse} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Estimated Quantity */}
        <Text style={styles.sectionLabel}>ESTIMATED QUANTITY (KG)</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}
            activeOpacity={0.7}
          >
            <Icon name="minus" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity} kg</Text>
          <TouchableOpacity
            style={styles.quantityBtn}
            onPress={() => setQuantity(quantity + 1)}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Pickup Date & Time */}
        <Text style={styles.sectionLabel}>PICKUP DATE & TIME</Text>
        <Text style={styles.helperText}>Pickups are available today onwards, between 11:00 AM - 6:00 PM.</Text>
        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <Icon name="calendar-month-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.pickerBtnText}>
              {pickupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowSlotPicker(true)} activeOpacity={0.7}>
            <Icon name="clock-outline" size={18} color={theme.colors.primary} />
            <Text style={styles.pickerBtnText}>{selectedSlot}</Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={pickupDate}
            mode="date"
            display="default"
            minimumDate={getToday()}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setPickupDate(date);
            }}
          />
        )}

        {/* Time Slot Picker Modal */}
        <Modal
          visible={showSlotPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowSlotPicker(false)}
        >
          <View style={styles.slotModalOverlay}>
            <View style={styles.slotModalCard}>
              <View style={styles.slotModalHeader}>
                <Text style={styles.slotModalTitle}>Select Pickup Slot</Text>
                <TouchableOpacity onPress={() => setShowSlotPicker(false)} activeOpacity={0.8}>
                  <Icon name="close" size={22} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              {loadingSlots ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
              ) : (
                <ScrollView contentContainerStyle={styles.slotGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = slot === selectedSlot;
                    const disabled = isSlotDisabled(slot);
                    const statusLabel = isSlotPast(slot)
                      ? null
                      : isSlotBooked(slot)
                        ? 'Booked'
                        : isSlotAdminUnavailable(slot)
                          ? 'Unavailable'
                          : null;
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.slotChip,
                          isSelected && styles.slotChipSelected,
                          disabled && styles.slotChipDisabled,
                        ]}
                        onPress={() => {
                          if (disabled) return;
                          setSelectedSlot(slot);
                          setShowSlotPicker(false);
                        }}
                        disabled={disabled}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.slotChipText,
                            isSelected && styles.slotChipTextSelected,
                            disabled && styles.slotChipTextDisabled,
                          ]}
                        >
                          {slot}
                        </Text>
                        {statusLabel && <Text style={styles.slotChipStatus}>{statusLabel}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Pickup Address */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <Text style={[styles.sectionLabel, { marginTop: 0, marginBottom: 0 }]}>PICKUP ADDRESS</Text>
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={handleGetLocation}
            disabled={locating}
            activeOpacity={0.8}
          >
            <Icon name="crosshairs-gps" size={16} color={theme.colors.primary} />
            <Text style={styles.locationBtnText}>{locating ? 'Detecting...' : 'Use Current Location'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.textareaContainer}>
          <TextInput
            placeholder="Enter doorstep pickup address"
            placeholderTextColor={theme.colors.textSecondary}
            value={address}
            onChangeText={setAddress}
            style={[styles.textarea, { height: 60 }]}
          />
        </View>

        {/* Leaflet Map Preview */}
        {coords && (
          <View style={styles.mapPreviewContainer}>
            <WebView
              originWhitelist={['*']}
              source={{ html: leafletHtml }}
              style={styles.mapWebView}
              scrollEnabled={false}
              onMessage={handleMapMessage}
            />
            <TouchableOpacity
              style={styles.expandOverlayBtn}
              onPress={() => setShowMapModal(true)}
              activeOpacity={0.85}
            >
              <Icon name="fullscreen" size={16} color={theme.colors.textInverse} />
              <Text style={styles.expandOverlayBtnText}>Expand Map</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Fullscreen Map Modal */}
        <Modal
          visible={showMapModal}
          animationType="slide"
          onRequestClose={() => setShowMapModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: theme.colors.text }}>
            <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 14) }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Pickup Location Map</Text>
                <Text style={styles.modalSub} numberOfLines={2}>{address || 'Selected Location'}</Text>
              </View>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowMapModal(false)} activeOpacity={0.8}>
                <Icon name="close" size={24} color={theme.colors.textInverse} />
              </TouchableOpacity>
            </View>

            <View style={styles.mapTypeToggleRow}>
              <View style={styles.mapTypeToggleGroup}>
                <TouchableOpacity
                  style={[styles.mapTypeToggleBtn, mapType === 'street' && styles.mapTypeToggleBtnActive]}
                  onPress={() => setMapType('street')}
                >
                  <Text style={[styles.mapTypeToggleText, mapType === 'street' && styles.mapTypeToggleTextActive]}>
                    Street
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.mapTypeToggleBtn, mapType === 'satellite' && styles.mapTypeToggleBtnActive]}
                  onPress={() => setMapType('satellite')}
                >
                  <Text style={[styles.mapTypeToggleText, mapType === 'satellite' && styles.mapTypeToggleTextActive]}>
                    Satellite
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flex: 1 }}>
              {coords && (
                <WebView
                  originWhitelist={['*']}
                  source={{ html: leafletHtml }}
                  style={{ flex: 1 }}
                  onMessage={handleMapMessage}
                />
              )}
            </View>

            <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <TouchableOpacity style={styles.confirmMapLocationBtn} onPress={() => setShowMapModal(false)} activeOpacity={0.85}>
                <Icon name="check" size={20} color={theme.colors.textInverse} />
                <Text style={styles.confirmMapLocationText}>Confirm Location Pin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Notes (Optional) */}
        <Text style={styles.sectionLabel}>NOTES (OPTIONAL)</Text>
        <View style={styles.textareaContainer}>
          <TextInput
            placeholder="Access instructions, quantity, etc."
            placeholderTextColor={theme.colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />
        </View>

        {/* Estimated Points Banner */}
        {estimatedPoints > 0 && (
          <View style={styles.pointsBanner}>
            <View style={styles.pointsIconBg}>
              <Icon name="star-four-points" size={24} color={theme.colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pointsBannerTitle}>Estimated Reward</Text>
              <Text style={styles.pointsBannerSub}>You will earn ~{estimatedPoints} points for this donation.</Text>
            </View>
          </View>
        )}

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
          activeOpacity={0.8}
        >
          <Icon name="check-circle-outline" size={20} color={theme.colors.secondary} />
          <Text style={styles.confirmBtnText}>
            {submitting ? (isEditing ? 'Updating...' : 'Scheduling...') : isEditing ? 'Update pickup' : 'Confirm pickup'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Semi-transparent Loading Overlay */}
      {submitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingTitle}>{isEditing ? 'Updating Pickup...' : 'Scheduling Pickup...'}</Text>
            <Text style={styles.loadingSub}>Saving your donation request</Text>
          </View>
        </View>
      )}
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
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: theme.colors.textInverse,
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.xl,
    padding: 20,
    marginBottom: 24,
  },
  bannerIconBg: {
    marginRight: 16,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 24,
    color: theme.colors.textInverse,
  },
  bannerSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.82)',
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 10.5,
    color: theme.colors.clay,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  itemCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: 12,
    gap: 8,
  },
  itemCardSelected: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  itemText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: theme.colors.text,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    flexWrap: 'wrap',
  },
  itemTextSelected: {
    color: theme.colors.primary,
  },
  itemCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemCheckboxSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  quantityBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: theme.colors.text,
  },
  helperText: {
    fontFamily: theme.fonts.body,
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    marginBottom: 12,
    marginTop: -4,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  slotModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 42, 34, 0.5)',
    justifyContent: 'flex-end',
  },
  slotModalCard: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: 20,
    maxHeight: '70%',
  },
  slotModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  slotModalTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 17,
    color: theme.colors.text,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 12,
  },
  slotChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  slotChipSelected: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  slotChipDisabled: {
    backgroundColor: theme.colors.surfaceContainer,
    borderColor: theme.colors.border,
    opacity: 0.5,
  },
  slotChipText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: theme.colors.text,
  },
  slotChipTextDisabled: {
    color: theme.colors.textSecondary,
  },
  slotChipStatus: {
    fontFamily: theme.fonts.body,
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  slotChipTextSelected: {
    color: theme.colors.primary,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    gap: 8,
  },
  pickerBtnText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: theme.colors.text,
  },
  textareaContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 28,
  },
  textarea: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  locationBtnText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    color: theme.colors.primary,
  },
  mapPreviewContainer: {
    height: 180,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  mapWebView: {
    flex: 1,
    borderRadius: 18,
  },
  expandOverlayBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(30, 42, 34, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandOverlayBtnText: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textInverse,
    fontSize: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  modalTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 17,
    color: theme.colors.textInverse,
  },
  modalSub: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  mapTypeToggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mapTypeToggleGroup: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 16,
    padding: 2,
  },
  mapTypeToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  mapTypeToggleBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  mapTypeToggleText: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
  },
  mapTypeToggleTextActive: {
    color: theme.colors.surface,
  },
  modalFooter: {
    backgroundColor: theme.colors.text,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  confirmMapLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.radius.full,
    height: 52,
    gap: 8,
  },
  confirmMapLocationText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.textInverse,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.text,
    borderRadius: theme.radius.full,
    height: 52,
    gap: 10,
    marginBottom: 24,
  },
  confirmBtnText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.textInverse,
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30, 42, 34, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  loadingCard: {
    width: '80%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  loadingTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 17,
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  loadingSub: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  pointsIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsBannerTitle: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: '#92400E',
    marginBottom: 2,
  },
  pointsBannerSub: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#B45309',
  },
});

