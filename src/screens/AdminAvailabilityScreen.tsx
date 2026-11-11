import React, { useEffect, useMemo, useState } from 'react';
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
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { AdminTabBar } from '../components/AdminTabBar';
import { DEFAULT_SLOT_CAPACITY, SLOT_CHOICES } from '../constants/timeSlots';
import { useTimeSlots } from '../hooks/useTimeSlots';
import { fetchDayAvailability, fetchMonthAvailability, upsertDayAvailability, saveTimeSlots } from '../services/api';
import { useAppData } from '../data/AppDataContext';
import { toDayKey } from '../utils/dayKey';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const AdminAvailabilityScreen = ({ navigation }: any) => {
  const { serviceablePincodes, addServiceablePincode, removeServiceablePincode } = useAppData();
  const [pincode, setPincode] = useState('');
  const [pincodePickerOpen, setPincodePickerOpen] = useState(false);
  const [newPincodeInput, setNewPincodeInput] = useState('');
  const [addPincodeError, setAddPincodeError] = useState('');
  const [savingPincode, setSavingPincode] = useState(false);

  // Default to (or fall back onto) the first serviceable pincode once the list loads, or if
  // the currently-selected one gets removed from under us.
  useEffect(() => {
    if (serviceablePincodes.length === 0) return;
    if (!pincode || !serviceablePincodes.includes(pincode)) {
      setPincode(serviceablePincodes[0]);
    }
  }, [serviceablePincodes, pincode]);

  const handleAddPincode = async () => {
    setAddPincodeError('');
    if (!/^\d{6}$/.test(newPincodeInput)) {
      setAddPincodeError('Enter a valid 6-digit pincode.');
      return;
    }
    if (serviceablePincodes.includes(newPincodeInput)) {
      setAddPincodeError('This pincode is already serviceable.');
      return;
    }
    setSavingPincode(true);
    try {
      await addServiceablePincode(newPincodeInput);
      setPincode(newPincodeInput);
      setNewPincodeInput('');
    } catch (err: any) {
      setAddPincodeError(err?.message || 'Could not add this pincode. Please try again.');
    } finally {
      setSavingPincode(false);
    }
  };

  const handleRemovePincode = (pc: string) => {
    Alert.alert(
      'Remove Pincode',
      `Stop providing pickup service in ${pc}? Users in this pincode will see it as not serviceable.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeServiceablePincode(pc);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Could not remove this pincode.');
            }
          },
        },
      ]
    );
  };

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [monthMap, setMonthMap] = useState<Record<string, { slots: string[]; isClosed: boolean }>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [dayClosed, setDayClosed] = useState(false);
  const [capacity, setCapacity] = useState(DEFAULT_SLOT_CAPACITY);
  const timeSlots = useTimeSlots();
  const [slotEditorOpen, setSlotEditorOpen] = useState(false);
  const [slotDraft, setSlotDraft] = useState<string[]>([]);
  const [savingSlots, setSavingSlots] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pincode) return;
    let cancelled = false;
    (async () => {
      setLoadingMonth(true);
      try {
        const map = await fetchMonthAvailability(pincode, toDayKey(startOfMonth(viewMonth)), toDayKey(endOfMonth(viewMonth)));
        if (!cancelled) setMonthMap(map);
      } catch {
        if (!cancelled) setMonthMap({});
      } finally {
        if (!cancelled) setLoadingMonth(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pincode, viewMonth]);

  // Switching pincode invalidates whichever date's editor is open — its slots belong to
  // the previous pincode's calendar, not this one.
  useEffect(() => {
    setSelectedDate(null);
  }, [pincode]);

  const loadDay = async (date: Date) => {
    setSelectedDate(date);
    setLoadingDay(true);
    try {
      const { slots, isClosed, capacity: cap } = await fetchDayAvailability(pincode, toDayKey(date));
      setSelectedSlots(slots);
      setDayClosed(isClosed);
      setCapacity(cap);
    } catch {
      setSelectedSlots([]);
      setDayClosed(false);
      setCapacity(DEFAULT_SLOT_CAPACITY);
    } finally {
      setLoadingDay(false);
    }
  };

  const toggleSlot = (slot: string) => {
    setSelectedSlots((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]));
  };

  const handleSave = async () => {
    if (!selectedDate || saving) return;
    setSaving(true);
    try {
      await upsertDayAvailability(pincode, toDayKey(selectedDate), selectedSlots, dayClosed, capacity);
      const map = await fetchMonthAvailability(pincode, toDayKey(startOfMonth(viewMonth)), toDayKey(endOfMonth(viewMonth)));
      setMonthMap(map);
      Alert.alert('Saved', `Availability updated for ${selectedDate.toDateString()} (${pincode}).`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const weeks = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const last = endOfMonth(viewMonth);
    const cells: (Date | null)[] = [];
    for (let i = 0; i < first.getDay(); i++) cells.push(null);
    for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [viewMonth]);

  const today = getToday();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="arrow-left" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pincode selector */}
        <Text style={styles.pincodeLabel}>PINCODE</Text>
        <TouchableOpacity
          style={styles.pincodeDropdown}
          onPress={() => setPincodePickerOpen(true)}
          activeOpacity={0.8}
        >
          <Icon name="map-marker-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.pincodeDropdownText}>{pincode}</Text>
          <Icon name="chevron-down" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <Modal
          visible={pincodePickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setPincodePickerOpen(false)}
        >
          <View style={styles.pincodeModalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setPincodePickerOpen(false)}
            />
            <View style={styles.pincodeModalCard}>
              <Text style={styles.pincodeModalTitle}>Serviceable Pincodes</Text>
              <ScrollView style={styles.pincodeOptionList}>
                {serviceablePincodes.map((pc) => (
                  <View key={pc} style={styles.pincodeOption}>
                    <TouchableOpacity
                      style={styles.pincodeOptionTouchable}
                      onPress={() => {
                        setPincode(pc);
                        setPincodePickerOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.pincodeOptionText, pc === pincode && styles.pincodeOptionTextActive]}>
                        {pc}
                      </Text>
                      {pc === pincode && <Icon name="check" size={18} color={theme.colors.primary} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.pincodeRemoveBtn}
                      onPress={() => handleRemovePincode(pc)}
                      activeOpacity={0.7}
                    >
                      <Icon name="trash-can-outline" size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                {serviceablePincodes.length === 0 && (
                  <Text style={styles.pincodeEmptyText}>No serviceable pincodes yet.</Text>
                )}
              </ScrollView>

              <Text style={styles.addPincodeLabel}>ADD A NEW PINCODE</Text>
              <View style={styles.addPincodeRow}>
                <TextInput
                  style={styles.addPincodeInput}
                  placeholder="e.g. 110001"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={newPincodeInput}
                  onChangeText={(t) => {
                    setNewPincodeInput(t.replace(/[^0-9]/g, ''));
                    setAddPincodeError('');
                  }}
                />
                <TouchableOpacity
                  style={[styles.addPincodeBtn, savingPincode && styles.addPincodeBtnDisabled]}
                  onPress={handleAddPincode}
                  disabled={savingPincode}
                  activeOpacity={0.85}
                >
                  {savingPincode ? (
                    <ActivityIndicator size="small" color={theme.colors.surface} />
                  ) : (
                    <Icon name="plus" size={20} color={theme.colors.surface} />
                  )}
                </TouchableOpacity>
              </View>
              {addPincodeError ? <Text style={styles.addPincodeError}>{addPincodeError}</Text> : null}

              <TouchableOpacity
                style={styles.pincodeModalCloseBtn}
                onPress={() => setPincodePickerOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.pincodeModalCloseBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Month navigation */}
        <View style={styles.monthNavRow}>
          <TouchableOpacity
            onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            activeOpacity={0.7}
            style={styles.monthNavBtn}
          >
            <Icon name="chevron-left" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>
            {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            onPress={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            activeOpacity={0.7}
            style={styles.monthNavBtn}
          >
            <Icon name="chevron-right" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Weekday header */}
        <View style={styles.weekdayRow}>
          {WEEKDAY_LABELS.map((w, i) => (
            <Text key={i} style={styles.weekdayLabel}>{w}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        {loadingMonth ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          weeks.map((row, ri) => (
            <View key={ri} style={styles.weekRow}>
              {row.map((date, ci) => {
                if (!date) return <View key={ci} style={styles.dayCell} />;
                const key = toDayKey(date);
                const config = monthMap[key];
                const isPast = date < today;
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isToday = isSameDay(date, today);
                return (
                  <TouchableOpacity
                    key={ci}
                    style={[
                      styles.dayCell,
                      styles.dayCellTouchable,
                      isSelected && styles.dayCellSelected,
                      isToday && !isSelected && styles.dayCellToday,
                      isPast && styles.dayCellPast,
                    ]}
                    disabled={isPast}
                    onPress={() => loadDay(date)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.dayTextSelected,
                        isPast && styles.dayTextPast,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {config && (
                      <View
                        style={[
                          styles.dayDot,
                          config.isClosed ? styles.dayDotClosed : styles.dayDotOpen,
                        ]}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}

        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dayDot, styles.dayDotOpen]} />
            <Text style={styles.legendText}>Custom slots set</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dayDot, styles.dayDotClosed]} />
            <Text style={styles.legendText}>Closed</Text>
          </View>
        </View>

        {/* Selected day editor */}
        {selectedDate && (
          <View style={styles.editorCard}>
            <Text style={styles.editorTitle}>
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </Text>

            {loadingDay ? (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 16 }} />
            ) : (
              <>
                <View style={styles.closeDayRow}>
                  <Text style={styles.closeDayText}>Close this day entirely</Text>
                  <Switch
                    value={dayClosed}
                    onValueChange={setDayClosed}
                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  />
                </View>

                <Text style={styles.slotsLabel}>
                  {dayClosed ? 'Slots (disabled while this day is closed)' : 'Open slots for this day'}
                </Text>
                <View style={styles.slotGrid}>
                  {timeSlots.map((slot) => {
                    const isSelected = selectedSlots.includes(slot);
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[
                          styles.slotChip,
                          isSelected && styles.slotChipSelected,
                          dayClosed && styles.slotChipDisabled,
                        ]}
                        onPress={() => !dayClosed && toggleSlot(slot)}
                        disabled={dayClosed}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>{slot}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  onPress={() => { setSlotDraft(timeSlots); setSlotEditorOpen(true); }}
                  activeOpacity={0.7}
                  style={styles.editSlotsLink}
                >
                  <Icon name="clock-edit-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.editSlotsLinkText}>Edit time slots (add / remove)</Text>
                </TouchableOpacity>
                <Text style={styles.slotsLabel}>Seats per time slot</Text>
                <View style={styles.capacityRow}>
                  <TouchableOpacity
                    style={[styles.capacityBtn, (dayClosed || capacity <= 1) && styles.slotChipDisabled]}
                    onPress={() => setCapacity((c) => Math.max(1, c - 1))}
                    disabled={dayClosed || capacity <= 1}
                    activeOpacity={0.7}
                  >
                    <Icon name="minus" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.capacityValue}>{capacity}</Text>
                  <TouchableOpacity
                    style={[styles.capacityBtn, (dayClosed || capacity >= 100) && styles.slotChipDisabled]}
                    onPress={() => setCapacity((c) => Math.min(100, c + 1))}
                    disabled={dayClosed || capacity >= 100}
                    activeOpacity={0.7}
                  >
                    <Icon name="plus" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.capacityHint}>donors can book each time slot</Text>
                </View>
                <Text style={styles.helperText}>
                  Leave every slot unchecked to keep this day open with all slots bookable (default).
                </Text>

                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Availability'}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
      <Modal visible={slotEditorOpen} transparent animationType="fade" onRequestClose={() => setSlotEditorOpen(false)}>
        <View style={styles.pincodeModalBackdrop}>
          <View style={styles.pincodeModalCard}>
            <Text style={styles.pincodeModalTitle}>Pickup time slots</Text>
            <Text style={styles.slotEditorHint}>Tap to add or remove. Donors can only book the highlighted times, for every pincode and day.</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              <View style={styles.slotGrid}>
                {SLOT_CHOICES.map((slot) => {
                  const on = slotDraft.includes(slot);
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotChip, on && styles.slotChipSelected]}
                      onPress={() => setSlotDraft(on ? slotDraft.filter((x) => x !== slot) : [...slotDraft, slot])}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.slotChipText, on && styles.slotChipTextSelected]}>{slot}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.pincodeModalCloseBtn}
              disabled={savingSlots}
              activeOpacity={0.85}
              onPress={async () => {
                try {
                  setSavingSlots(true);
                  await saveTimeSlots(slotDraft);
                  setSlotEditorOpen(false);
                } catch (err: any) {
                  Alert.alert('Could not save', err?.message || 'Try again.');
                } finally {
                  setSavingSlots(false);
                }
              }}
            >
              <Text style={styles.pincodeModalCloseBtnText}>{savingSlots ? 'Saving…' : 'Save time slots'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSlotEditorOpen(false)} style={styles.editSlotsLink} activeOpacity={0.7}>
              <Text style={styles.editSlotsLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <AdminTabBar active="calendar" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  pincodeLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  pincodeDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 18,
  },
  pincodeDropdownText: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  editSlotsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  editSlotsLinkText: {
    fontSize: 13,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.primary,
  },
  slotEditorHint: {
    fontSize: 12,
    fontFamily: theme.fonts.body,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  pincodeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  pincodeModalCard: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 16,
  },
  pincodeModalTitle: {
    fontSize: 16,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  pincodeOptionList: {
    maxHeight: 220,
  },
  pincodeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pincodeOptionTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  pincodeOptionText: {
    fontSize: 15,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.text,
  },
  pincodeOptionTextActive: {
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
  },
  pincodeRemoveBtn: {
    padding: 8,
  },
  pincodeEmptyText: {
    fontSize: 13,
    fontFamily: theme.fonts.body,
    color: theme.colors.textSecondary,
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  addPincodeLabel: {
    fontSize: 11,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  addPincodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  addPincodeInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.text,
  },
  addPincodeBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPincodeBtnDisabled: {
    opacity: 0.6,
  },
  addPincodeError: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.error,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  pincodeModalCloseBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
  pincodeModalCloseBtnText: {
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthNavBtn: {
    padding: 8,
  },
  monthLabel: {
    fontSize: 17,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellTouchable: {
    borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  dayCellPast: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: 14,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.text,
  },
  dayTextSelected: {
    color: theme.colors.surface,
  },
  dayTextPast: {
    color: theme.colors.textSecondary,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  dayDotOpen: {
    backgroundColor: theme.colors.secondary,
  },
  dayDotClosed: {
    backgroundColor: theme.colors.error,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 14,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  editorCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 20,
    marginTop: 16,
  },
  editorTitle: {
    fontSize: 18,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.primary,
    marginBottom: 14,
  },
  closeDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeDayText: {
    fontSize: 14,
    fontFamily: theme.fonts.bodySemiBold,
    color: theme.colors.text,
  },
  slotsLabel: {
    fontSize: 12,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  slotChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  slotChipSelected: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  slotChipDisabled: {
    opacity: 0.4,
  },
  slotChipText: {
    fontSize: 13,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  slotChipTextSelected: {
    color: theme.colors.primary,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  capacityBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capacityValue: {
    minWidth: 48,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.text,
  },
  capacityHint: {
    flex: 1,
    marginLeft: 12,
    fontSize: 12,
    fontFamily: theme.fonts.body,
    color: theme.colors.textSecondary,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: theme.fonts.bodyBold,
    color: theme.colors.surface,
    letterSpacing: 0.5,
  },
});
