import { DonationItem } from '../services/api';

export type OrderState = 'completed' | 'cancelled' | 'upcoming';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const slotToMinutes = (slot?: string) => {
  const m = String(slot || '').match(/^(\d+):(\d+)\s*(AM|PM)$/i);
  if (!m) return 11 * 60;
  let h = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + parseInt(m[2], 10);
};

// Pickup days are stored as text like "Fri, Nov 20" (no year), so the year is inferred from
// when the order was created.
export function dueDate(d: DonationItem): Date {
  const created = d.created_at ? new Date(d.created_at) : new Date();
  const m = String(d.pickup_day || '').match(/([A-Za-z]{3})[a-z]*\s+(\d{1,2})/);
  let due = new Date(created);
  if (m && MONTHS.includes(m[1].toLowerCase())) {
    due = new Date(created.getFullYear(), MONTHS.indexOf(m[1].toLowerCase()), parseInt(m[2], 10));
    if (due.getTime() - created.getTime() < -150 * 864e5) due.setFullYear(due.getFullYear() + 1);
  }
  due.setHours(0, 0, 0, 0);
  due.setMinutes(slotToMinutes(d.time_slot));
  return due;
}

// Completed = not cancelled and the pickup's due date/time has passed (auto), or already marked picked up.
export function orderState(d: DonationItem): OrderState {
  if (d.status === 'cancelled') return 'cancelled';
  const done = d.is_picked_up || d.status === 'completed' || d.status === 'collected';
  return done || dueDate(d) <= new Date() ? 'completed' : 'upcoming';
}

export const pincodeOf = (d: DonationItem): string =>
  d.pincode || (String(d.address || '').match(/\b\d{6}\b/) || [])[0] || 'Unknown';
