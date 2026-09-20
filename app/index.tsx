import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { LoadingView } from "../components/LoadingView";

export default function Index() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const permissionsDone = useOnboardingStore((s) => s.permissionsDone);

  useEffect(() => {
    if (isLoading) return;

    // Always start fresh on app restart so testing different roles is instant
    if (!permissionsDone) {
      router.replace("/(auth)/language-select");
    } else {
      router.replace("/(auth)/role-select");
    }
  }, [isLoading, permissionsDone]);

  return <LoadingView />;
}
