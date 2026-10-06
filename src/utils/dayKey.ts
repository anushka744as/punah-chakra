// Canonical ISO (YYYY-MM-DD) key used to read/write the `day_availability` table — must match
// between AdminAvailabilityScreen (writer) and anything reading admin-configured slots (e.g.
// DonateScreen), independently of whatever locale string is shown to the user or stored on
// `donations.pickup_day`.
export const toDayKey = (d: Date) => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
};
