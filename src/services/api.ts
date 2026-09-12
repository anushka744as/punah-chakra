import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  role?: 'user' | 'admin';
  available_slots?: string[];
}

export interface DonationItem {
  id: string;
  donor_id?: string;
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

// Sends an SMS OTP to `phone` (E.164 format, e.g. +919876543210), creating the auth
// user on first use. `fullName` is stashed in user metadata so the handle_new_user DB
// trigger can populate profiles.full_name as soon as the auth user row is created —
// verifyPhoneOtp below also upserts it explicitly once we have a session.
export async function sendPhoneOtp(phone: string, fullName?: string) {
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: fullName ? { data: { full_name: fullName } } : undefined,
  });

  if (error) throw error;
}

export async function verifyPhoneOtp(phone: string, token: string, fullName?: string, email?: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) throw error;

  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: email || data.user.email || '',
      full_name: fullName || data.user.user_metadata?.full_name || '',
      phone,
      role: 'user',
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
    .single();

  if (error) throw error;
  return data;
}

// Admin-configured availability for one specific calendar day (day_availability table).
// No row for a date means it's fully open (fail-open) — same default as the old flat
// per-admin slot list this replaces.
export async function fetchDayAvailability(day: string): Promise<{ slots: string[]; isClosed: boolean }> {
  const { data } = await supabase
    .from('day_availability')
    .select('available_slots, is_closed')
    .eq('day', day)
    .maybeSingle();

  return {
    slots: (data as any)?.available_slots || [],
    isClosed: Boolean((data as any)?.is_closed),
  };
}

// All configured day_availability rows in a date range (inclusive), keyed by day —
// used by the admin calendar to mark which dates already have custom availability set.
export async function fetchMonthAvailability(
  startDay: string,
  endDay: string
): Promise<Record<string, { slots: string[]; isClosed: boolean }>> {
  const { data } = await supabase
    .from('day_availability')
    .select('day, available_slots, is_closed')
    .gte('day', startDay)
    .lte('day', endDay);

  const map: Record<string, { slots: string[]; isClosed: boolean }> = {};
  ((data || []) as any[]).forEach((row) => {
    map[row.day] = { slots: row.available_slots || [], isClosed: Boolean(row.is_closed) };
  });
  return map;
}

// Admin saves which slots are open (and/or closes the whole day) for one calendar date.
export async function upsertDayAvailability(day: string, slots: string[], isClosed: boolean) {
  const { data, error } = await supabase
    .from('day_availability')
    .upsert(
      { day, available_slots: slots, is_closed: isClosed, updated_at: new Date().toISOString() },
      { onConflict: 'day' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Slots a donor may pick for a given pickup day: slots the admin opened for that specific
// date (fail-open if unconfigured), minus slots another active (non-cancelled) donation
// has already booked for that same day. `excludeDonationId` lets a donor keep their own
// slot while rescheduling/editing an existing request.
export async function fetchSlotAvailability(
  pickupDay: string,
  excludeDonationId?: string
): Promise<{ availableSlots: string[]; bookedSlots: string[]; isClosed: boolean }> {
  const [{ slots, isClosed }, { data: bookings }] = await Promise.all([
    fetchDayAvailability(pickupDay),
    supabase.from('donations').select('id, time_slot').eq('pickup_day', pickupDay).neq('status', 'cancelled'),
  ]);

  const bookedSlots = ((bookings || []) as any[])
    .filter((b) => b.id !== excludeDonationId)
    .map((b) => b.time_slot)
    .filter(Boolean);

  return { availableSlots: slots, bookedSlots, isClosed };
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
        status: 'pending',
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // 3. Also insert corresponding pickup job for collectors
  try {
    const currentProfile = await fetchUserProfile(donorId);
    await supabase.from('pickups').insert([
      {
        donation_id: data.id,
        donor_name: currentProfile?.full_name || 'PunahChakra Donor',
        donor_phone: currentProfile?.phone || '',
        address: donation.address,
        zone: 'Noida Sector 15A & 44',
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
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
    if (admins) {
      await Promise.all(
        admins.map((admin: { id: string }) =>
          createNotification(
            admin.id,
            'Pickup Scheduled',
            `Pickup scheduled for ${donation.category} (${donation.weight_kg || 1} kg) on ${donation.pickup_day} at ${donation.time_slot} — ${donation.address}.`,
            'PICKUP SCHEDULED'
          )
        )
      );
    }
  } catch {}

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
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as DonationItem[];
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
