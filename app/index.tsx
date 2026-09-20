import { useEffect } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";
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
    let isMounted = true;

    async function routeUser() {
      // 1. Check if launched with an OAuth redirect URL
      let initialUrl: string | null = null;
      try {
        initialUrl =
          Platform.OS === "web" && typeof window !== "undefined"
            ? window.location.href
            : await Linking.getInitialURL();
      } catch {}

      const isOAuth =
        Boolean(initialUrl && (initialUrl.includes("code=") || initialUrl.includes("access_token="))) ||
        (Platform.OS === "web" &&
          typeof window !== "undefined" &&
          (window.location.search.includes("code=") || window.location.hash.includes("access_token")));

      if (isOAuth && initialUrl) {
        try {
          const res = await handleOAuthRedirectUrl(initialUrl);
          if (res?.profile && isMounted) {
            if (Platform.OS === "web" && typeof window !== "undefined") {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            const storedRole = await AsyncStorage.getItem("@kawa_intended_role").catch(() => null);
            const targetRole = storedRole || res.profile.role;
            if (targetRole === "kabadiwala") {
              router.replace("/(kabadiwala)/dashboard");
            } else if (targetRole === "officer") {
              router.replace("/(officer)/dashboard");
            } else {
              router.replace("/(customer)/dashboard");
            }
            return;
          }
        } catch (e) {
          console.warn("[OAuth] Route redirect handling error:", e);
        }
      }

      // 2. Wait for authStore and onboardingStore initialization
      if (isLoading || !isLoaded) return;

      // 3. Check active profile or restore Supabase session
      let activeProfile = profile;
      if (!activeProfile) {
        const { data: supaSession } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        if (supaSession?.session?.user) {
          const user = supaSession.session.user;
          const storedRole = ((await AsyncStorage.getItem("@kawa_intended_role").catch(() => null)) as any) || "customer";
          const dbPayload = {
            id: user.id,
            role: storedRole,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
            phone: user.phone || null,
            photo_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
            verified: true,
            rating: 5,
          };
          try {
            await supabase.from("profiles").upsert(dbPayload, { onConflict: "id" });
          } catch {}
          activeProfile = { ...dbPayload, email: user.email } as any;
          await useAuthStore.getState().setSessionAndProfile(supaSession.session, activeProfile as any);
        }
      }

      if (activeProfile && isMounted) {
        const storedRole = await AsyncStorage.getItem("@kawa_intended_role").catch(() => null);
        const targetRole = storedRole || activeProfile.role;
        if (targetRole === "kabadiwala") {
          router.replace("/(kabadiwala)/dashboard");
        } else if (targetRole === "officer") {
          router.replace("/(officer)/dashboard");
        } else {
          router.replace("/(customer)/dashboard");
        }
        return;
      }

      if (!isMounted) return;

      // 4. If not authenticated:
      if (permissionsDone) {
        router.replace("/(auth)/role-select");
      } else {
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
