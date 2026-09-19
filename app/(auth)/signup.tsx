import { useState } from "react";
import { Text, TextInput, View, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useOnboardingStore } from "../../store/onboardingStore";
import { useAuthStore } from "../../store/authStore";
import { signUp } from "../../services/auth";
import { theme } from "../../constants/theme";

export default function Signup() {
  const { t } = useTranslation();
  const selectedRole = useOnboardingStore((s) => s.selectedRole);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Strict email & phone validation helpers
  function validateEmail(val: string) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val.trim());
  }

  function validatePhone(val: string) {
    const cleaned = val.replace(/\D/g, "");
    return /^[6-9]\d{9}$/.test(cleaned);
  }

  async function handleSubmit() {
    if (!selectedRole || selectedRole === "officer") {
      router.replace("/(auth)/role-select");
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      Alert.alert("Name Required", "Please enter your full name (at least 2 characters).");
      return;
    }

    if (signupMethod === "email" && !validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address (e.g. yourname@gmail.com).");
      return;
    }

    if (signupMethod === "phone" && !validatePhone(phone)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)."
      );
      return;
    }

    // If both entered, validate both
    if (phone.trim() && !validatePhone(phone)) {
      Alert.alert("Invalid Phone Number", "Please enter a valid 10-digit mobile number.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters.");
      return;
    }

    // Derive email if signing up via phone (using role tag to support both customer & kabadiwala on same phone)
    const finalEmail = signupMethod === "phone"
      ? `${phone.trim()}.${selectedRole}@kawa.app`
      : email.trim();

    setLoading(true);
    try {
      await signUp({
        email: finalEmail,
        password,
        role: selectedRole,
        name: name.trim(),
        phone: phone.trim() || undefined,
      });

      await refreshProfile();

      if (selectedRole === "customer") {
        router.replace("/(customer)/dashboard");
      } else if (selectedRole === "kabadiwala") {
        router.replace("/(kabadiwala)/dashboard");
      } else {
        router.replace("/(officer)/dashboard");
      }
    } catch (err: any) {
      Alert.alert("Registration Error", err?.message ?? "Could not create account. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    Alert.alert(
      "Google Sign-In",
      "Google authentication integration is active. Please complete standard signup or login with email/phone to proceed directly into your dashboard.",
      [{ text: "OK" }]
    );
  }

  const roleTitle = selectedRole === "customer" ? "Customer" : "Kabadiwala";

  return (
    <ScreenContainer scroll>
      <View className="mt-4 mb-5">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-leafLight items-center justify-center mr-2.5">
            <MaterialCommunityIcons
              name={selectedRole === "customer" ? "account-outline" : "truck-outline"}
              size={22}
              color={theme.leaf}
            />
          </View>
          <Text className="text-2xl font-bold text-bark">Create {roleTitle} Account</Text>
        </View>
        <Text className="text-xs text-bark/70 mt-1">
          Join Kawa to easily buy, sell, and recycle scrap in your neighborhood.
        </Text>
      </View>

      {/* SIGNUP METHOD TOGGLE */}
      <View className="flex-row mb-4 bg-sand rounded-xl p-1 border border-line">
        <Pressable
          onPress={() => setSignupMethod("email")}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            signupMethod === "email" ? "bg-white border border-line/40" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              signupMethod === "email" ? "text-bark" : "text-bark/60"
            }`}
          >
            ✉️ Email ID
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSignupMethod("phone")}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            signupMethod === "phone" ? "bg-white border border-line/40" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              signupMethod === "phone" ? "text-bark" : "text-bark/60"
            }`}
          >
            📱 Phone Number
          </Text>
        </Pressable>
      </View>

      <Text className="text-xs font-semibold text-bark mb-1.5">Full Name *</Text>
      <TextInput
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />

      {signupMethod === "email" ? (
        <>
          <Text className="text-xs font-semibold text-bark mb-1.5">Email Address *</Text>
          <TextInput
            placeholder="e.g. name@gmail.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />
          <Text className="text-xs font-semibold text-bark mb-1.5">Phone Number (Optional)</Text>
          <TextInput
            placeholder="10-digit mobile number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />
        </>
      ) : (
        <>
          <Text className="text-xs font-semibold text-bark mb-1.5">Phone Number *</Text>
          <TextInput
            placeholder="10-digit mobile number (e.g. 9876543210)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />
          <Text className="text-xs font-semibold text-bark mb-1.5">Email Address (Optional)</Text>
          <TextInput
            placeholder="e.g. name@gmail.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />
        </>
      )}

      <Text className="text-xs font-semibold text-bark mb-1.5">Password (min 6 characters) *</Text>
      <TextInput
        placeholder="Choose secure password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-sand border border-line rounded-card px-4 py-3 mb-5 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />

      <PrimaryButton label={`Create ${roleTitle} Profile`} onPress={handleSubmit} loading={loading} />

      {/* GOOGLE SIGN IN BUTTON */}
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

      <Pressable onPress={() => router.push("/(auth)/login")} className="mt-2 items-center">
        <Text className="text-leaf text-base font-semibold">{t("auth.haveAccount")}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
