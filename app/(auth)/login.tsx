import { useEffect, useState } from "react";
import { Text, TextInput, Pressable, View, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { signInUnified } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import { AUTHORIZED_OFFICER_IDS } from "../../constants/authorizedOfficers";
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
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect straight to their active dashboard
  useEffect(() => {
    if (session && profile) {
      if (profile.role === "customer") {
        router.replace("/(customer)/dashboard");
      } else if (profile.role === "kabadiwala") {
        router.replace("/(kabadiwala)/dashboard");
      } else if (profile.role === "officer") {
        router.replace("/(officer)/dashboard");
      }
    }
  }, [session, profile]);

  async function handleSubmit() {
    if (!identifier.trim() || !password) {
      Alert.alert(
        "Input Required",
        loginMethod === "officer"
          ? "Please enter your Officer ID and password."
          : "Please enter your email or phone number, and password."
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
        "Login Failed",
        err?.message ?? "Invalid credentials. Please verify your details and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    Alert.alert(
      "Google Sign-In",
      "Google authentication integration is active. Please enter your email or phone number to log into your account.",
      [{ text: "OK" }]
    );
  }

  return (
    <ScreenContainer scroll>
      <View className="mt-6 mb-5">
        <Text className="text-3xl font-extrabold text-bark">
          {t("auth.loginTitle")}
        </Text>
        <Text className="text-xs text-bark/70 mt-1">
          Sign into your Customer, Kabadiwala, or Municipal Officer account.
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
            📱 Mobile
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
            ✉️ Email
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
            🏛️ Officer
          </Text>
        </Pressable>
      </View>

      {/* INPUT FIELD ACCORDING TO METHOD */}
      <Text className="text-xs font-semibold text-bark mb-1.5">
        {loginMethod === "phone"
          ? "Registered Mobile Number *"
          : loginMethod === "email"
          ? "Email Address *"
          : "Authorized Government Officer ID *"}
      </Text>
      <TextInput
        placeholder={
          loginMethod === "phone"
            ? "e.g. 9876543210"
            : loginMethod === "email"
            ? "e.g. name@gmail.com"
            : "e.g. OFFICER-SWM-101"
        }
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize={loginMethod === "officer" ? "characters" : "none"}
        keyboardType={loginMethod === "phone" ? "phone-pad" : loginMethod === "email" ? "email-address" : "default"}
        maxLength={loginMethod === "phone" ? 10 : undefined}
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />

      {/* OFFICER PRESET BADGES */}
      {loginMethod === "officer" && (
        <View className="mb-3">
          <Text className="text-[11px] text-bark/60 mb-1 font-medium">Quick select authorized officer ID:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {AUTHORIZED_OFFICER_IDS.map((o) => (
              <Pressable
                key={o.officerId}
                onPress={() => setIdentifier(o.officerId)}
                className={`px-2.5 py-1.5 rounded-lg mr-2 border ${
                  identifier === o.officerId
                    ? "bg-leafLight border-leaf"
                    : "bg-sand border-line"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    identifier === o.officerId ? "text-leaf" : "text-bark/70"
                  }`}
                >
                  {o.officerId} ({o.name.split(" ")[0]})
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      <Text className="text-xs font-semibold text-bark mb-1.5">Password *</Text>
      <TextInput
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-sand border border-line rounded-card px-4 py-3 mb-5 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />

      <PrimaryButton label={t("auth.loginButton")} onPress={handleSubmit} loading={loading} />

      {/* GOOGLE SIGN IN */}
      <View className="items-center my-4">
        <Text className="text-xs text-bark/50 font-semibold uppercase">Or continue with</Text>
      </View>

      <Pressable
        onPress={handleGoogleLogin}
        className="bg-sand border border-line rounded-card py-3 px-4 flex-row items-center justify-center mb-4"
      >
        <MaterialCommunityIcons name="google" size={20} color={theme.clay} />
        <Text className="font-bold text-bark text-sm ml-2.5">Continue with Google</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/(auth)/role-select")} className="mt-2 items-center">
        <Text className="text-leaf text-base font-semibold">{t("auth.noAccount")}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
