import { useState } from "react";
import { Text, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { signIn } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";

export default function Login() {
  const { t } = useTranslation();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) {
      Alert.alert("Input Required", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
      await refreshProfile();
      const p = useAuthStore.getState().profile;

      if (p?.role === "customer") {
        router.replace("/(customer)/dashboard");
      } else if (p?.role === "kabadiwala") {
        router.replace("/(kabadiwala)/dashboard");
      } else if (p?.role === "officer") {
        router.replace("/(officer)/dashboard");
      } else {
        router.replace("/");
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err?.message ?? "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <Text className="text-2xl font-bold text-bark mt-6 mb-6">
        {t("auth.loginTitle")}
      </Text>

      <TextInput
        placeholder={t("auth.email") as string}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />
      <TextInput
        placeholder={t("auth.password") as string}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-sand border border-line rounded-card px-4 py-3 mb-6 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />

      <PrimaryButton label={t("auth.loginButton")} onPress={handleSubmit} loading={loading} />

      <Pressable onPress={() => router.push("/(auth)/role-select")} className="mt-5 items-center">
        <Text className="text-leaf text-base">{t("auth.noAccount")}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
