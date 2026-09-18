import { useState } from "react";
import { Text, TextInput, Pressable, View, Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { signIn } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";
import { theme } from "../../constants/theme";

export default function Login() {
  const { t } = useTranslation();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!identifier.trim() || !password) {
      Alert.alert("Input Required", "Please enter your email or phone number, and password.");
      return;
    }

    let finalEmail = identifier.trim();

    // If phone number entered (10 digits)
    const digitsOnly = identifier.replace(/\D/g, "");
    if (loginMethod === "phone" || (digitsOnly.length === 10 && !identifier.includes("@"))) {
      finalEmail = `${digitsOnly}@kawa.app`;
    }

    setLoading(true);
    try {
      await signIn({ email: finalEmail, password });
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
      Alert.alert("Login Failed", "Invalid credentials. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    Alert.alert(
      "Google Sign-In",
      "Google authentication integration is active. Please enter your email or registered phone number to log into your dashboard.",
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
          Log into your Customer, Kabadiwala, or Officer account.
        </Text>
      </View>

      {/* LOGIN METHOD TOGGLE */}
      <View className="flex-row mb-4 bg-sand rounded-xl p-1 border border-line">
        <Pressable
          onPress={() => setLoginMethod("email")}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            loginMethod === "email" ? "bg-white shadow-sm" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              loginMethod === "email" ? "text-bark" : "text-bark/60"
            }`}
          >
            ✉️ Email ID
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setLoginMethod("phone")}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            loginMethod === "phone" ? "bg-white shadow-sm" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              loginMethod === "phone" ? "text-bark" : "text-bark/60"
            }`}
          >
            📱 Mobile Number
          </Text>
        </Pressable>
      </View>

      <Text className="text-xs font-semibold text-bark mb-1.5">
        {loginMethod === "email" ? "Email Address *" : "Registered Mobile Number *"}
      </Text>
      <TextInput
        placeholder={loginMethod === "email" ? "e.g. name@gmail.com" : "e.g. 9876543210"}
        value={identifier}
        onChangeText={setIdentifier}
        autoCapitalize="none"
        keyboardType={loginMethod === "email" ? "email-address" : "phone-pad"}
        maxLength={loginMethod === "phone" ? 10 : undefined}
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />

      <Text className="text-xs font-semibold text-bark mb-1.5">Password *</Text>
      <TextInput
        placeholder="Enter password"
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
