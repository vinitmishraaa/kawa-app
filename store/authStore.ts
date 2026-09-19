import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { getCurrentProfile } from "../services/auth";

export interface Profile {
  id: string;
  role: "customer" | "kabadiwala" | "officer";
  name: string | null;
  phone?: string | null;
  language?: string | null;
  photo_url?: string | null;
  verified: boolean;
  rating: number;
  push_token?: string | null;
  gov_id_number?: string | null;
  department?: string | null;
  price_rates?: Record<string, number> | null;
}

import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCAL_SESSION_KEY = "@kawa_local_session";
const LOCAL_PROFILE_KEY = "@kawa_local_profile";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSessionAndProfile: (session: any, profile: Profile) => Promise<void>;
  updateProfile: (partial: Partial<Profile>) => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        set({ session });
        const profile = await getCurrentProfile();
        if (profile) {
          set({ profile: profile as Profile });
          await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile)).catch(() => {});
          await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session)).catch(() => {});
        }
      } else {
        // Check for persisted local fallback session
        const [savedSessionStr, savedProfileStr] = await Promise.all([
          AsyncStorage.getItem(LOCAL_SESSION_KEY).catch(() => null),
          AsyncStorage.getItem(LOCAL_PROFILE_KEY).catch(() => null),
        ]);

        if (savedProfileStr) {
          try {
            const savedProfile = JSON.parse(savedProfileStr);
            const savedSession = savedSessionStr ? JSON.parse(savedSessionStr) : null;
            set({ profile: savedProfile, session: savedSession });
          } catch {}
        }
      }
    } catch {
      // Offline fallback
    } finally {
      set({ isLoading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        set({ session });
        const profile = await getCurrentProfile();
        if (profile) {
          set({ profile: profile as Profile });
          await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile)).catch(() => {});
          await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session)).catch(() => {});
        }
      } else {
        // Only clear if no local fallback is active
        const hasLocal = await AsyncStorage.getItem(LOCAL_SESSION_KEY).catch(() => null);
        if (!hasLocal) {
          set({ session: null, profile: null });
        }
      }
    });
  },

  refreshProfile: async () => {
    const currentSession = get().session;
    if (!currentSession) return;
    try {
      const profile = await getCurrentProfile();
      if (profile) {
        set({ profile: profile as Profile });
        await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile)).catch(() => {});
      }
    } catch {
      // Retain active profile on network failure
    }
  },

  setSessionAndProfile: async (session: any, profile: Profile) => {
    set({ session, profile });
    await Promise.all([
      AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session)).catch(() => {}),
      AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile)).catch(() => {}),
    ]);
  },

  updateProfile: async (partial: Partial<Profile>) => {
    const current = get().profile;
    if (!current) return;
    const updated = { ...current, ...partial };
    set({ profile: updated });
    await AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(updated)).catch(() => {});
  },

  reset: () => {
    AsyncStorage.removeItem(LOCAL_SESSION_KEY).catch(() => {});
    AsyncStorage.removeItem(LOCAL_PROFILE_KEY).catch(() => {});
    set({ session: null, profile: null });
  },
}));
