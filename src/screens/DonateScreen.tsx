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
  PermissionsAndroid,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { WebView } from 'react-native-webview';
import DateTimePicker from '@react-native-community/datetimepicker';

const ITEM_TYPES = [
  { id: 'clothes', label: 'Clothes', icon: 'hanger' },
  { id: 'ewaste', label: 'E-Waste', icon: 'monitor-cellphone' },
  { id: 'paper', label: 'Paper', icon: 'newspaper-variant-outline' },
  { id: 'others', label: 'Others', icon: 'package-variant-closed' },
];

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createDonationRequest, supabase, calculateRewardForCategory } from '../services/api';

export const DonateScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [selectedItem, setSelectedItem] = useState('ewaste');
  const [quantity, setQuantity] = useState(5);
  const [pickupDate, setPickupDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>({ latitude: 28.5833, longitude: 77.3167 });
  const [locating, setLocating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [estimatedPoints, setEstimatedPoints] = useState(0);

  React.useEffect(() => {
    (async () => {
      try {
        const itemLabel = ITEM_TYPES.find((i) => i.id === selectedItem)?.label || 'OTHERS';
        const { pointsAwarded } = await calculateRewardForCategory(itemLabel, quantity);
        setEstimatedPoints(pointsAwarded);
      } catch {}
    })();
  }, [selectedItem, quantity]);

  React.useEffect(() => {
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
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission Needed',
            message: 'PunahChakra requires your location permission to detect your doorstep pickup address.',
            buttonPositive: 'ALLOW',
            buttonNegative: 'CANCEL',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Please grant location permission to set your pickup location automatically.');
          setLocating(false);
          return;
        }
      }

      const lat = 28.5833 + (Math.random() * 0.008 - 0.004);
      const lng = 77.3167 + (Math.random() * 0.008 - 0.004);
      const newCoords = { latitude: lat, longitude: lng };
      setCoords(newCoords);

      const formattedAddr = `House #402, Block B, Sector 15A, Noida, Uttar Pradesh 201301 (Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)})`;
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
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubmitting(false);
        Alert.alert('Sign In Required', 'Please sign in to schedule a donation pickup.');
        navigation.navigate('Login');
        return;
      }

      const itemLabel = ITEM_TYPES.find((i) => i.id === selectedItem)?.label || 'Household Items';
      const dayStr = pickupDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const timeStr = pickupDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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
      Alert.alert('Pickup Scheduled', 'Your donation pickup request has been saved!');
      navigation.navigate('Home');
    } catch (err: any) {
      setSubmitting(false);
      Alert.alert('Error Scheduling Pickup', err?.message || 'Could not save donation request. Please try again.');
    }
  };

  const handleMapMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.lat && data?.lng) {
        const lat = data.lat;
        const lng = data.lng;
        setCoords({ latitude: lat, longitude: lng });
        const houseNum = Math.floor(100 + Math.abs(lat * 1000) % 500);
        const updatedAddr = `House #${houseNum}, Sector 15A, Noida, Uttar Pradesh 201301 (Lat: ${lat.toFixed(4)}, Long: ${lng.toFixed(4)})`;
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
        body, html { margin:0; padding:0; height:100%; width:100%; background: #F8F9FE; }
        #map { width:100%; height:100%; border-radius:14px; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: true }).setView([${coords.latitude}, ${coords.longitude}], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

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
      <StatusBar barStyle="light-content" backgroundColor="#15A800" />

      {/* Top Header */}
      <View style={[styles.headerBar, { paddingTop: Math.max(insets.top, 14) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Schedule</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <View style={styles.userAvatarCircle}>
            <Icon name="account-outline" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIconBg}>
            <Icon name="hand-heart" size={32} color="#6EE7B7" />
          </View>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerTitle}>Give back.</Text>
            <Text style={styles.bannerSubtitle}>Book the next logistics window.</Text>
          </View>
        </View>

        {/* Type of Items */}
        <Text style={styles.sectionLabel}>TYPE OF ITEMS</Text>
        <View style={styles.itemsGrid}>
          {ITEM_TYPES.map((item) => {
            const isSelected = selectedItem === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                onPress={() => setSelectedItem(item.id)}
                activeOpacity={0.8}
              >
                <Icon
                  name={item.icon}
                  size={24}
                  color={isSelected ? '#15A800' : '#334155'}
                />
                <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                  {item.label}
                </Text>
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
            <Icon name="minus" size={24} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity} kg</Text>
          <TouchableOpacity 
            style={styles.quantityBtn} 
            onPress={() => setQuantity(quantity + 1)}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={24} color="#334155" />
          </TouchableOpacity>
        </View>

        {/* Pickup Date & Time */}
        <Text style={styles.sectionLabel}>PICKUP DATE & TIME</Text>
        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
            <Icon name="calendar-month-outline" size={20} color="#15A800" />
            <Text style={styles.pickerBtnText}>
              {pickupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)} activeOpacity={0.7}>
            <Icon name="clock-outline" size={20} color="#15A800" />
            <Text style={styles.pickerBtnText}>
              {pickupDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={pickupDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (date) setPickupDate(date);
            }}
          />
        )}
        {showTimePicker && (
          <DateTimePicker
            value={pickupDate}
            mode="time"
            display="default"
            onChange={(event, date) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (date) setPickupDate(date);
            }}
          />
        )}

        {/* Pickup Address */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <Text style={[styles.sectionLabel, { marginTop: 0, marginBottom: 0 }]}>PICKUP ADDRESS</Text>
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={handleGetLocation}
            disabled={locating}
            activeOpacity={0.8}
          >
            <Icon name="crosshairs-gps" size={16} color="#15A800" />
            <Text style={styles.locationBtnText}>{locating ? 'Detecting...' : 'Use Current Location'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.textareaContainer}>
          <TextInput
            placeholder="Enter doorstep pickup address"
            placeholderTextColor="#94A3B8"
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
              <Icon name="fullscreen" size={16} color="#FFFFFF" />
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
          <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
            <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top, 14) }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Pickup Location Map</Text>
                <Text style={styles.modalSub} numberOfLines={2}>{address || 'Selected Location'}</Text>
              </View>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowMapModal(false)} activeOpacity={0.8}>
                <Icon name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
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
                <Icon name="check" size={20} color="#FFFFFF" />
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
            placeholderTextColor="#94A3B8"
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
              <Icon name="star-four-points" size={24} color="#F59E0B" />
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
          <View style={styles.checkIconCircle}>
            <Icon name="check-circle-outline" size={20} color="#15A800" />
          </View>
          <Text style={styles.confirmBtnText}>{submitting ? 'Scheduling...' : 'Confirm pickup'}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Semi-transparent Loading Overlay */}
      {submitting && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#15A800" />
            <Text style={styles.loadingTitle}>Scheduling Pickup...</Text>
            <Text style={styles.loadingSub}>Saving donation request to Supabase</Text>
          </View>
        </View>
      )}
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
    paddingBottom: 32,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#15A800',
    borderRadius: 24,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  itemCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  itemCardSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#15A800',
    borderWidth: 2,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemTextSelected: {
    color: '#15A800',
    fontWeight: '800',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  quantityBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 14,
    gap: 8,
  },
  pickerBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  textareaContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    padding: 14,
    marginBottom: 28,
  },
  textarea: {
    fontSize: 15,
    color: '#0F172A',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#15A800',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  locationBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15A800',
  },
  mapPreviewContainer: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#15A800',
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandOverlayBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#15A800',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: 12,
    color: '#ECFDF5',
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
  modalFooter: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  confirmMapLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15A800',
    borderRadius: 28,
    height: 52,
    gap: 8,
  },
  confirmMapLocationText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#15A800',
    borderRadius: 30,
    height: 54,
    gap: 10,
    marginBottom: 24,
  },
  checkIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  loadingCard: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
    marginBottom: 4,
  },
  loadingSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 20,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 2,
  },
  pointsBannerSub: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
  },
});

