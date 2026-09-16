import { useState } from "react";
import { Text, TextInput, View, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useOnboardingStore } from "../../store/onboardingStore";
import { signUp } from "../../services/auth";

export default function Signup() {
  const { t } = useTranslation();
  const selectedRole = useOnboardingStore((s) => s.selectedRole);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!selectedRole) {
      router.replace("/(auth)/role-select");
      return;
    }
    if (!name || !email || !password) {
      Alert.alert(t("auth.errorGeneric"));
      return;
    }
    setLoading(true);
    try {
      await signUp({ email, password, role: selectedRole, name, phone });
      router.replace("/(auth)/language-select");
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <Text className="text-2xl font-bold text-bark mt-6 mb-6">
        {t("auth.signupTitle")}
      </Text>

      <TextInput
        placeholder={t("auth.name") as string}
        value={name}
        onChangeText={setName}
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />
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
        placeholder={t("auth.phone") as string}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
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

      <PrimaryButton
        label={t("auth.signupButton")}
        onPress={handleSubmit}
        loading={loading}
      />

      <Pressable onPress={() => router.push("/(auth)/login")} className="mt-5 items-center">
        <Text className="text-leaf text-base">{t("auth.haveAccount")}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
