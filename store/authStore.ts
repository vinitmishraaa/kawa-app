import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { getCurrentProfile } from "../services/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Profile {
  id: string;
  role: "customer" | "kabadiwala" | "officer";
  name: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  language?: string | null;
  photo_url?: string | null;
  shop_photo_url?: string | null;
  shop_name?: string | null;
  verified: boolean;
  rating: number;
  push_token?: string | null;
  gov_id_number?: string | null;
  department?: string | null;
  price_rates?: Record<string, number> | null;
}

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
    // Start fresh on app launch so testing different roles is immediate
    set({ session: null, profile: null, isLoading: false });
  },

  refreshProfile: async () => {
    const currentSession = get().session;
    if (!currentSession) return;
    try {
      const profile = await getCurrentProfile();
      if (profile) {
        set({ profile: profile as Profile });
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

    // Sync to Supabase in background
    try {
      await supabase.from("profiles").update(partial).eq("id", current.id);
    } catch {}
  },

  reset: () => {
    AsyncStorage.multiRemove([
      LOCAL_SESSION_KEY,
      LOCAL_PROFILE_KEY,
      "@kawa_supabase_session",
      "supabase.auth.token",
    ]).catch(() => {});
    set({ session: null, profile: null });
  },
}));
