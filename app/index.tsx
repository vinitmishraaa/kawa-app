import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { LoadingView } from "../components/LoadingView";

export default function Index() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const permissionsDone = useOnboardingStore((s) => s.permissionsDone);

  useEffect(() => {
    if (isLoading) return;

    if (!session || !profile) {
      router.replace("/(auth)/role-select");
      return;
    }

    if (profile.role === "officer" && !profile.verified) {
      router.replace("/(auth)/officer-pending");
      return;
    }

    if (!permissionsDone) {
      router.replace("/(auth)/language-select");
      return;
    }

    if (profile.role === "customer") {
      router.replace("/(customer)/dashboard");
    } else if (profile.role === "kabadiwala") {
      router.replace("/(kabadiwala)/dashboard");
    } else {
      router.replace("/(officer)/dashboard");
    }
  }, [isLoading, session, profile, permissionsDone]);

  return <LoadingView />;
}
