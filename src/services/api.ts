import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TIME_SLOTS, DEFAULT_SLOT_CAPACITY, applyTimeSlots } from '../constants/timeSlots';

declare const process: any;

const getEnvVar = (name: string, fallback: string) => {
  try {
    return (typeof process !== 'undefined' && process?.env && process.env[name]) || fallback;
  } catch {
    return fallback;
  }
};

const SUPABASE_URL = getEnvVar('EXPO_PUBLIC_SUPABASE_URL', 'https://egigfrajfrkclohxksaa.supabase.co');
const SUPABASE_ANON_KEY = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaWdmcmFqZnJrY2xvaHhrc2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3ODI2MzYsImV4cCI6MjEwMDM1ODYzNn0.f5mTbgLyVaiHU75FuzHrTpuifowF6XkXnsiMaEg65ag');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  pincode?: string;
  role?: 'user' | 'admin';
  available_slots?: string[];
}

export interface DonationItem {
  id: string;
  donor_id?: string;
  donor_name?: string;
  donor_phone?: string;
  collector_id?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  refused_by?: string;
  refused_at?: string;
  request_id?: string;
  is_picked_up?: boolean;
  category: string;
  weight_kg: number;
  estimated_quantity_kg?: number;
  pickup_day: string;
  time_slot: string;
  instructions: string;
  address: string;
  pincode?: string;
  status: 'pending' | 'scheduled' | 'assigned' | 'in_transit' | 'collected' | 'assessed' | 'completed' | 'cancelled';
  created_at?: string;
}

// Single source of truth for how a donation/pickup status reads to a human — there is no
// approve/reject step, so 'pending' (the DB value set at booking time) and every state up
// to actual collection all read as "Pickup Scheduled" rather than "Pending".
export function getStatusLabel(status?: string): string {
  switch (status) {
    case 'pending':
    case 'scheduled':
    case 'assigned':
    case 'in_transit':
      return 'Pickup Scheduled';
    case 'collected':
    case 'assessed':
      return 'Collected';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Pickup Scheduled';
  }
}

export interface PickupJob {
  id: string;
  donation_id?: string;
  collector_id?: string;
  confirmed_by?: string;
  refused_by?: string;
  donor_name: string;
  donor_phone: string;
  address: string;
  zone: string;
  latitude: number;
  longitude: number;
  weight_summary: string;
  time_window: string;
  status: 'pending' | 'in_transit' | 'collected' | 'assessed' | 'completed';
  scheduled_date: string;
}

// ---------------------------------------------------------------------------
// AUTH & USER PROFILE API
// ---------------------------------------------------------------------------
export async function signUpUser(email: string, password: string, fullName: string, role: 'user' | 'admin') {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) throw error;

  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
    });
  }

  return data;
}

export async function signInUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return { user: data.user, session: data.session, profile };
  }

  return data;
}

// Whether a profiles row already exists for this phone number (E.164 format, e.g.
// +919876543210) — used to tell the Login screen apart "existing user logging in" from
// "brand-new phone number", since Supabase's signInWithOtp silently auto-creates an auth
// user for any phone number on first request and would otherwise let a new number "log in"
// without ever going through Sign Up.
export async function checkPhoneExists(phone: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

// Sends an SMS OTP to `phone` (E.164 format, e.g. +919876543210), creating the auth
// user on first use. `fullName` is stashed in user metadata so the handle_new_user DB
// trigger can populate profiles.full_name as soon as the auth user row is created —
// verifyPhoneOtp below also upserts it explicitly once we have a session.
export async function sendPhoneOtp(phone: string, fullName?: string, pincode?: string, email?: string) {
  const metadata: Record<string, string> = {};
  if (fullName) metadata.full_name = fullName;
  if (pincode) metadata.pincode = pincode;
  if (email) metadata.email = email;

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: Object.keys(metadata).length ? { data: metadata } : undefined,
  });

  if (error) throw error;
}

export async function verifyPhoneOtp(phone: string, token: string, fullName?: string, email?: string, pincode?: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) throw error;

  if (data.user) {
    // Note: `role` is intentionally omitted here. The `handle_new_user` trigger already
    // creates the profiles row (with the correct role) when the auth.users row is created,
    // so this upsert only needs to fill in signup details — including 'role' would silently
    // reset any admin back to 'user' on every subsequent login.
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: email || data.user.email || '',
      full_name: fullName || data.user.user_metadata?.full_name || '',
      phone,
      pincode: pincode || data.user.user_metadata?.pincode || '',
    });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return { user: data.user, session: data.session, profile };
  }

  return data;
}

export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Pincodes PunahChakra currently operates in. Admin-managed (add/remove), read by every
// user's serviceability check and by the admin calendar's pincode dropdown.
export async function fetchServiceablePincodes(): Promise<string[]> {
  const { data, error } = await supabase
    .from('serviceable_pincodes')
    .select('pincode')
    .order('pincode', { ascending: true });

  if (error) throw error;
  return ((data || []) as any[]).map((row) => row.pincode);
}

export async function addServiceablePincode(pincode: string) {
  const { error } = await supabase.from('serviceable_pincodes').insert([{ pincode }]);
  if (error) throw error;
}

export async function removeServiceablePincode(pincode: string) {
  const { error } = await supabase.from('serviceable_pincodes').delete().eq('pincode', pincode);
  if (error) throw error;
}

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as UserProfile;
}

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) throw error;
  // RLS only lets a signed-in user update their own profile; without a real session (e.g. the
  // dev "Skip to User Panel" button) the update matches 0 rows instead of erroring.
  if (!data) throw new Error('Could not save — please log in with your phone number and try again.');
  return data;
}

// Admin-configured availability for one specific calendar day, scoped to a serviceable
// pincode (day_availability table). No row for a pincode+date means it's fully open
// (fail-open) — same default as the old flat per-admin slot list this replaces.
export async function fetchDayAvailability(
  pincode: string,
  day: string
): Promise<{ slots: string[]; isClosed: boolean; capacity: number }> {
  const { data } = await supabase
    .from('day_availability')
    .select('available_slots, is_closed, slot_capacity')
    .eq('pincode', pincode)
    .eq('day', day)
    .maybeSingle();

  return {
    slots: (data as any)?.available_slots || [],
    isClosed: Boolean((data as any)?.is_closed),
    capacity: (data as any)?.slot_capacity ?? DEFAULT_SLOT_CAPACITY,
  };
}

// All configured day_availability rows for one pincode in a date range (inclusive), keyed
// by day — used by the admin calendar to mark which dates already have custom availability set.
export async function fetchMonthAvailability(
  pincode: string,
  startDay: string,
  endDay: string
): Promise<Record<string, { slots: string[]; isClosed: boolean }>> {
  const { data } = await supabase
    .from('day_availability')
    .select('day, available_slots, is_closed')
    .eq('pincode', pincode)
    .gte('day', startDay)
    .lte('day', endDay);

  const map: Record<string, { slots: string[]; isClosed: boolean }> = {};
  ((data || []) as any[]).forEach((row) => {
    map[row.day] = { slots: row.available_slots || [], isClosed: Boolean(row.is_closed) };
  });
  return map;
}

// Admin saves which slots are open (and/or closes the whole day) for one pincode + calendar date.
export async function upsertDayAvailability(
  pincode: string,
  day: string,
  slots: string[],
  isClosed: boolean,
  capacity: number = DEFAULT_SLOT_CAPACITY
) {
  const { data, error } = await supabase
    .from('day_availability')
    .upsert(
      { pincode, day, available_slots: slots, is_closed: isClosed, slot_capacity: capacity, updated_at: new Date().toISOString() },
      { onConflict: 'pincode,day' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Slots a donor may pick for a given pincode + pickup day: slots the admin opened for that
// specific pincode/date (fail-open if unconfigured), minus slots another active
// (non-cancelled) donation has already booked for that same day. `excludeDonationId` lets a
// donor keep their own slot while rescheduling/editing an existing request.
//
// `dayKey` must be the ISO (YYYY-MM-DD) key the admin's calendar uses for `day_availability`
// (see src/utils/dayKey.ts) — it is a different value from `pickupDay`, the human-readable
// string stored on `donations.pickup_day` (e.g. "Mon, Oct 6"). Passing the display string here
// instead of the ISO key is what silently breaks admin/user slot linking: the day_availability
// lookup never matches any row, so the donor sees every slot as open.
export async function fetchSlotAvailability(
  pincode: string,
  dayKey: string,
  pickupDay: string,
  excludeDonationId?: string
): Promise<{
  availableSlots: string[];
  bookedSlots: string[];
  isClosed: boolean;
  capacity: number;
  seatsLeft: Record<string, number>;
}> {
  const [{ slots, isClosed, capacity }, { data: bookings }] = await Promise.all([
    fetchDayAvailability(pincode, dayKey),
    supabase.from('donations').select('id, time_slot, pincode').eq('pickup_day', pickupDay).neq('status', 'cancelled'),
  ]);

  // A slot has `capacity` seats for donors in the same pincode. A booking from any *other*
  // pincode (or an older one with no pincode) takes the whole slot — one collector can't be in
  // two areas at once. `bookedSlots` is every slot a donor can't pick (taken or full);
  // `seatsLeft` drives the "N left" label.
  const takenByOtherArea = new Set<string>();
  const usedHere: Record<string, number> = {};
  ((bookings || []) as any[])
    .filter((b) => b.id !== excludeDonationId && b.time_slot)
    .forEach((b) => {
      if (b.pincode === pincode) usedHere[b.time_slot] = (usedHere[b.time_slot] || 0) + 1;
      else takenByOtherArea.add(b.time_slot);
    });

  await refreshTimeSlots();
  const seatsLeft: Record<string, number> = {};
  const bookedSlots: string[] = [];
  TIME_SLOTS.forEach((slot) => {
    const left = takenByOtherArea.has(slot) ? 0 : Math.max(0, capacity - (usedHere[slot] || 0));
    seatsLeft[slot] = left;
    if (left === 0) bookedSlots.push(slot);
  });

  return { availableSlots: slots, bookedSlots, isClosed, capacity, seatsLeft };
}

// Next open pickup days for a pincode. A day with no day_availability row is fully open (same
// fail-open rule DonateScreen applies), so this walks the next two weeks and drops only days the
// admin closed; `slots` is the admin's chosen list for that day, or empty for "all slots open".
// Today is skipped once the last slot (5:00 PM) has started.
export interface UpcomingPickupDay {
  day: string; // ISO YYYY-MM-DD
  slots: string[];
}

export async function fetchUpcomingAvailability(pincode: string, limit = 5): Promise<UpcomingPickupDay[]> {
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 13);

  const { data, error } = await supabase
    .from('day_availability')
    .select('day, available_slots, is_closed')
    .eq('pincode', pincode)
    .gte('day', iso(start))
    .lte('day', iso(end));
  if (error) return [];

  const configured: Record<string, { slots: string[]; closed: boolean }> = {};
  ((data || []) as any[]).forEach((row) => {
    configured[row.day] = { slots: row.available_slots || [], closed: Boolean(row.is_closed) };
  });

  const days: UpcomingPickupDay[] = [];
  for (let i = 0; i < 14 && days.length < limit; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (i === 0 && now.getHours() * 60 + now.getMinutes() >= 17 * 60) continue;
    const row = configured[iso(d)];
    if (row?.closed) continue;
    days.push({ day: iso(d), slots: row?.slots || [] });
  }
  return days;
}

// Waitlist entry for a pincode we don't serve yet (area_requests table, migration 020). One row
// per user + pincode, so asking again just refreshes the saved location.
export async function submitAreaRequest(
  userId: string,
  request: { pincode: string; address?: string; latitude?: number; longitude?: number }
) {
  const profile = await fetchUserProfile(userId).catch(() => null);
  const { error } = await supabase.from('area_requests').upsert(
    {
      user_id: userId,
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
      pincode: request.pincode,
      // Only overwrite location when this call has one, so a later silent log keeps it.
      ...(request.address ? { address: request.address } : {}),
      ...(request.latitude != null ? { latitude: request.latitude, longitude: request.longitude ?? null } : {}),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,pincode' }
  );
  if (error) throw error;
}

export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// DONATIONS API
// ---------------------------------------------------------------------------
export async function createDonationRequest(donation: Omit<DonationItem, 'id' | 'status'>, donorId: string) {
  const generatedRequestId = `#PC-${Math.floor(10000 + Math.random() * 90000)}`;

  // 2. Insert into donations table in Supabase
  const { data, error } = await supabase
    .from('donations')
    .insert([
      {
        donor_id: donorId,
        request_id: generatedRequestId,
        is_picked_up: false,
        category: donation.category,
        weight_kg: donation.weight_kg || 1,
        estimated_quantity_kg: donation.weight_kg || 1,
        pickup_day: donation.pickup_day,
        time_slot: donation.time_slot,
        instructions: donation.instructions,
        address: donation.address,
        pincode: donation.pincode || '',
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // 3. Also insert corresponding pickup job for collectors
  const currentProfile = await fetchUserProfile(donorId).catch(() => null);
  try {
    await supabase.from('pickups').insert([
      {
        donation_id: data.id,
        donor_name: currentProfile?.full_name || 'PunahChakra Donor',
        donor_phone: currentProfile?.phone || '',
        address: donation.address,
        zone: currentProfile?.pincode ? `Pincode ${currentProfile.pincode}` : 'Unassigned',
        weight_summary: `${donation.weight_kg || 1} kg`,
        time_window: donation.time_slot,
        status: 'pending',
      },
    ]);
  } catch {}

  // 4. Create a notification in Supabase for the donor
  try {
    await createNotification(
      donorId,
      'Pickup Scheduled',
      `Your ${donation.category} pickup is scheduled for ${donation.pickup_day} (${donation.time_slot}).`,
      'PICKUP REMINDER'
    );
  } catch {}

  // 5. Notify all admins that a pickup has been scheduled
  try {
    const { data: admins, error: adminsError } = await supabase.from('profiles').select('id').eq('role', 'admin');
    if (adminsError) throw adminsError;
    if (admins) {
      const donorName = currentProfile?.full_name || 'A donor';
      const donorPhone = currentProfile?.phone;
      await Promise.all(
        admins.map((admin: { id: string }) =>
          createNotification(
            admin.id,
            'New Pickup Request',
            `${donorName}${donorPhone ? ` (${donorPhone})` : ''} requested a pickup for ${donation.category} ` +
              `(${donation.weight_kg || 1} kg) on ${donation.pickup_day} at ${donation.time_slot} — ${donation.address}.`,
            'PICKUP SCHEDULED'
          )
        )
      );
    }
  } catch (err) {
    console.warn('Failed to notify admins of new pickup request:', err);
  }

  return data;
}

export async function fetchUserDonations(donorId: string): Promise<DonationItem[]> {
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .eq('donor_id', donorId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as DonationItem[];
}

export async function fetchAllScheduledDonations(): Promise<DonationItem[]> {
  // `donations` has multiple FKs into `profiles` (donor_id, collector_id, confirmed_by,
  // refused_by), so the embed must name the exact relationship — an unqualified
  // `profiles(...)` is ambiguous to PostgREST and errors (PGRST201) on every call.
  const { data, error } = await supabase
    .from('donations')
    .select('*, profiles!donations_donor_id_fkey(full_name, phone)')
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('fetchAllScheduledDonations failed:', error);
    return [];
  }
  return (data || []).map((row: any) => {
    const { profiles, ...rest } = row;
    return {
      ...rest,
      donor_name: profiles?.full_name,
      donor_phone: profiles?.phone,
    };
  }) as DonationItem[];
}

// Cancels a pending donation request. Only valid before a collector has confirmed it.
// The `eq('status', 'pending')` on the update makes this check atomic at the database level
// (not just a UI gate) — if a collector confirmed the pickup in between the screen loading
// and the user tapping Cancel, the update matches zero rows and this throws instead of
// silently cancelling a pickup that's already in progress.
export async function cancelDonationRequest(donationId: string, requestId?: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(donationId);

  const query = supabase.from('donations').update({ status: 'cancelled' }).eq('status', 'pending');
  const { data, error } = isUuid
    ? await query.eq('id', donationId).select()
    : requestId
    ? await query.eq('request_id', requestId).select()
    : { data: null, error: null };

  if (error) throw error;
  const cancelled = data?.[0];
  if (!cancelled) {
    throw new Error('This pickup has already been confirmed by a collector and can no longer be cancelled.');
  }

  try {
    await supabase
      .from('pickups')
      .update({ status: 'cancelled' })
      .eq('donation_id', cancelled.id);
  } catch {}

  try {
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
    if (admins) {
      await Promise.all(
        admins.map((admin: { id: string }) =>
          createNotification(
            admin.id,
            'Pickup Cancelled',
            `The ${cancelled.category} pickup (${cancelled.weight_kg} kg) scheduled for ${cancelled.pickup_day}, ${cancelled.time_slot} was cancelled by the donor.`,
            'CANCELLED'
          )
        )
      );
    }
  } catch {}
}

// Marks a pickup as completed/done directly from the admin routes list — a quicker path
// than the full Quality assessment flow. This is also what makes the pin disappear from
// the admin map, since PickupMapScreen only plots non-completed pickups.
export async function markDonationCompleted(donationId: string, collectorId?: string) {
  const { error } = await supabase
    .from('donations')
    .update({
      status: 'completed',
      is_picked_up: true,
      picked_up_at: new Date().toISOString(),
      collector_id: collectorId,
      confirmed_by: collectorId,
    })
    .eq('id', donationId);

  if (error) throw error;

  try {
    await supabase
      .from('pickups')
      .update({ status: 'completed', collector_id: collectorId })
      .or(`id.eq.${donationId},donation_id.eq.${donationId}`);
  } catch {}
}

export interface DonationRescheduleUpdates {
  category: string;
  weight_kg: number;
  pickup_day: string;
  time_slot: string;
  instructions: string;
  address: string;
}

// Edits a pending donation request's items/weight/schedule/address.
// Only valid before a collector has confirmed it — callers should gate this on
// status === 'pending' in the UI.
export async function rescheduleDonationRequest(donationId: string, updates: DonationRescheduleUpdates) {
  const { data, error } = await supabase
    .from('donations')
    .update({
      category: updates.category,
      weight_kg: updates.weight_kg || 1,
      estimated_quantity_kg: updates.weight_kg || 1,
      pickup_day: updates.pickup_day,
      time_slot: updates.time_slot,
      instructions: updates.instructions,
      address: updates.address,
    })
    .eq('id', donationId)
    .select()
    .single();

  if (error) throw error;

  // Keep the matching pickups row in sync so collectors see the updated details
  try {
    await supabase
      .from('pickups')
      .update({
        address: updates.address,
        weight_summary: `${updates.weight_kg || 1} kg`,
        time_window: updates.time_slot,
      })
      .eq('donation_id', donationId);
  } catch {}

  return data;
}

// ---------------------------------------------------------------------------
// PICKUPS API
// ---------------------------------------------------------------------------
export async function fetchActivePickups(): Promise<PickupJob[]> {
  const { data, error } = await supabase
    .from('pickups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as PickupJob[];
}

export async function updatePickupStatus(pickupId: string, status: PickupJob['status']) {
  const { data, error } = await supabase
    .from('pickups')
    .update({ status })
    .eq('id', pickupId)
    .select()
    .single();

  if (error) throw error;

  // Add notification if pickup status changes
  try {
    if (data?.donation_id) {
      const { data: donationData } = await supabase
        .from('donations')
        .select('donor_id, category')
        .eq('id', data.donation_id)
        .single();
      
      if (donationData?.donor_id) {
        await createNotification(
          donationData.donor_id,
          `Pickup Status: ${status.toUpperCase().replace('_', ' ')}`,
          `Your ${donationData.category || 'donation'} pickup status has been updated to ${status.replace('_', ' ')}.`,
          'LOGISTICS'
        );
      }
    }
  } catch {}

  return data;
}

export async function confirmPickupInSupabase(pickupOrDonationId: string, userId: string, requestId?: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pickupOrDonationId);
  const now = new Date().toISOString();

  // 1. Update donations table
  try {
    if (isUuid) {
      await supabase
        .from('donations')
        .update({
          confirmed_by: userId,
          collector_id: userId,
          confirmed_at: now,
          status: 'in_transit',
        })
        .eq('id', pickupOrDonationId);
    } else if (requestId) {
      await supabase
        .from('donations')
        .update({
          confirmed_by: userId,
          collector_id: userId,
          confirmed_at: now,
          status: 'in_transit',
        })
        .eq('request_id', requestId);
    }
  } catch {}

  // 2. Update pickups table
  try {
    if (isUuid) {
      await supabase
        .from('pickups')
        .update({
          collector_id: userId,
          confirmed_by: userId,
          status: 'in_transit',
        })
        .or(`id.eq.${pickupOrDonationId},donation_id.eq.${pickupOrDonationId}`);
    }
  } catch {}
}

export async function refusePickupInSupabase(pickupOrDonationId: string, userId: string, requestId?: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pickupOrDonationId);
  const now = new Date().toISOString();

  // 1. Reset donations table status so any collector can confirm again
  try {
    if (isUuid) {
      await supabase
        .from('donations')
        .update({
          status: 'pending',
          confirmed_by: null,
          collector_id: null,
          refused_by: userId,
          refused_at: now,
        })
        .eq('id', pickupOrDonationId);
    } else if (requestId) {
      await supabase
        .from('donations')
        .update({
          status: 'pending',
          confirmed_by: null,
          collector_id: null,
          refused_by: userId,
          refused_at: now,
        })
        .eq('request_id', requestId);
    }
  } catch {}

  // 2. Reset pickups table status
  try {
    if (isUuid) {
      await supabase
        .from('pickups')
        .update({
          status: 'pending',
          collector_id: null,
          confirmed_by: null,
          refused_by: userId,
        })
        .or(`id.eq.${pickupOrDonationId},donation_id.eq.${pickupOrDonationId}`);
    }
  } catch {}
}

// ---------------------------------------------------------------------------
// NOTIFICATIONS API
// ---------------------------------------------------------------------------
export async function createNotification(userId: string, title: string, body: string, tag: string = 'PICKUP') {
  const { data, error } = await supabase.from('notifications').insert([
    {
      user_id: userId,
      title,
      body,
      tag,
    },
  ]);
  if (error) throw error;
  return data;
}

export async function fetchUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function fetchUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
}


// ─── Waitlist, drop-off points & collection drives (migrations 020 / 022) ──────────────────────
export interface AreaRequest {
  id: string;
  full_name?: string;
  phone?: string;
  pincode: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface CollectionDrive {
  id: string;
  title: string;
  drive_date: string; // YYYY-MM-DD
  time_window?: string | null;
  location: string;
  pincode?: string | null;
  description?: string | null;
}

// Admin only in practice: RLS lets an admin session read every row, a donor only their own.
export async function fetchAreaRequests(): Promise<AreaRequest[]> {
  const { data, error } = await supabase
    .from('area_requests')
    .select('id, full_name, phone, pincode, address, latitude, longitude, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as AreaRequest[];
}

// Drives dated today or later, soonest first.
export async function fetchUpcomingDrives(): Promise<CollectionDrive[]> {
  const t = new Date();
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  const { data, error } = await supabase
    .from('collection_drives')
    .select('id, title, drive_date, time_window, location, pincode, description')
    .eq('is_active', true)
    .gte('drive_date', today)
    .order('drive_date', { ascending: true });
  if (error) throw error;
  return (data || []) as CollectionDrive[];
}

export async function addCollectionDrive(drive: Omit<CollectionDrive, 'id'>) {
  const { error } = await supabase.from('collection_drives').insert([drive]);
  if (error) throw error;
}

export async function updateCollectionDrive(id: string, drive: Omit<CollectionDrive, 'id'>) {
  const { error } = await supabase.from('collection_drives').update(drive).eq('id', id);
  if (error) throw error;
}

export async function removeCollectionDrive(id: string) {
  const { error } = await supabase.from('collection_drives').delete().eq('id', id);
  if (error) throw error;
}

// Every active drive (past ones too) for the admin list, soonest first.
export async function fetchAllDrives(): Promise<CollectionDrive[]> {
  const { data, error } = await supabase
    .from('collection_drives')
    .select('id, title, drive_date, time_window, location, pincode, description')
    .eq('is_active', true)
    .order('drive_date', { ascending: true });
  if (error) throw error;
  return (data || []) as CollectionDrive[];
}

export interface DropOffPoint {
  id: string;
  name: string;
  address: string;
  pincode?: string | null;
  start_date: string; // YYYY-MM-DD, first day it is open
  end_date: string; // YYYY-MM-DD, last day it is open
  open_time?: string | null; // "10:00 AM"
  close_time?: string | null;
  contact?: string | null;
  description?: string | null;
  is_active: boolean;
}

const DROP_OFF_COLUMNS = 'id, name, address, pincode, start_date, end_date, open_time, close_time, contact, description, is_active';

// Donor view: active points that haven't ended yet (still open, or opening soon), soonest end first.
export async function fetchActiveDropOffPoints(): Promise<DropOffPoint[]> {
  const t = new Date();
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  const { data, error } = await supabase
    .from('drop_off_points')
    .select(DROP_OFF_COLUMNS)
    .eq('is_active', true)
    .gte('end_date', today)
    .order('start_date', { ascending: true });
  if (error) throw error;
  return (data || []) as DropOffPoint[];
}

// Admin view: every point including paused and ended ones.
export async function fetchAllDropOffPoints(): Promise<DropOffPoint[]> {
  const { data, error } = await supabase
    .from('drop_off_points')
    .select(DROP_OFF_COLUMNS)
    .order('end_date', { ascending: false });
  if (error) throw error;
  return (data || []) as DropOffPoint[];
}

export async function addDropOffPoint(point: Omit<DropOffPoint, 'id'>) {
  const { error } = await supabase.from('drop_off_points').insert([point]);
  if (error) throw error;
}

export async function updateDropOffPoint(id: string, point: Partial<Omit<DropOffPoint, 'id'>>) {
  const { error } = await supabase.from('drop_off_points').update(point).eq('id', id);
  if (error) throw error;
}

export async function removeDropOffPoint(id: string) {
  const { error } = await supabase.from('drop_off_points').delete().eq('id', id);
  if (error) throw error;
}

// Admin "new area requests" badge: distinct unserviceable pincodes people asked for that the
// admin hasn't opened the Areas page for yet. "Seen" is kept per device.
const SEEN_AREA_PINCODES_KEY = '@punahchakra_seen_area_pincodes';

const readSeenAreaPincodes = async (): Promise<string[]> => {
  try {
    return JSON.parse((await AsyncStorage.getItem(SEEN_AREA_PINCODES_KEY)) || '[]');
  } catch {
    return [];
  }
};

export async function fetchNewAreaRequestPincodes(serviceable: string[]): Promise<string[]> {
  const [requests, seen] = await Promise.all([fetchAreaRequests().catch(() => [] as AreaRequest[]), readSeenAreaPincodes()]);
  const pins = Array.from(new Set(requests.map(r => r.pincode))).filter(p => !serviceable.includes(p));
  return pins.filter(p => !seen.includes(p));
}

export async function markAreaRequestPincodesSeen(pincodes: string[]) {
  const seen = await readSeenAreaPincodes();
  try {
    await AsyncStorage.setItem(SEEN_AREA_PINCODES_KEY, JSON.stringify(Array.from(new Set([...seen, ...pincodes]))));
  } catch {}
}

// Permanently deletes the signed-in user's account and all their data (delete-account edge
// function). Callers should sign out locally afterwards.
export async function deleteMyAccount() {
  const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
  if (!data?.deleted) throw new Error('Could not delete your account. Please try again.');
}

// ─── Admin-editable pickup time slots (app_settings, migration 023) ────────────────────────────
export async function refreshTimeSlots() {
  const { data, error } = await supabase.from('app_settings').select('value').eq('key', 'time_slots').maybeSingle();
  if (error || !data || !Array.isArray(data.value)) return;
  const slots = (data.value as unknown[]).filter((x): x is string => typeof x === 'string');
  if (slots.length > 0) applyTimeSlots(slots);
}

export async function saveTimeSlots(slots: string[]) {
  if (slots.length === 0) throw new Error('Keep at least one time slot.');
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key: 'time_slots', value: slots, updated_at: new Date().toISOString() });
  if (error) throw error;
  applyTimeSlots(slots);
}

// ─── Admin edits to any donor's pickup ─────────────────────────────────────────────────────────
// Unlike the donor's own reschedule these skip the seat check (admin override) and tell the donor.
export async function adminUpdateDonation(
  donation: DonationItem,
  updates: { pickup_day: string; time_slot: string; address: string; weight_kg: number }
) {
  const { error } = await supabase
    .from('donations')
    .update({
      pickup_day: updates.pickup_day,
      time_slot: updates.time_slot,
      address: updates.address,
      weight_kg: updates.weight_kg || 1,
      estimated_quantity_kg: updates.weight_kg || 1,
    })
    .eq('id', donation.id);
  if (error) throw error;

  try {
    await supabase
      .from('pickups')
      .update({ address: updates.address, weight_summary: `${updates.weight_kg || 1} kg`, time_window: updates.time_slot })
      .eq('donation_id', donation.id);
  } catch {}

  if (donation.donor_id) {
    try {
      await createNotification(
        donation.donor_id,
        'Pickup Updated',
        `Your ${donation.category} pickup is now scheduled for ${updates.pickup_day} (${updates.time_slot}).`,
        'UPDATE'
      );
    } catch {}
  }
}

export async function adminCancelDonation(donation: DonationItem) {
  const { error } = await supabase.from('donations').update({ status: 'cancelled' }).eq('id', donation.id);
  if (error) throw error;
  try {
    await supabase.from('pickups').update({ status: 'cancelled' }).eq('donation_id', donation.id);
  } catch {}
  if (donation.donor_id) {
    try {
      await createNotification(
        donation.donor_id,
        'Pickup Cancelled',
        `Your ${donation.category} pickup for ${donation.pickup_day}, ${donation.time_slot} was cancelled by PunahChakra. Please book a new slot.`,
        'CANCELLED'
      );
    } catch {}
  }
}

// Admin analytics: total non-admin users, and how many joined in the last 7 days.
export async function fetchUserCounts(): Promise<{ total: number; newThisWeek: number }> {
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const [all, recent] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'admin'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('role', 'admin').gte('created_at', since),
  ]);
  return { total: all.count ?? 0, newThisWeek: recent.count ?? 0 };
}
