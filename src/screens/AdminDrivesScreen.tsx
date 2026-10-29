import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/theme';
import { useAppData } from '../data/AppDataContext';
import { CollectionDrive, fetchAllDrives, addCollectionDrive, updateCollectionDrive, removeCollectionDrive } from '../services/api';
import { toDayKey } from '../utils/dayKey';

const formatDriveDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const AdminDrivesScreen = ({ navigation }: any) => {
  const { serviceablePincodes } = useAppData();
  const [drives, setDrives] = useState<CollectionDrive[] | null>(null);
  const [showPast, setShowPast] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [timeWindow, setTimeWindow] = useState('');
  const [location, setLocation] = useState('');
  const [pincode, setPincode] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      setDrives(await fetchAllDrives());
    } catch {
      setDrives([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const resetForm = () => {
    setEditingId(null);
    setTitle(''); setDate(null); setTimeWindow(''); setLocation(''); setPincode(''); setDescription('');
  };

  const startEdit = (d: CollectionDrive) => {
    setEditingId(d.id);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    setTitle(d.title);
    setDate(new Date(`${d.drive_date}T00:00:00`));
    setTimeWindow(d.time_window || '');
    setLocation(d.location);
    setPincode(d.pincode || '');
    setDescription(d.description || '');
  };

  const handleAdd = async () => {
    if (!title.trim() || !location.trim()) {
      Alert.alert('Missing details', 'Enter a title and a location.');
      return;
    }
    if (!date) {
      Alert.alert('Pick a date', 'Choose the date of the drive.');
      return;
    }
    if (pincode && !/^\d{6}$/.test(pincode)) {
      Alert.alert('Invalid pincode', 'Pincode must be 6 digits (or leave it empty for the whole city).');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        drive_date: toDayKey(date),
        time_window: timeWindow.trim() || null,
        location: location.trim(),
        pincode: pincode || null,
        description: description.trim() || null,
      };
      if (editingId) await updateCollectionDrive(editingId, payload);
      else await addCollectionDrive(payload);
      resetForm();
      await load();
    } catch (err: any) {
      Alert.alert('Could not save', err?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = (d: CollectionDrive) =>
    Alert.alert('Remove this drive?', `"${d.title}" will disappear for donors.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeCollectionDrive(d.id);
            load();
          } catch (err: any) {
            Alert.alert('Could not remove', err?.message || 'Try again.');
          }
        },
      },
    ]);

  const today = toDayKey(new Date());
  const upcoming = (drives || []).filter(d => d.drive_date >= today);
  const past = (drives || []).filter(d => d.drive_date < today).reverse();

  const renderDrive = (d: CollectionDrive, muted = false) => (
    <View key={d.id} style={[styles.card, muted && { opacity: 0.6 }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{d.title}</Text>
        <Text style={styles.cardSub}>{formatDriveDate(d.drive_date)}{d.time_window ? ` · ${d.time_window}` : ''}</Text>
        <Text style={styles.cardSub}>{d.location}{d.pincode ? ` · ${d.pincode}` : ' · All areas'}</Text>
        {!!d.description && <Text style={styles.cardMeta}>{d.description}</Text>}
      </View>
      <TouchableOpacity onPress={() => startEdit(d)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="pencil-outline" size={22} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => confirmRemove(d)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="trash-can-outline" size={22} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Collection Drives</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>{editingId ? 'Edit drive' : 'Add a drive'}</Text>
        <Text style={styles.hint}>Every donor sees it on their Collection Drives page.</Text>
        <TextInput style={styles.input} placeholder="Title (e.g. Diwali clothes drive)" placeholderTextColor={theme.colors.textSecondary} value={title} onChangeText={setTitle} />
        <TouchableOpacity style={[styles.input, styles.dateInput]} onPress={() => setPickerOpen(true)} activeOpacity={0.8}>
          <Icon name="calendar-month-outline" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.dateText, !date && { color: theme.colors.textSecondary }]}>
            {date ? formatDriveDate(toDayKey(date)) : 'Pick a date'}
          </Text>
        </TouchableOpacity>
        {pickerOpen && (
          <DateTimePicker
            value={date || new Date()}
            mode="date"
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(_e, picked) => {
              setPickerOpen(Platform.OS === 'ios');
              if (picked) setDate(picked);
            }}
          />
        )}
        <TextInput style={styles.input} placeholder="Time (e.g. 10 AM – 2 PM)" placeholderTextColor={theme.colors.textSecondary} value={timeWindow} onChangeText={setTimeWindow} />
        <TextInput style={styles.input} placeholder="Location / venue" placeholderTextColor={theme.colors.textSecondary} value={location} onChangeText={setLocation} />
        <TextInput style={styles.input} placeholder="Pincode (leave empty for all areas)" placeholderTextColor={theme.colors.textSecondary} value={pincode} onChangeText={t => setPincode(t.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" />
        {serviceablePincodes.length > 0 && (
          <View style={styles.chipsRow}>
            {serviceablePincodes.map(pin => (
              <TouchableOpacity key={pin} style={[styles.chip, pincode === pin && styles.chipActive]} onPress={() => setPincode(pincode === pin ? '' : pin)} activeOpacity={0.8}>
                <Text style={[styles.chipText, pincode === pin && styles.chipTextActive]}>{pin}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <TextInput style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]} placeholder="Details (what to bring, contact…) — optional" placeholderTextColor={theme.colors.textSecondary} value={description} onChangeText={setDescription} multiline />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85} disabled={saving}>
          <Icon name="plus" size={18} color={theme.colors.surface} />
          <Text style={styles.addBtnText}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add collection drive'}</Text>
        </TouchableOpacity>
        {editingId && (
          <TouchableOpacity onPress={resetForm} style={styles.pastToggle} activeOpacity={0.7}>
            <Text style={styles.pastToggleText}>Cancel editing</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.section, { marginTop: theme.spacing.md }]}>Upcoming drives</Text>
        {drives === null ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : upcoming.length === 0 ? (
          <Text style={styles.empty}>No upcoming drives.</Text>
        ) : (
          upcoming.map(d => renderDrive(d))
        )}

        {past.length > 0 && (
          <>
            <TouchableOpacity onPress={() => setShowPast(v => !v)} style={styles.pastToggle} activeOpacity={0.7}>
              <Text style={styles.pastToggleText}>{showPast ? 'Hide' : 'Show'} past drives ({past.length})</Text>
            </TouchableOpacity>
            {showPast && past.map(d => renderDrive(d, true))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: theme.spacing.md },
  title: { fontSize: 20, fontFamily: theme.fonts.heading, color: theme.colors.text },
  content: { padding: theme.spacing.md, gap: theme.spacing.sm, paddingBottom: theme.spacing.xxl },
  section: { fontSize: 16, fontFamily: theme.fonts.heading, color: theme.colors.text },
  hint: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
  empty: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    color: theme.colors.text,
  },
  dateInput: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 14, fontFamily: theme.fonts.body, color: theme.colors.text },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.full, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: theme.colors.surface },
  chipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  chipText: { fontSize: 12, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.textSecondary },
  chipTextActive: { color: theme.colors.surface },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: 12,
  },
  addBtnText: { fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.surface },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  cardTitle: { fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.text },
  cardSub: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginTop: 4 },
  pastToggle: { alignItems: 'center', paddingVertical: theme.spacing.sm },
  pastToggleText: { fontSize: 13, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.primary },
});
