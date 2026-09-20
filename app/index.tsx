import { useEffect } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { handleOAuthRedirectUrl } from "../services/auth";
import { LoadingView } from "../components/LoadingView";

export default function Index() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const profile = useAuthStore((s) => s.profile);
  const isLoaded = useOnboardingStore((s) => s.isLoaded);
  const permissionsDone = useOnboardingStore((s) => s.permissionsDone);

  useEffect(() => {
    if (isLoading || !isLoaded) return;

    let isMounted = true;

    async function routeUser() {
      // 1. If cold launched with an OAuth redirect URL, handle it immediately
      try {
        const initialUrl =
          Platform.OS === "web" && typeof window !== "undefined"
            ? window.location.href
            : await Linking.getInitialURL();

        if (initialUrl && (initialUrl.includes("code=") || initialUrl.includes("access_token="))) {
          const res = await handleOAuthRedirectUrl(initialUrl);
          if (res?.profile && isMounted) {
            const role = res.profile.role;
            if (role === "kabadiwala") {
              router.replace("/(kabadiwala)/dashboard");
            } else if (role === "officer") {
              router.replace("/(officer)/dashboard");
            } else {
              router.replace("/(customer)/dashboard");
            }
            return;
          }
        }
      } catch {}

      if (!isMounted) return;

      // 2. If user is authenticated, route immediately to their dashboard
      if (profile) {
        const storedRole = await AsyncStorage.getItem("@kawa_intended_role").catch(() => null);
        const targetRole = storedRole || profile.role;
        if (targetRole === "kabadiwala") {
          router.replace("/(kabadiwala)/dashboard");
        } else if (targetRole === "officer") {
          router.replace("/(officer)/dashboard");
        } else {
          router.replace("/(customer)/dashboard");
        }
        return;
      }

      // 3. If not authenticated:
      // If permissions were already done in this app session, do not ask again
      if (permissionsDone) {
        router.replace("/(auth)/role-select");
      } else {
        // Cold start / fresh open: start with Language Selection
        router.replace("/(auth)/language-select");
      }
    }

    routeUser();

    // Safety timeout: Never stay stuck on loading view for more than 1.5 seconds!
    const safetyTimer = setTimeout(async () => {
      if (!isMounted) return;
      const currentProf = useAuthStore.getState().profile;
      if (currentProf) {
        const storedRole = await AsyncStorage.getItem("@kawa_intended_role").catch(() => null);
        const targetRole = storedRole || currentProf.role;
        if (targetRole === "kabadiwala") {
          router.replace("/(kabadiwala)/dashboard");
        } else if (targetRole === "officer") {
          router.replace("/(officer)/dashboard");
        } else {
          router.replace("/(customer)/dashboard");
        }
      } else {
        if (permissionsDone) {
          router.replace("/(auth)/role-select");
        } else {
          router.replace("/(auth)/language-select");
        }
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
    };
  }, [isLoading, isLoaded, profile, permissionsDone]);

  return <LoadingView />;
}
