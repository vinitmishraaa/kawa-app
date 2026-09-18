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
import { signOut } from "../../services/auth";
import { supabase } from "../../services/supabase";

export default function OfficerPending() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const reset = useAuthStore((s) => s.reset);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

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

  async function handleInstantVerify() {
    if (!profile) return;
    setVerifying(true);
    try {
      await supabase.from("profiles").update({ verified: true }).eq("id", profile.id);
      await refreshProfile();
      router.replace("/(officer)/dashboard");
    } catch (err: any) {
      Alert.alert("Verification Error", err?.message ?? "Could not verify profile.");
    } finally {
      setVerifying(false);
    }
  }

  async function logout() {
    await signOut().catch(() => {});
    reset();
    router.replace("/(auth)/role-select");
  }

  if (loading) return <LoadingView />;

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center px-4">
        <View className="w-20 h-20 rounded-full bg-leafLight items-center justify-center mb-5">
          <MaterialCommunityIcons name="shield-account-outline" size={42} color={theme.leaf} />
        </View>
        <Text className="text-2xl font-bold text-bark text-center">Officer Access Verification</Text>
        <Text className="text-sm text-bark/70 text-center mt-3 mb-6">
          Your official account has been created. Tap below to activate your verified officer dashboard.
        </Text>

        <View className="w-full mb-3">
          <PrimaryButton
            label="Activate & Open Officer Dashboard"
            onPress={handleInstantVerify}
            loading={verifying}
          />
        </View>

        <View className="w-full">
          <PrimaryButton label={t("common.logout")} onPress={logout} variant="secondary" />
        </View>
      </View>
    </ScreenContainer>
  );
}
