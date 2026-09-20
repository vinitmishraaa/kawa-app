import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Role } from "../services/auth";

import i18n from "../i18n";

const LANGUAGE_KEY = "kawa:language";
const PERMISSIONS_DONE_KEY = "kawa:permissionsDone";

interface OnboardingState {
  selectedRole: Role | null;
  language: string;
  permissionsDone: boolean;
  isLoaded: boolean;
  setSelectedRole: (role: Role) => void;
  loadPersisted: () => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  markPermissionsDone: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  selectedRole: null,
  language: "en",
  permissionsDone: false,
  isLoaded: false,

  setSelectedRole: (role) => set({ selectedRole: role }),

  loadPersisted: async () => {
    try {
      const language = await AsyncStorage.getItem(LANGUAGE_KEY);
      const finalLang = language ?? "en";
      try {
        i18n.changeLanguage(finalLang);
      } catch {}
      set({
        language: finalLang,
        permissionsDone: false, // Cold start always starts false
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  setLanguage: async (lang) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang).catch(() => {});
    try {
      i18n.changeLanguage(lang);
    } catch {}
    set({ language: lang });
  },

  markPermissionsDone: async () => {
    set({ permissionsDone: true });
  },
}));
