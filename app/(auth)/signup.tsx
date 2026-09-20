import { useState } from "react";
import { Text, TextInput, View, Pressable, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useOnboardingStore } from "../../store/onboardingStore";
import { useAuthStore } from "../../store/authStore";
import { signUp, signInWithGoogle } from "../../services/auth";
import { theme } from "../../constants/theme";

export default function Signup() {
  const { t } = useTranslation();
  const storeRole = useOnboardingStore((s) => s.selectedRole);
  const setSelectedRole = useOnboardingStore((s) => s.setSelectedRole);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [activeRole, setActiveRole] = useState<"customer" | "kabadiwala">(
    storeRole === "kabadiwala" ? "kabadiwala" : "customer"
  );

  const [signupMethod, setSignupMethod] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    // Derive email (using role tag so a single user can have BOTH Customer and Kabadiwala accounts on same email or phone)
    let finalEmail = email.trim();
    if (signupMethod === "phone") {
      finalEmail = `${phone.trim()}.${activeRole}@kawa.app`;
    } else {
      const [uPart, dPart] = email.trim().split("@");
      finalEmail = `${uPart}.${activeRole}@${dPart}`;
    }

    setLoading(true);
    try {
      try {
        await signUp({
          email: finalEmail,
          password,
          role: activeRole,
          name: name.trim(),
          phone: phone.trim() || undefined,
        });
      } catch (subErr: any) {
        // Fallback to standard email if provider enforces domain rules
        if (signupMethod === "email") {
          await signUp({
            email: email.trim(),
            password,
            role: activeRole,
            name: name.trim(),
            phone: phone.trim() || undefined,
          });
        } else {
          throw subErr;
        }
      }

      await refreshProfile();

      if (activeRole === "kabadiwala") {
        router.replace("/(kabadiwala)/dashboard");
      } else {
        router.replace("/(customer)/dashboard");
      }
    } catch (err: any) {
      Alert.alert("Registration Error", err?.message ?? "Could not create account. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const res = await signInWithGoogle(activeRole);
      if (res?.user) {
        if (activeRole === "kabadiwala") {
          router.replace("/(kabadiwala)/dashboard");
        } else {
          router.replace("/(customer)/dashboard");
        }
      }
    } catch (err: any) {
      const msg = err?.message ?? "Failed to complete Google Sign-In.";
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.alert(msg);
      } else {
        Alert.alert("Google Sign-In", msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const roleTitle = activeRole === "customer" ? t("roleSelect.customer") : t("roleSelect.kabadiwala");

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

      <View className="mt-2 mb-3">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-leafLight items-center justify-center mr-2.5">
            <MaterialCommunityIcons
              name={activeRole === "customer" ? "account-outline" : "truck-outline"}
              size={22}
              color={theme.leaf}
            />
          </View>
          <Text className="text-2xl font-bold text-bark">
            {activeRole === "customer" ? t("auth.createCustomerAccount") : t("auth.createKabadiwalaAccount")}
          </Text>
        </View>
        <Text className="text-xs text-bark/70 mt-1">
          {t("auth.signupSubtitle")}
        </Text>
      </View>

      {/* ROLE SELECTOR TABS: Customer vs Kabadiwala */}
      <View className="flex-row bg-sand rounded-xl p-1 mb-4 border border-line">
        <Pressable
          onPress={() => {
            setActiveRole("customer");
            setSelectedRole("customer");
          }}
          className={`flex-1 py-2.5 rounded-lg items-center justify-center flex-row ${
            activeRole === "customer" ? "bg-leaf shadow-sm" : "bg-transparent"
          }`}
        >
          <MaterialCommunityIcons
            name="account-outline"
            size={18}
            color={activeRole === "customer" ? "#FFFFFF" : theme.bark}
          />
          <Text
            className={`font-bold text-xs ml-1.5 ${
              activeRole === "customer" ? "text-white" : "text-bark"
            }`}
          >
            {t("roleSelect.customer", "Customer")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setActiveRole("kabadiwala");
            setSelectedRole("kabadiwala");
          }}
          className={`flex-1 py-2.5 rounded-lg items-center justify-center flex-row ${
            activeRole === "kabadiwala" ? "bg-leaf shadow-sm" : "bg-transparent"
          }`}
        >
          <MaterialCommunityIcons
            name="truck-outline"
            size={18}
            color={activeRole === "kabadiwala" ? "#FFFFFF" : theme.bark}
          />
          <Text
            className={`font-bold text-xs ml-1.5 ${
              activeRole === "kabadiwala" ? "text-white" : "text-bark"
            }`}
          >
            {t("roleSelect.kabadiwala", "Kabadiwala")}
          </Text>
        </Pressable>
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
            {t("auth.emailTab")}
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
            {t("auth.mobileTab")}
          </Text>
        </Pressable>
      </View>

      <Text className="text-xs font-semibold text-bark mb-1.5">{t("auth.fullName")}</Text>
      <TextInput
        placeholder={t("auth.fullNamePlaceholder")}
        value={name}
        onChangeText={setName}
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />

      {signupMethod === "email" ? (
        <>
          <Text className="text-xs font-semibold text-bark mb-1.5">{t("auth.emailAddress")}</Text>
          <TextInput
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />
          <Text className="text-xs font-semibold text-bark mb-1.5">{t("auth.phoneNumberOptional")}</Text>
          <TextInput
            placeholder={t("auth.phonePlaceholder")}
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
          <Text className="text-xs font-semibold text-bark mb-1.5">{t("auth.phoneNumber")}</Text>
          <TextInput
            placeholder={t("auth.phonePlaceholder")}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />
          <Text className="text-xs font-semibold text-bark mb-1.5">{t("auth.emailAddressOptional")}</Text>
          <TextInput
            placeholder={t("auth.emailPlaceholder")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />
        </>
      )}

      <Text className="text-xs font-semibold text-bark mb-1.5">{t("auth.passwordRequirement")}</Text>
      <View className="relative justify-center mb-5">
        <TextInput
          placeholder={t("auth.passwordPlaceholder")}
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

      <PrimaryButton label={t("auth.createProfileButton", { role: roleTitle })} onPress={handleSubmit} loading={loading} />

      {/* GOOGLE SIGN IN BUTTON */}
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

      <Pressable onPress={() => router.push("/(auth)/login")} className="mt-2 items-center">
        <Text className="text-leaf text-base font-semibold">{t("auth.haveAccount")}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
