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

// Pickup slots are 30 minutes long (see constants/timeSlots).
export const SLOT_MINUTES = 30;

export function slotEnd(d: DonationItem): Date {
  return new Date(dueDate(d).getTime() + SLOT_MINUTES * 60000);
}

// THE rule for "this pickup happened": it was not cancelled, and either someone already marked it
// done, or its time slot is over. Nobody has to mark pickups completed by hand.
export function isPickupDone(d: DonationItem, now: Date = new Date()): boolean {
  if (d.status === 'cancelled') return false;
  if (d.is_picked_up || d.status === 'completed' || d.status === 'collected' || d.status === 'assessed') return true;
  return slotEnd(d) <= now;
}

export function orderState(d: DonationItem): OrderState {
  if (d.status === 'cancelled') return 'cancelled';
  return isPickupDone(d) ? 'completed' : 'upcoming';
}

// What the user sees as the pickup's status.
export function displayStatus(d: DonationItem): string {
  if (d.status === 'cancelled') return 'Cancelled';
  return isPickupDone(d) ? 'Completed' : 'Pickup Scheduled';
}

export const pincodeOf = (d: DonationItem): string =>
  d.pincode || (String(d.address || '').match(/\b\d{6}\b/) || [])[0] || 'Unknown';
