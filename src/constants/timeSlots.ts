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
