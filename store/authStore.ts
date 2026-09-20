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
    try {
      // 1. Fast path: load local cached session
      const [storedSession, storedProfile] = await Promise.all([
        AsyncStorage.getItem(LOCAL_SESSION_KEY),
        AsyncStorage.getItem(LOCAL_PROFILE_KEY),
      ]);
      const session = storedSession ? JSON.parse(storedSession) : null;
      const profile = storedProfile ? JSON.parse(storedProfile) : null;
      if (profile) {
        set({ session, profile, isLoading: false });
      } else {
        set({ session: null, profile: null, isLoading: false });
      }

      // 2. Direct Supabase verification
      const { data: { session: supaSession } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (supaSession?.user && !profile) {
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", supaSession.user.id)
          .maybeSingle();

        const activeProfile: Profile = dbProfile ? {
          ...dbProfile,
          email: supaSession.user.email,
        } : {
          id: supaSession.user.id,
          role: "customer",
          name: supaSession.user.user_metadata?.full_name || supaSession.user.user_metadata?.name || supaSession.user.email?.split("@")[0] || "User",
          email: supaSession.user.email,
          phone: supaSession.user.phone || null,
          photo_url: supaSession.user.user_metadata?.avatar_url || null,
          verified: true,
          rating: 5,
        };

        set({ session: supaSession, profile: activeProfile, isLoading: false });
        AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(supaSession)).catch(() => {});
        AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(activeProfile)).catch(() => {});
      }
    } catch {
      set({ session: null, profile: null, isLoading: false });
    }
  },

  refreshProfile: async () => {
    const currentSession = get().session;
    if (!currentSession) return;
    try {
      const profile = await getCurrentProfile();
      if (profile) {
        set({ profile: profile as Profile });
        AsyncStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile)).catch(() => {});
      }
    } catch {
      // Retain active profile on network failure
    }
  },

  setSessionAndProfile: async (session: any, profile: Profile) => {
    set({ session, profile, isLoading: false });
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
    set({ session: null, profile: null, isLoading: false });
  },
}));

// Real-time listener for Supabase authentication state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
    let profileData: any = null;
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      if (data) {
        profileData = { ...data, email: session.user.email };
      }
    } catch {}

    if (!profileData) {
      profileData = {
        id: session.user.id,
        role: "customer",
        name:
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split("@")[0] ||
          "Google User",
        email: session.user.email,
        phone: session.user.phone || null,
        photo_url: session.user.user_metadata?.avatar_url || null,
        verified: true,
        rating: 5,
      };
      try {
        await supabase.from("profiles").upsert({
          id: profileData.id,
          role: profileData.role,
          name: profileData.name,
          phone: profileData.phone,
          photo_url: profileData.photo_url,
          verified: true,
          rating: 5,
        }, { onConflict: "id" });
      } catch {}
    }

    useAuthStore.getState().setSessionAndProfile(session, profileData);
  } else if (event === "SIGNED_OUT") {
    useAuthStore.getState().reset();
  }
});
