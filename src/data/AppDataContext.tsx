/**
 * AppDataContext — central data layer for PunahChakra.
 * All data is fetched from / persisted to the backend.
 * The word "Supabase" is intentionally never shown in UI.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  supabase,
  fetchUserProfile,
  fetchUserDonations,
  fetchActivePickups,
  fetchUserNotifications,
  createDonationRequest,
  updateUserProfile as apiUpdateProfile,
  type UserProfile,
  type DonationItem,
  type PickupJob,
} from '../services/api';

// ─── Types ─────────────────────────────────────────────────────────────────
export type AppRole = 'donor' | 'collector' | 'recycler';

export type AuthUser = {
  id: string;
  email: string;
  role: AppRole;
  full_name: string;
};

type AppState = {
  authUser: AuthUser | null;
  profile: UserProfile | null;
  donations: DonationItem[];
  pickups: PickupJob[];
  notifications: any[];
  loading: boolean;
  // actions
  signOut: () => Promise<void>;
  refreshDonations: () => Promise<void>;
  refreshPickups: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  saveDonation: (d: Omit<DonationItem, 'id' | 'status' | 'points_awarded'>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
};

const AppDataContext = createContext<AppState | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────
export const AppDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [donations, setDonations] = useState<DonationItem[]>([]);
  const [pickups, setPickups] = useState<PickupJob[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Bootstrap current session on mount ────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadUserData(session.user.id, session.user.email || '');
        }
      } catch {
        // No active session – fine, user will log in
      } finally {
        setLoading(false);
      }
    };
    init();

    // Listen for auth state changes (sign in / sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await loadUserData(session.user.id, session.user.email || '');
        } else {
          setAuthUser(null);
          setProfile(null);
          setDonations([]);
          setPickups([]);
          setNotifications([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId: string, email: string) => {
    try {
      const [profileData, donationsData, pickupsData, notifData] = await Promise.all([
        fetchUserProfile(userId),
        fetchUserDonations(userId),
        fetchActivePickups(),
        fetchUserNotifications(userId),
      ]);

      const role: AppRole = (profileData?.role as AppRole) || 'donor';
      setAuthUser({
        id: userId,
        email: profileData?.email || email,
        role,
        full_name: profileData?.full_name || email.split('@')[0],
      });
      setProfile(profileData);
      setDonations(donationsData);
      setPickups(pickupsData);
      setNotifications(notifData);
    } catch {
      // Non-fatal – context stays empty, screens fall back gracefully
    }
  };

  // ── Public actions ──────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshDonations = useCallback(async () => {
    if (!authUser) return;
    const data = await fetchUserDonations(authUser.id);
    setDonations(data);
  }, [authUser]);

  const refreshPickups = useCallback(async () => {
    const data = await fetchActivePickups();
    setPickups(data);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!authUser) return;
    const data = await fetchUserProfile(authUser.id);
    setProfile(data);
  }, [authUser]);

  const saveDonation = useCallback(
    async (donation: Omit<DonationItem, 'id' | 'status' | 'points_awarded'>) => {
      if (!authUser) return;
      await createDonationRequest(donation, authUser.id);
      await refreshDonations();
    },
    [authUser, refreshDonations]
  );

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!authUser) return;
      const updated = await apiUpdateProfile(authUser.id, updates);
      setProfile(updated);
    },
    [authUser]
  );

  return (
    <AppDataContext.Provider
      value={{
        authUser,
        profile,
        donations,
        pickups,
        notifications,
        loading,
        signOut,
        refreshDonations,
        refreshPickups,
        refreshProfile,
        saveDonation,
        updateProfile,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

// ─── Hook ───────────────────────────────────────────────────────────────────
export const useAppData = () => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
};

// Legacy compat – kept so old imports don't break immediately
export type Donation = DonationItem;
