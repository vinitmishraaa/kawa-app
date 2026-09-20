import { useEffect, useState } from "react";
import { Text, TextInput, Pressable, View, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { signInUnified, signInWithGoogle } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import { theme } from "../../constants/theme";

export default function Login() {
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const selectedRole = useOnboardingStore((s) => s.selectedRole);

  const [loginMethod, setLoginMethod] = useState<"email" | "phone" | "officer">(
    selectedRole === "officer" ? "officer" : "phone"
  );
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);


  async function handleSubmit() {
    if (!identifier.trim() || !password) {
      Alert.alert(
        t("auth.inputRequired"),
        loginMethod === "officer"
          ? "Please enter your Officer ID and password."
          : t("auth.enterCredentials")
      );
      return;
    }

    setLoading(true);
    try {
      await signInUnified({
        identifier: identifier.trim(),
        password,
        preferredRole: selectedRole || undefined,
      });

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
      Alert.alert(
        "Login Notice",
        err?.message ?? "Invalid credentials. Please verify your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const activeRole = (selectedRole ?? "customer") as any;
      const res = await signInWithGoogle(activeRole);
      if (res?.user) {
        if (activeRole === "customer") {
          router.replace("/(customer)/dashboard");
        } else if (activeRole === "kabadiwala") {
          router.replace("/(kabadiwala)/dashboard");
        } else {
          router.replace("/(officer)/dashboard");
        }
      }
    } catch (err: any) {
      Alert.alert("Google Sign-In", err?.message ?? "Failed to complete Google Sign-In.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      {/* Top Back Navigation Bar */}
      <View className="flex-row items-center mt-2 mb-2">
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(auth)/role-select");
            }
          }}
          className="w-10 h-10 rounded-full bg-sand border border-line items-center justify-center mr-3"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.bark} />
        </Pressable>
        <Text className="text-xs font-semibold text-bark/60 uppercase tracking-wider">
          {t("common.back", "Back")}
        </Text>
      </View>

      <View className="mt-2 mb-5">
        <Text className="text-3xl font-extrabold text-bark">
          {t("auth.loginTitle")}
        </Text>
        <Text className="text-xs text-bark/70 mt-1">
          {t("auth.loginSubtitle")}
        </Text>
      </View>

      {/* LOGIN METHOD TOGGLE (No dynamic CSS shadow variables) */}
      <View className="flex-row mb-4 bg-sand rounded-xl p-1 border border-line">
        <Pressable
          onPress={() => {
            setLoginMethod("phone");
            setIdentifier("");
          }}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            loginMethod === "phone" ? "bg-white border border-line/40" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              loginMethod === "phone" ? "text-bark" : "text-bark/60"
            }`}
          >
            {t("auth.mobileTab")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setLoginMethod("email");
            setIdentifier("");
          }}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            loginMethod === "email" ? "bg-white border border-line/40" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              loginMethod === "email" ? "text-bark" : "text-bark/60"
            }`}
          >
            {t("auth.emailTab")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setLoginMethod("officer");
            setIdentifier("OFFICER-SWM-101");
          }}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            loginMethod === "officer" ? "bg-white border border-line/40" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              loginMethod === "officer" ? "text-leaf" : "text-bark/60"
            }`}
          >
            {t("auth.officerTab")}
          </Text>
        </Pressable>
      </View>

      {/* INPUT FIELD ACCORDING TO METHOD */}
      <Text className="text-xs font-semibold text-bark mb-1.5">
        {loginMethod === "phone"
          ? t("auth.phoneNumber")
          : loginMethod === "email"
          ? t("auth.emailAddress")
          : t("auth.officerId")}
      </Text>
      <TextInput
        placeholder={
          loginMethod === "phone"
            ? t("auth.phonePlaceholder")
            : loginMethod === "email"
            ? t("auth.emailPlaceholder")
            : t("auth.officerIdPlaceholder")
        }
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize={loginMethod === "officer" ? "characters" : "none"}
        keyboardType={loginMethod === "phone" ? "phone-pad" : loginMethod === "email" ? "email-address" : "default"}
        maxLength={loginMethod === "phone" ? 10 : undefined}
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />


      <Text className="text-xs font-semibold text-bark mb-1.5">{t("auth.password")} *</Text>
      <View className="relative justify-center mb-5">
        <TextInput
          placeholder={t("auth.loginPasswordPlaceholder")}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          className="bg-sand border border-line rounded-card pl-4 pr-12 py-3 text-base text-bark"
          placeholderTextColor="#8a7d68"
        />
        <Pressable
          onPress={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 p-1.5"
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
        >
          <MaterialCommunityIcons
            name={showPassword ? "eye-outline" : "eye-off-outline"}
            size={22}
            color={theme.bark}
          />
        </Pressable>
      </View>

      <PrimaryButton label={t("auth.loginButton")} onPress={handleSubmit} loading={loading} />

      {/* GOOGLE SIGN IN */}
      <View className="items-center my-4">
        <Text className="text-xs text-bark/50 font-semibold uppercase">{t("auth.orContinueWith")}</Text>
      </View>

      <Pressable
        onPress={handleGoogleLogin}
        className="bg-sand border border-line rounded-card py-3 px-4 flex-row items-center justify-center mb-4"
      >
        <MaterialCommunityIcons name="google" size={20} color={theme.clay} />
        <Text className="font-bold text-bark text-sm ml-2.5">{t("auth.continueWithGoogle")}</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/role-select")} className="mt-2 items-center">
        <Text className="text-leaf text-base font-semibold">{t("auth.noAccount")}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
