import { useEffect } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
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
        if (profile.role === "kabadiwala") {
          router.replace("/(kabadiwala)/dashboard");
        } else if (profile.role === "officer") {
          router.replace("/(officer)/dashboard");
        } else {
          router.replace("/(customer)/dashboard");
        }
        return;
      }

      // 3. If not authenticated:
      // If permissions / language were completed previously, go straight to role select
      if (permissionsDone) {
        router.replace("/(auth)/role-select");
      } else {
        // First-time app launch only
        router.replace("/(auth)/language-select");
      }
    }

    routeUser();

    return () => {
      isMounted = false;
    };
  }, [isLoading, isLoaded, profile, permissionsDone]);

  return <LoadingView />;
}
