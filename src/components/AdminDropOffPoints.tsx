import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { useAppData } from '../data/AppDataContext';
import { DropOffPoint, fetchAllDropOffPoints, addDropOffPoint, updateDropOffPoint, removeDropOffPoint } from '../services/api';
import { toDayKey } from '../utils/dayKey';

const fmtDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtTime = (d: Date) => {
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
};

// "10:00 AM" -> Date today at that time (used to seed the time picker when editing).
const parseTime = (t?: string | null): Date | null => {
  const m = t?.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  if (!m) { return null; }
  const d = new Date();
  d.setHours((Number(m[1]) % 12) + (m[3] === 'PM' ? 12 : 0), Number(m[2]), 0, 0);
  return d;
};

type PickerTarget = 'start' | 'end' | 'open' | 'close' | null;

interface Props {
  scrollToTop?: () => void;
}

export const AdminDropOffPoints = ({ scrollToTop }: Props) => {
  const { serviceablePincodes } = useAppData();
  const [points, setPoints] = useState<DropOffPoint[] | null>(null);
  const [showPast, setShowPast] = useState(false);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [openTime, setOpenTime] = useState<Date | null>(null);
  const [closeTime, setCloseTime] = useState<Date | null>(null);
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setPoints(await fetchAllDropOffPoints());
    } catch {
      setPoints([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setName(''); setAddress(''); setPincode(''); setStartDate(null); setEndDate(null);
    setOpenTime(null); setCloseTime(null); setContact(''); setDescription('');
  };

  const startEdit = (p: DropOffPoint) => {
    setEditingId(p.id);
    scrollToTop?.();
    setName(p.name);
    setAddress(p.address);
    setPincode(p.pincode || '');
    setStartDate(new Date(`${p.start_date}T00:00:00`));
    setEndDate(new Date(`${p.end_date}T00:00:00`));
    setOpenTime(parseTime(p.open_time));
    setCloseTime(parseTime(p.close_time));
    setContact(p.contact || '');
    setDescription(p.description || '');
  };

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Missing details', 'Enter a name and an address for the drop-off point.');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Pick the dates', 'Choose the start and end date for this drop-off point.');
      return;
    }
    if (toDayKey(endDate) < toDayKey(startDate)) {
      Alert.alert('Check the dates', 'The end date cannot be before the start date.');
      return;
    }
    if (pincode && !/^\d{6}$/.test(pincode)) {
      Alert.alert('Invalid pincode', 'Pincode must be 6 digits (or leave it empty for the whole city).');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        pincode: pincode || null,
        start_date: toDayKey(startDate),
        end_date: toDayKey(endDate),
        open_time: openTime ? fmtTime(openTime) : null,
        close_time: closeTime ? fmtTime(closeTime) : null,
        contact: contact.trim() || null,
        description: description.trim() || null,
      };
      if (editingId) { await updateDropOffPoint(editingId, payload); }
      else { await addDropOffPoint({ ...payload, is_active: true }); }
      resetForm();
      await load();
    } catch (err: any) {
      Alert.alert('Could not save', err?.message || 'Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: DropOffPoint, value: boolean) => {
    setPoints(prev => (prev || []).map(x => (x.id === p.id ? { ...x, is_active: value } : x)));
    try {
      await updateDropOffPoint(p.id, { is_active: value });
    } catch (err: any) {
      Alert.alert('Could not update', err?.message || 'Try again.');
      load();
    }
  };

  const confirmRemove = (p: DropOffPoint) =>
    Alert.alert('Remove this drop-off point?', `"${p.name}" will disappear for donors.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeDropOffPoint(p.id);
            load();
          } catch (err: any) {
            Alert.alert('Could not remove', err?.message || 'Try again.');
          }
        },
      },
    ]);

  const onPick = (_e: any, picked?: Date) => {
    const target = picker;
    setPicker(Platform.OS === 'ios' ? target : null);
    if (!picked || !target) { return; }
    if (target === 'start') {
      setStartDate(picked);
      if (endDate && toDayKey(endDate) < toDayKey(picked)) { setEndDate(picked); }
    }
    if (target === 'end') { setEndDate(picked); }
    if (target === 'open') { setOpenTime(picked); }
    if (target === 'close') { setCloseTime(picked); }
  };

  const today = toDayKey(new Date());
  const current = (points || []).filter(p => p.end_date >= today);
  const ended = (points || []).filter(p => p.end_date < today);

  const status = (p: DropOffPoint) => {
    if (!p.is_active) { return { text: 'PAUSED', color: theme.colors.textSecondary }; }
    if (p.start_date > today) { return { text: 'UPCOMING', color: theme.colors.info }; }
    if (p.end_date < today) { return { text: 'ENDED', color: theme.colors.textSecondary }; }
    return { text: 'OPEN NOW', color: theme.colors.primary };
  };

  const renderPoint = (p: DropOffPoint, muted = false) => {
    const st = status(p);
    const hours = p.open_time && p.close_time ? `${p.open_time} – ${p.close_time}` : p.open_time || p.close_time || null;
    return (
      <View key={p.id} style={[styles.card, muted && { opacity: 0.6 }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.status, { color: st.color }]}>{st.text}</Text>
          <Text style={styles.cardTitle}>{p.name}</Text>
          <Text style={styles.cardSub}>{p.address}{p.pincode ? ` · ${p.pincode}` : ' · All areas'}</Text>
          <Text style={styles.cardSub}>{fmtDate(p.start_date)} → {fmtDate(p.end_date)}{hours ? ` · ${hours}` : ''}</Text>
          {!!p.contact && <Text style={styles.cardMeta}>Contact: {p.contact}</Text>}
          {!!p.description && <Text style={styles.cardMeta}>{p.description}</Text>}
          {!muted && (
            <View style={styles.pauseRow}>
              <Switch
                value={p.is_active}
                onValueChange={v => toggleActive(p, v)}
                trackColor={{ true: theme.colors.primary, false: theme.colors.border }}
              />
              <Text style={styles.pauseText}>{p.is_active ? 'Visible to donors' : 'Hidden from donors'}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => startEdit(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="pencil-outline" size={22} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmRemove(p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon name="trash-can-outline" size={22} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const pickerValue =
    picker === 'start' ? startDate || new Date()
    : picker === 'end' ? endDate || startDate || new Date()
    : picker === 'open' ? openTime || new Date()
    : closeTime || new Date();

  return (
    <>
      <Text style={styles.section}>{editingId ? 'Edit drop-off point' : 'Add a drop-off point'}</Text>
      <Text style={styles.hint}>Donors see it on their Drives page while it is open.</Text>
      <TextInput style={styles.input} placeholder="Name (e.g. Sector 15 Community Hall)" placeholderTextColor={theme.colors.textSecondary} value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Full address" placeholderTextColor={theme.colors.textSecondary} value={address} onChangeText={setAddress} />
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

      <Text style={styles.label}>OPEN BETWEEN</Text>
      <View style={styles.twoCol}>
        <TouchableOpacity style={[styles.input, styles.pickerInput]} onPress={() => setPicker('start')} activeOpacity={0.8}>
          <Icon name="calendar-start" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.pickerText, !startDate && styles.placeholder]}>{startDate ? fmtDate(toDayKey(startDate)) : 'Start date'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.input, styles.pickerInput]} onPress={() => setPicker('end')} activeOpacity={0.8}>
          <Icon name="calendar-end" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.pickerText, !endDate && styles.placeholder]}>{endDate ? fmtDate(toDayKey(endDate)) : 'End date'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>DAILY HOURS</Text>
      <View style={styles.twoCol}>
        <TouchableOpacity style={[styles.input, styles.pickerInput]} onPress={() => setPicker('open')} activeOpacity={0.8}>
          <Icon name="clock-start" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.pickerText, !openTime && styles.placeholder]}>{openTime ? fmtTime(openTime) : 'Opens at'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.input, styles.pickerInput]} onPress={() => setPicker('close')} activeOpacity={0.8}>
          <Icon name="clock-end" size={18} color={theme.colors.textSecondary} />
          <Text style={[styles.pickerText, !closeTime && styles.placeholder]}>{closeTime ? fmtTime(closeTime) : 'Closes at'}</Text>
        </TouchableOpacity>
      </View>

      {picker && (
        <DateTimePicker
          value={pickerValue}
          mode={picker === 'open' || picker === 'close' ? 'time' : 'date'}
          minimumDate={picker === 'start' ? new Date() : picker === 'end' ? startDate || new Date() : undefined}
          display={Platform.OS === 'ios' ? (picker === 'open' || picker === 'close' ? 'spinner' : 'inline') : 'default'}
          onChange={onPick}
        />
      )}

      <TextInput style={styles.input} placeholder="Contact number — optional" placeholderTextColor={theme.colors.textSecondary} value={contact} onChangeText={setContact} keyboardType="phone-pad" />
      <TextInput style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]} placeholder="Details (what is accepted, landmark…) — optional" placeholderTextColor={theme.colors.textSecondary} value={description} onChangeText={setDescription} multiline />
      <TouchableOpacity style={styles.addBtn} onPress={handleSave} activeOpacity={0.85} disabled={saving}>
        <Icon name="plus" size={18} color={theme.colors.surface} />
        <Text style={styles.addBtnText}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Add drop-off point'}</Text>
      </TouchableOpacity>
      {editingId && (
        <TouchableOpacity onPress={resetForm} style={styles.pastToggle} activeOpacity={0.7}>
          <Text style={styles.pastToggleText}>Cancel editing</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.section, { marginTop: theme.spacing.md }]}>Current & upcoming</Text>
      {points === null ? (
        <ActivityIndicator color={theme.colors.primary} />
      ) : current.length === 0 ? (
        <Text style={styles.empty}>No drop-off points yet.</Text>
      ) : (
        current.map(p => renderPoint(p))
      )}

      {ended.length > 0 && (
        <>
          <TouchableOpacity onPress={() => setShowPast(v => !v)} style={styles.pastToggle} activeOpacity={0.7}>
            <Text style={styles.pastToggleText}>{showPast ? 'Hide' : 'Show'} ended drop-off points ({ended.length})</Text>
          </TouchableOpacity>
          {showPast && ended.map(p => renderPoint(p, true))}
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  section: { fontSize: 16, fontFamily: theme.fonts.bodyBold, color: theme.colors.text },
  hint: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
  empty: { color: theme.colors.textSecondary, fontFamily: theme.fonts.body },
  label: { fontSize: 11, fontFamily: theme.fonts.bodyBold, color: theme.colors.textSecondary, letterSpacing: 0.6, marginTop: 4 },
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
  twoCol: { flexDirection: 'row', gap: theme.spacing.sm },
  pickerInput: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pickerText: { fontSize: 14, fontFamily: theme.fonts.body, color: theme.colors.text },
  placeholder: { color: theme.colors.textSecondary },
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
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  status: { fontSize: 10, fontFamily: theme.fonts.bodyBold, letterSpacing: 0.8, marginBottom: 2 },
  cardTitle: { fontSize: 14, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.text },
  cardSub: { fontSize: 13, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginTop: 2 },
  cardMeta: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textSecondary, marginTop: 4 },
  pauseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  pauseText: { fontSize: 12, fontFamily: theme.fonts.body, color: theme.colors.textSecondary },
  pastToggle: { alignItems: 'center', paddingVertical: theme.spacing.sm },
  pastToggleText: { fontSize: 13, fontFamily: theme.fonts.bodySemiBold, color: theme.colors.primary },
});
