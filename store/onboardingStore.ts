import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Role } from "../services/auth";

const LANGUAGE_KEY = "kawa:language";
const PERMISSIONS_DONE_KEY = "kawa:permissionsDone";

interface OnboardingState {
  selectedRole: Role | null;
  language: string;
  permissionsDone: boolean;
  setSelectedRole: (role: Role) => void;
  loadPersisted: () => Promise<void>;
  setLanguage: (lang: string) => Promise<void>;
  markPermissionsDone: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  selectedRole: null,
  language: "en",
  permissionsDone: false,

  setSelectedRole: (role) => set({ selectedRole: role }),

  loadPersisted: async () => {
    const [language, permissionsDone] = await Promise.all([
      AsyncStorage.getItem(LANGUAGE_KEY),
      AsyncStorage.getItem(PERMISSIONS_DONE_KEY),
    ]);
    set({
      language: language ?? "en",
      permissionsDone: permissionsDone === "true",
    });
  },

  setLanguage: async (lang) => {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    set({ language: lang });
  },

  markPermissionsDone: async () => {
    await AsyncStorage.setItem(PERMISSIONS_DONE_KEY, "true");
    set({ permissionsDone: true });
  },
}));
