import React, { useState, useCallback } from 'react';
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
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
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

const addDays = (d: Date, n: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createDonationRequest, rescheduleDonationRequest, fetchSlotAvailability, fetchUserProfile, updateUserProfile, submitAreaRequest, supabase, DonationItem } from '../services/api';
import { TIME_SLOTS, slotToMinutes } from '../constants/timeSlots';
import { useTimeSlots } from '../hooks/useTimeSlots';
import { isServiceablePincode } from '../utils/serviceability';
import { toDayKey } from '../utils/dayKey';
import { stripAddressMeta } from '../utils/address';
import { useAppData } from '../data/AppDataContext';
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
  const { serviceablePincodes, refreshProfile } = useAppData();

  // Bottom-tab screens stay mounted across tab switches, so deriving `editDonation` straight from
  // `route.params` doesn't reliably clear itself: a sibling tab's listener trying to clear it via
  // `setParams`/`navigate` targets whichever route is *currently focused* unless it explicitly
  // provides this screen's route key as `source` — a value only reliably available from inside
  // this screen itself. So instead this screen clears its own edit session, from inside, the
  // moment it loses focus — see the `blur` listener below.
  const [editDonation, setEditDonation] = useState<DonationItem | undefined>(route?.params?.editDonation);
  const isEditing = Boolean(editDonation);
  const timeSlots = useTimeSlots();

  const [selectedItems, setSelectedItems] = useState<string[]>(() => deriveSelectedItems(editDonation));
  const [quantity, setQuantity] = useState(editDonation?.weight_kg || 5);
  const [pickupDate, setPickupDate] = useState(getToday());
  const [weekStart, setWeekStart] = useState(getToday());
  const [selectedSlot, setSelectedSlot] = useState(
    editDonation?.time_slot && TIME_SLOTS.includes(editDonation.time_slot) ? editDonation.time_slot : TIME_SLOTS[0]
  );
  const [addressLine1, setAddressLine1] = useState(stripAddressMeta(editDonation?.address || ''));
  const [addressLine2, setAddressLine2] = useState('');
  const displayAddress = [addressLine1, addressLine2].filter(Boolean).join(', ');
  const [notes, setNotes] = useState(editDonation?.instructions || '');
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>({ latitude: 28.5833, longitude: 77.3167 });
  const [locating, setLocating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [adminAvailableSlots, setAdminAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [seatsLeft, setSeatsLeft] = useState<Record<string, number>>({});
  const [dayClosed, setDayClosed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [pincode, setPincode] = useState('');
  const [pincodeVerified, setPincodeVerified] = useState(false);
  const [showPincodeModal, setShowPincodeModal] = useState(false);
  const [pincodeInput, setPincodeInput] = useState('');
  const [pincodeError, setPincodeError] = useState('');
  const [checkingPincode, setCheckingPincode] = useState(false);
  // Set when the entered pincode isn't serviceable — offers to save a waitlist request.

  const pickupDayStr = pickupDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const pickupDayKey = toDayKey(pickupDate);
  const isFocused = useIsFocused();
  const pickupIsToday = isSameDay(pickupDate, getToday());
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const isSlotPast = (slot: string) => pickupIsToday && slotToMinutes(slot) <= nowMinutes;
  const isSlotAdminUnavailable = (slot: string) => adminAvailableSlots.length > 0 && !adminAvailableSlots.includes(slot);
  const isSlotBooked = (slot: string) => bookedSlots.includes(slot);
  const isSlotDisabled = (slot: string) => dayClosed || isSlotPast(slot) || isSlotAdminUnavailable(slot) || isSlotBooked(slot);

  const weekDays = React.useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  React.useEffect(() => {
    if (!pincode || !isFocused) return;
    let cancelled = false;

    const loadSlots = async (showSpinner: boolean) => {
      if (showSpinner) setLoadingSlots(true);
      try {
        const { availableSlots, bookedSlots: booked, isClosed, seatsLeft: seats } = await fetchSlotAvailability(
          pincode,
          pickupDayKey,
          pickupDayStr,
          editDonation?.id
        );
        if (!cancelled) {
          setAdminAvailableSlots(availableSlots);
          setBookedSlots(booked);
          setSeatsLeft(seats);
          setDayClosed(isClosed);
        }
      } catch {
        if (!cancelled && showSpinner) {
          setAdminAvailableSlots([]);
          setBookedSlots([]);
          setSeatsLeft({});
          setDayClosed(false);
        }
      } finally {
        if (!cancelled && showSpinner) setLoadingSlots(false);
      }
    };

    loadSlots(true);
    // Admin availability can change at any moment while a donor has this screen open — poll
    // every 12s (no spinner, so it doesn't flicker the UI) so admin edits show up without the
    // donor needing to leave and reopen the screen.
    const interval = setInterval(() => loadSlots(false), 12000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pincode, pickupDayKey, pickupDayStr, editDonation?.id, isFocused]);

  // Recenters the map on the verified pincode's own area (via OSM Nominatim) rather than
  // leaving it on the hardcoded Noida default — whenever the pincode changes (including the
  // donor changing it), the map should only show that area. A subsequent precise pin (GPS or
  // manual drag) still overrides this via the other setCoords calls below.
  React.useEffect(() => {
    if (!pincode) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(pincode)}&country=India&format=json&limit=1`
        );
        const results = await res.json();
        const first = Array.isArray(results) ? results[0] : null;
        if (!cancelled && first?.lat && first?.lon) {
          setCoords({ latitude: parseFloat(first.lat), longitude: parseFloat(first.lon) });
        }
      } catch {
        // Falls back to whatever coords are already set — no network / geocoder unavailable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pincode]);

  // If the currently selected slot becomes unavailable (date changed, got booked, or fell
  // into the past), fall back to the first still-selectable slot instead of leaving a stale pick.
  React.useEffect(() => {
    if (timeSlots.includes(selectedSlot) && !isSlotDisabled(selectedSlot)) return;
    const nextAvailable = timeSlots.find((slot) => !isSlotDisabled(slot));
    if (nextAvailable) setSelectedSlot(nextAvailable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupDayStr, adminAvailableSlots, bookedSlots, dayClosed, pickupIsToday, timeSlots]);

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
    setWeekStart(getToday());
    setSelectedSlot(fresh.time_slot && TIME_SLOTS.includes(fresh.time_slot) ? fresh.time_slot : TIME_SLOTS[0]);
    setAddressLine1(stripAddressMeta(fresh.address || ''));
    setAddressLine2('');
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
      setAddressLine1('');
      setAddressLine2('');
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

  // Re-confirms serviceability every time the Donate screen is opened, rather than only once —
  // an admin can change service areas, and a saved pincode from months ago shouldn't be trusted
  // silently forever.
  useFocusEffect(
    useCallback(() => {
      if (isEditing) {
        setPincode(editDonation?.pincode || serviceablePincodes[0] || '');
        setPincodeVerified(true);
        return;
      }
      setPincodeVerified(false);
      setPincode('');
      (async () => {
        let prefillPincode = '';
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const p = await fetchUserProfile(user.id);
            if (p?.address) setAddressLine1(stripAddressMeta(p.address));
            if (p?.pincode) prefillPincode = p.pincode;
          }
        } catch {}
        setPincodeInput(prefillPincode);
        setPincodeError('');
        setShowPincodeModal(true);
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing])
  );

  const handleCheckPincode = async () => {
    if (pincodeInput.length !== 6) {
      setPincodeError('Please enter a valid 6-digit pincode.');
      return;
    }
    if (!isServiceablePincode(pincodeInput, serviceablePincodes)) {
      setPincodeError('PunahChakra pickup is currently unavailable in your area. We’re working to expand our service and hope to reach you soon.');
      // Log the attempt so the admin sees which pincodes people are asking for (Areas → requests).
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) submitAreaRequest(user.id, { pincode: pincodeInput }).catch(() => {});
      }).catch(() => {});
      return;
    }
    setCheckingPincode(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await updateUserProfile(user.id, { pincode: pincodeInput });
        refreshProfile().catch(() => {});
      }
    } catch {
      // Best-effort save — serviceability has already been confirmed locally, so proceed regardless.
    }
    setCheckingPincode(false);
    setPincode(pincodeInput);
    setPincodeVerified(true);
    setShowPincodeModal(false);
  };

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

      // Android surfaces whether this fix came from a mock-location provider (a
      // spoofing app, or a test/emulator location left set from a previous session) —
      // when it does, the coordinates are meaningless and shouldn't be trusted.
      if (Platform.OS === 'android' && position.mocked) {
        Alert.alert(
          'Mock Location Detected',
          'Your device is returning a simulated location (a mock-location app or a test GPS setting is active), not your real position. Turn off mock locations in Developer Options, or enter your pickup address manually.'
        );
        setLocating(false);
        return;
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setCoords({ latitude: lat, longitude: lng });

      // Note: the detected pincode is intentionally not used to overwrite the address's pincode —
      // that's already been verified as serviceable via the pincode-check modal, and trusting the
      // (sometimes imprecise) reverse-geocoded postal code here instead was showing donors and
      // collectors a pincode that didn't match what was actually verified.
      let line1 = '';
      let line2 = '';
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (place) {
          line1 = [place.name, place.street].filter(Boolean).join(', ');
          line2 = [place.district, place.city, place.region].filter(Boolean).join(', ');
        }
      } catch {
        // reverse geocoding is best-effort; fall back to raw coordinates below
      }

      if (line1 || line2) {
        setAddressLine1(line1);
        setAddressLine2(line2);
        Alert.alert('Location Pin Set', `Address set to:\n${[line1, line2].filter(Boolean).join(', ')}`);
      } else {
        setAddressLine1(`Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)}`);
        Alert.alert('Location Pin Set', 'Could not detect a street address — coordinates saved. Please edit the address lines manually.');
      }
    } catch {
      Alert.alert('Location Error', 'Could not retrieve coordinates. Please enter your address manually.');
    } finally {
      setLocating(false);
    }
  };

  const handleConfirm = async () => {
    if (submitting) return;
    if (!pincodeVerified) {
      setShowPincodeModal(true);
      return;
    }
    if (selectedItems.length === 0) {
      Alert.alert('Select Item Type', 'Please select at least one type of item to donate.');
      return;
    }
    if (!addressLine1.trim()) {
      Alert.alert('Address Required', 'Please enter your pickup address.');
      return;
    }
    if (isSlotDisabled(selectedSlot)) {
      Alert.alert('Slot No Longer Available', 'Please pick a different pickup time slot.');
      return;
    }
    // Last-moment re-check: another donor may have taken the final seat since the slots last
    // refreshed. (Best-effort — there is no database-level seat limit, so two taps in the same
    // instant can still both succeed.)
    try {
      const fresh = await fetchSlotAvailability(pincode, pickupDayKey, pickupDayStr, editDonation?.id);
      setBookedSlots(fresh.bookedSlots);
      setSeatsLeft(fresh.seatsLeft);
      setDayClosed(fresh.isClosed);
      if (fresh.isClosed || fresh.bookedSlots.includes(selectedSlot)) {
        Alert.alert('Slot No Longer Available', 'That time slot just filled up. Please pick a different one.');
        return;
      }
    } catch {
      // Couldn't re-check — fall through and let the booking proceed on the last known state.
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
      const addressParts = [addressLine1.trim(), addressLine2.trim(), pincode].filter(Boolean);
      const fullAddress = coords
        ? `${addressParts.join(', ')} (Lat: ${coords.latitude.toFixed(4)}, Long: ${coords.longitude.toFixed(4)})`
        : addressParts.join(', ');

      if (isEditing && editDonation) {
        await rescheduleDonationRequest(editDonation.id, {
          category: itemLabel,
          weight_kg: quantity,
          pickup_day: dayStr,
          time_slot: timeStr,
          instructions: notes || 'Doorstep pickup',
          address: fullAddress,
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
          address: fullAddress,
          pincode,
        },
        user.id
      );
      setSubmitting(false);
      Alert.alert('Pickup Scheduled', 'Your donation pickup has been scheduled!');
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

        let line1 = '';
        let line2 = '';
        try {
          const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (place) {
            line1 = [place.name, place.street].filter(Boolean).join(', ');
            line2 = [place.district, place.city, place.region].filter(Boolean).join(', ');
          }
        } catch {
          // reverse geocoding is best-effort; fall back to raw coordinates below
        }

        if (line1 || line2) {
          setAddressLine1(line1);
          setAddressLine2(line2);
        } else {
          setAddressLine1(`Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)}`);
        }
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
        <Text style={styles.helperText}>Pickups are available between 11:00 AM - 5:30 PM.</Text>

        {/* Week strip */}
        <View style={styles.weekNavRow}>
          <TouchableOpacity
            style={styles.weekNavBtn}
            onPress={() => setWeekStart((w) => (w > getToday() ? addDays(w, -7) : w))}
            disabled={weekStart <= getToday()}
            activeOpacity={0.7}
          >
            <Icon
              name="chevron-left"
              size={20}
              color={weekStart <= getToday() ? theme.colors.border : theme.colors.primary}
            />
          </TouchableOpacity>
          <Text style={styles.weekNavLabel}>
            {weekStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            style={styles.weekNavBtn}
            onPress={() => setWeekStart((w) => addDays(w, 7))}
            activeOpacity={0.7}
          >
            <Icon name="chevron-right" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekStripRow}>
          {weekDays.map((day) => {
            const isPast = day < getToday();
            const isSelected = isSameDay(day, pickupDate);
            return (
              <TouchableOpacity
                key={day.toISOString()}
                style={[styles.dayChip, isSelected && styles.dayChipSelected, isPast && styles.dayChipDisabled]}
                onPress={() => !isPast && setPickupDate(day)}
                disabled={isPast}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayChipWeekday, isSelected && styles.dayChipTextSelected]}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[styles.dayChipDate, isSelected && styles.dayChipTextSelected]}>
                  {day.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Slot grid for the selected day */}
        <View style={styles.slotSectionCard}>
          {loadingSlots ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
          ) : dayClosed ? (
            <View style={styles.dayClosedBox}>
              <Icon name="calendar-remove-outline" size={22} color={theme.colors.textSecondary} />
              <Text style={styles.dayClosedText}>Not available on this day</Text>
            </View>
          ) : (
            <View style={styles.slotGrid}>
              {timeSlots.map((slot) => {
                const isSelected = slot === selectedSlot;
                const disabled = isSlotDisabled(slot);
                const seats = seatsLeft[slot];
                const statusLabel = isSlotPast(slot)
                  ? null
                  : isSlotBooked(slot)
                    ? (seats === 0 ? 'Full' : 'Booked')
                    : isSlotAdminUnavailable(slot)
                      ? 'Unavailable'
                      : null;
                const seatsLabel = !disabled && seats !== undefined ? `${seats} left` : null;
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
                    {seatsLabel && <Text style={styles.slotChipSeats}>{seatsLabel}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Pickup Address */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <Text style={[styles.sectionLabel, { marginTop: 0, marginBottom: 0 }]}>
            PICKUP ADDRESS<Text style={{ color: theme.colors.error }}> *</Text>
          </Text>
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

        <View style={styles.addressFieldsContainer}>
          <TextInput
            placeholder="Address line 1 (house/flat no., street)"
            placeholderTextColor={theme.colors.textSecondary}
            value={addressLine1}
            onChangeText={setAddressLine1}
            style={styles.addressInput}
          />
          <View style={styles.addressFieldDivider} />
          <TextInput
            placeholder="Address line 2 (area, landmark) — optional"
            placeholderTextColor={theme.colors.textSecondary}
            value={addressLine2}
            onChangeText={setAddressLine2}
            style={styles.addressInput}
          />
          <View style={styles.addressFieldDivider} />
          <TouchableOpacity
            style={styles.pincodeFieldRow}
            onPress={() => {
              setPincodeInput(pincode);
              setPincodeError('');
              setShowPincodeModal(true);
            }}
            activeOpacity={0.7}
          >
            <Icon name="map-marker-check" size={16} color={theme.colors.primary} />
            <Text style={styles.pincodeFieldText}>
              {pincode || 'Pincode not verified'}
            </Text>
            <Text style={styles.pincodeFieldChangeText}>Change</Text>
          </TouchableOpacity>
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
                <Text style={styles.modalSub} numberOfLines={2}>{displayAddress || 'Selected Location'}</Text>
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

      {/* Pincode Serviceability Check */}
      <Modal
        visible={showPincodeModal}
        animationType="fade"
        transparent
        onRequestClose={() => {
          if (!pincodeVerified) navigation.goBack();
          else setShowPincodeModal(false);
        }}
      >
        <View style={styles.pincodeOverlay}>
          <View style={styles.pincodeCard}>
            <Icon name="map-marker-check-outline" size={32} color={theme.colors.primary} />
            <Text style={styles.pincodeTitle}>{pincodeVerified ? 'Change Pincode' : 'Check Serviceability'}</Text>
            <Text style={styles.pincodeSubtitle}>
              {pincodeVerified
                ? 'Enter a different pincode — the map and slots below will update to that area.'
                : 'Enter your area pincode to confirm we can pick up from your location.'}
            </Text>
            <TextInput
              placeholder="Enter your area pincode"
              placeholderTextColor={theme.colors.textSecondary}
              value={pincodeInput}
              onChangeText={(t) => {
                setPincodeInput(t.replace(/[^0-9]/g, '').slice(0, 6));
                setPincodeError('');
              }}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.pincodeInput}
            />
            {pincodeError ? <Text style={styles.pincodeErrorText}>{pincodeError}</Text> : null}
            <TouchableOpacity
              style={[styles.pincodeCheckBtn, checkingPincode && styles.confirmBtnDisabled]}
              onPress={handleCheckPincode}
              disabled={checkingPincode}
              activeOpacity={0.85}
            >
              {checkingPincode ? (
                <ActivityIndicator size="small" color={theme.colors.textInverse} />
              ) : (
                <Text style={styles.pincodeCheckBtnText}>Check & Continue</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                if (pincodeVerified) setShowPincodeModal(false);
                else navigation.goBack();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.pincodeCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  weekNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekNavBtn: {
    padding: 6,
  },
  weekNavLabel: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: theme.colors.text,
  },
  weekStripRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 16,
  },
  dayChip: {
    width: 52,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dayChipDisabled: {
    opacity: 0.4,
  },
  dayChipWeekday: {
    fontFamily: theme.fonts.body,
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  dayChipDate: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16,
    color: theme.colors.text,
  },
  dayChipTextSelected: {
    color: theme.colors.textInverse,
  },
  slotSectionCard: {
    marginBottom: 24,
  },
  dayClosedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  dayClosedText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: theme.colors.textSecondary,
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
  slotChipSeats: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 10,
    color: theme.colors.primaryDark,
    marginTop: 2,
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
  addressFieldsContainer: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    marginBottom: 28,
    overflow: 'hidden',
  },
  addressInput: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    color: theme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  addressFieldDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
  },
  pincodeFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: theme.colors.primaryContainer,
  },
  pincodeFieldText: {
    flex: 1,
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.text,
  },
  pincodeFieldChangeText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
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
  pincodeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 42, 34, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  pincodeCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 24,
    alignItems: 'center',
  },
  pincodeTitle: {
    fontFamily: theme.fonts.heading,
    fontSize: 18,
    color: theme.colors.text,
    marginTop: 12,
  },
  pincodeSubtitle: {
    fontFamily: theme.fonts.body,
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 18,
  },
  pincodeInput: {
    width: '100%',
    height: 50,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 8,
  },
  pincodeErrorText: {
    fontFamily: theme.fonts.body,
    fontSize: 12,
    color: theme.colors.error || '#c0392b',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  pincodeCheckBtn: {
    width: '100%',
    height: 50,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  pincodeCheckBtnText: {
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    color: theme.colors.textInverse,
  },
  pincodeCancelText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
});

