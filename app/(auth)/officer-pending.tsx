import { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { LoadingView } from "../../components/LoadingView";
import { theme } from "../../constants/theme";
import { getOfficerVerification } from "../../services/queries/officer";
import { useAuthStore } from "../../store/authStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import { signOut } from "../../services/auth";

export default function OfficerPending() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const reset = useAuthStore((s) => s.reset);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await refreshProfile();
      const currentProfile = useAuthStore.getState().profile;
      if (currentProfile?.verified) {
        router.replace("/(officer)/dashboard");
        return;
      }
      const verification = await getOfficerVerification(profile.id);
      setStatus(verification?.status ?? "pending");
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setLoading(false);
    }
  }, [profile, refreshProfile, t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function logout() {
    await signOut().catch(() => {});
    reset();
    router.replace("/(auth)/role-select");
  }

  if (loading) return <LoadingView />;

  const icon = status === "rejected" ? "close-circle-outline" : status === "approved" ? "check-circle-outline" : "clock-outline";
  const title = status === "rejected"
    ? t("officer.rejectedTitle")
    : status === "approved"
      ? t("officer.approvedTitle")
      : t("officer.pendingTitle");
  const body = status === "rejected"
    ? t("officer.rejectedBody")
    : status === "approved"
      ? t("officer.approvedBody")
      : t("officer.pendingBody");

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-leafLight items-center justify-center mb-5">
          <MaterialCommunityIcons name={icon as any} size={40} color={theme.leaf} />
        </View>
        <Text className="text-2xl font-bold text-bark text-center">{title}</Text>
        <Text className="text-base text-bark/70 text-center mt-3 mb-8 px-5">{body}</Text>
        <View className="w-full">
          <PrimaryButton label={t("officer.checkStatus")} onPress={load} />
        </View>
        {status === "rejected" && (
          <View className="w-full mt-3">
            <PrimaryButton
              label={t("officer.resubmit")}
              onPress={() => router.replace("/(auth)/officer-verification")}
              variant="secondary"
            />
          </View>
        )}
        <View className="w-full mt-3">
          <PrimaryButton label={t("common.logout")} onPress={logout} variant="secondary" />
        </View>
      </View>
    </ScreenContainer>
  );
}
