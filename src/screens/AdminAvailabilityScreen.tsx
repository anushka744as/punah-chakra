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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme/theme';
import { TIME_SLOTS } from '../constants/timeSlots';
import { fetchDayAvailability, fetchMonthAvailability, upsertDayAvailability } from '../services/api';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toDayKey = (d: Date) => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
};

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
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const [monthMap, setMonthMap] = useState<Record<string, { slots: string[]; isClosed: boolean }>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [dayClosed, setDayClosed] = useState(false);
  const [loadingDay, setLoadingDay] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingMonth(true);
      try {
        const map = await fetchMonthAvailability(toDayKey(startOfMonth(viewMonth)), toDayKey(endOfMonth(viewMonth)));
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
  }, [viewMonth]);

  const loadDay = async (date: Date) => {
    setSelectedDate(date);
    setLoadingDay(true);
    try {
      const { slots, isClosed } = await fetchDayAvailability(toDayKey(date));
      setSelectedSlots(slots);
      setDayClosed(isClosed);
    } catch {
      setSelectedSlots([]);
      setDayClosed(false);
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
      await upsertDayAvailability(toDayKey(selectedDate), selectedSlots, dayClosed);
      const map = await fetchMonthAvailability(toDayKey(startOfMonth(viewMonth)), toDayKey(endOfMonth(viewMonth)));
      setMonthMap(map);
      Alert.alert('Saved', `Availability updated for ${selectedDate.toDateString()}.`);
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
        <Text style={styles.headerTitle}>Pickup Calendar</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                  {TIME_SLOTS.map((slot) => {
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
