import { createClient } from '@supabase/supabase-js';

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
    persistSession: true,
    autoRefreshToken: true,
  },
});

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string;
  role?: 'donor' | 'collector' | 'recycler';
  points?: number;
  co2_offset_kg?: number;
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
  status: 'scheduled' | 'assigned' | 'in_transit' | 'collected' | 'assessed' | 'completed' | 'cancelled';
  points_awarded: number;
  created_at?: string;
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
export async function signUpUser(email: string, password: string, fullName: string, role: 'donor' | 'collector' | 'recycler') {
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
      points: 0,
      co2_offset_kg: 0,
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

export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

export interface CategoryPoints {
  id?: string;
  category: string;
  base_points: number;
  points_per_kg: number;
  co2_factor_per_kg: number;
  description?: string;
}

const DEFAULT_CATEGORY_POINTS: Record<string, CategoryPoints> = {
  CLOTHES: { category: 'CLOTHES', base_points: 300, points_per_kg: 60, co2_factor_per_kg: 2.5 },
  'E-WASTE': { category: 'E-WASTE', base_points: 500, points_per_kg: 120, co2_factor_per_kg: 4.0 },
  PAPER: { category: 'PAPER', base_points: 150, points_per_kg: 40, co2_factor_per_kg: 1.2 },
  SHOES: { category: 'SHOES', base_points: 250, points_per_kg: 50, co2_factor_per_kg: 2.0 },
  OTHERS: { category: 'OTHERS', base_points: 100, points_per_kg: 30, co2_factor_per_kg: 1.0 },
};

export async function fetchCategoryPoints(): Promise<CategoryPoints[]> {
  try {
    const { data, error } = await supabase.from('category_points').select('*');
    if (error || !data || data.length === 0) {
      return Object.values(DEFAULT_CATEGORY_POINTS);
    }
    return data as CategoryPoints[];
  } catch {
    return Object.values(DEFAULT_CATEGORY_POINTS);
  }
}

export async function calculateRewardForCategory(categoryStr: string, weightKg: number) {
  const pointsRules = await fetchCategoryPoints();
  const matchedKey = categoryStr.toUpperCase().trim();
  const rule = pointsRules.find(r => r.category.toUpperCase() === matchedKey)
    || DEFAULT_CATEGORY_POINTS[matchedKey]
    || DEFAULT_CATEGORY_POINTS['OTHERS'];

  const weight = Math.max(weightKg || 1, 1);
  const pointsAwarded = rule.base_points + Math.round(weight * rule.points_per_kg);
  const co2OffsetKg = Math.round((weight * rule.co2_factor_per_kg) * 100) / 100;

  return { pointsAwarded, co2OffsetKg };
}

// ---------------------------------------------------------------------------
// DONATIONS API
// ---------------------------------------------------------------------------
export async function createDonationRequest(donation: Omit<DonationItem, 'id' | 'status' | 'points_awarded'>, donorId: string) {
  // 1. Calculate dynamic points & CO2 offset from category_points table
  const { pointsAwarded, co2OffsetKg } = await calculateRewardForCategory(
    donation.category,
    donation.weight_kg || 1
  );

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
        status: 'scheduled',
        points_awarded: pointsAwarded,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // 3. Update donor's profile points & CO2 offset in profiles table
  try {
    const currentProfile = await fetchUserProfile(donorId);
    if (currentProfile) {
      const newPoints = (currentProfile.points || 0) + pointsAwarded;
      const newCo2 = Math.round(((currentProfile.co2_offset_kg || 0) + co2OffsetKg) * 100) / 100;

      await supabase
        .from('profiles')
        .update({ points: newPoints, co2_offset_kg: newCo2 })
        .eq('id', donorId);
    }
  } catch {}

  // 4. Also insert corresponding pickup job for collectors
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

  // 5. Create a notification in Supabase for the donor
  try {
    await createNotification(
      donorId,
      'Pickup Request Scheduled',
      `Your request for ${donation.category} pickup has been confirmed for ${donation.pickup_day} (${donation.time_slot}). Earned +${pointsAwarded} impact pts!`,
      'PICKUP REMINDER'
    );
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
          status: 'scheduled',
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
          status: 'scheduled',
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
