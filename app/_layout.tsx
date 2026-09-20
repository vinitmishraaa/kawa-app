import "../global.css";
import "../i18n";

import { useEffect, useState } from "react";
import { LogBox } from "react-native";
import { Stack, router } from "expo-router";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { handleOAuthRedirectUrl } from "../services/auth";

LogBox.ignoreAllLogs(true);

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden or unsupported
});

export default function RootLayout() {
  const initialize = useAuthStore((s) => s.initialize);
  const isLoading = useAuthStore((s) => s.isLoading);

  const loadPersisted = useOnboardingStore((s) => s.loadPersisted);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);

  useEffect(() => {
    initialize();

    loadPersisted().then(() => {
      setOnboardingLoaded(true);
    });
  }, [initialize, loadPersisted]);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      if (event.url && (event.url.includes("code=") || event.url.includes("access_token="))) {
        try {
          const res = await handleOAuthRedirectUrl(event.url);
          if (res?.profile) {
            const role = res.profile.role;
            if (role === "kabadiwala") {
              router.replace("/(kabadiwala)/dashboard");
            } else if (role === "officer") {
              router.replace("/(officer)/dashboard");
            } else {
              router.replace("/(customer)/dashboard");
            }
          }
        } catch (e) {
          console.warn("[OAuth] Deep link error:", e);
        }
      }
    };

    const sub = Linking.addEventListener("url", handleDeepLink);
    return () => {
      sub.remove();
    };
  }, []);

  /*
   * Push notifications
   *
   * IMPORTANT:
   * We intentionally do NOT import expo-notifications at the top
   * of this file. Expo Go on Android does not support remote push
   * notification registration.
   *
   * For now, the app works normally in Expo Go.
   *
   * Later, when running a development build, notification support
   * can be enabled here.
   */


  useEffect(() => {
    if (!isLoading && onboardingLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading, onboardingLoaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(kabadiwala)" />
          <Stack.Screen name="(officer)" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}