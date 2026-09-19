import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import { getCurrentProfile } from "../services/auth";

export interface Profile {
  id: string;
  role: "customer" | "kabadiwala" | "officer";
  name: string | null;
  phone: string | null;
  language: string | null;
  photo_url: string | null;
  verified: boolean;
  rating: number;
  push_token?: string | null;
  gov_id_number?: string | null;
  department?: string | null;
}

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isLoading: true,

  initialize: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session });

    if (session) {
      const profile = await getCurrentProfile();
      set({ profile: profile as Profile | null });
    }
    set({ isLoading: false });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session });
      if (session) {
        const profile = await getCurrentProfile();
        set({ profile: profile as Profile | null });
      } else {
        set({ profile: null });
      }
    });
  },

  refreshProfile: async () => {
    if (!get().session) return;
    const profile = await getCurrentProfile();
    set({ profile: profile as Profile | null });
  },

  reset: () => set({ session: null, profile: null }),
}));
