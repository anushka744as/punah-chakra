// Pickup windows run 11:00 AM - 5:30 PM in 30-minute slots.
// Shared between DonateScreen (donor picks a slot for a pickup) and
// CollectorProfileScreen (collector marks which slots they're generally available for).
export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let minutes = 11 * 60; minutes < 17 * 60 + 30; minutes += 30) {
    const h24 = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    slots.push(`${h12}:${m.toString().padStart(2, '0')} ${period}`);
  }
  return slots;
})();

// Seats per time slot (donors who can book the same slot in one pincode on one day) when the admin
// hasn't set a number for that day — see day_availability.slot_capacity (migration 021).
export const DEFAULT_SLOT_CAPACITY = 5;

// Converts a "H:MM AM/PM" slot label (as produced above) to minutes-since-midnight,
// so a same-day pickup can be compared against the current time.
export const slotToMinutes = (slot: string): number => {
  const match = slot.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!match) return 0;
  const [, hourStr, minuteStr, period] = match;
  let hour = parseInt(hourStr, 10) % 12;
  if (period.toUpperCase() === 'PM') hour += 12;
  return hour * 60 + parseInt(minuteStr, 10);
};

// Pickup time slots are admin-editable (app_settings key 'time_slots', migration 023). TIME_SLOTS is
// updated in place from the database; useTimeSlots() re-renders screens when it changes.
export const SLOT_CHOICES: string[] = (() => {
  const slots: string[] = [];
  for (let m = 6 * 60; m <= 21 * 60 + 30; m += 30) {
    const h24 = Math.floor(m / 60);
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    slots.push(`${h12}:${(m % 60).toString().padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`);
  }
  return slots;
})();

const slotListeners = new Set<() => void>();
export const subscribeTimeSlots = (fn: () => void) => {
  slotListeners.add(fn);
  return () => { slotListeners.delete(fn); };
};

export const applyTimeSlots = (slots: string[]) => {
  const next = [...slots].sort((a, b) => slotToMinutes(a) - slotToMinutes(b));
  if (next.join('|') === TIME_SLOTS.join('|')) return;
  TIME_SLOTS.splice(0, TIME_SLOTS.length, ...next);
  slotListeners.forEach((fn) => fn());
};
