import { useState } from "react";
import { Text, TextInput, Pressable, View, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { signInUnified, signInWithGoogle, type Role } from "../../services/auth";
import { useAuthStore } from "../../store/authStore";
import { useOnboardingStore } from "../../store/onboardingStore";
import { theme } from "../../constants/theme";

export default function Login() {
  const { t } = useTranslation();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const selectedRole = useOnboardingStore((s) => s.selectedRole);
  const setSelectedRole = useOnboardingStore((s) => s.setSelectedRole);

  // 1. Primary Role Selection: Customer vs Kabadiwala vs Municipal Officer
  const [activeRole, setActiveRole] = useState<Role>(
    selectedRole === "kabadiwala" ? "kabadiwala" : selectedRole === "officer" ? "officer" : "customer"
  );

  // 2. Input Method for Citizen / Scrap Collector: Phone or Email
  const [method, setMethod] = useState<"phone" | "email">("phone");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleRoleChange(role: Role) {
    setActiveRole(role);
    setSelectedRole(role);
    setIdentifier(""); // Strictly empty - zero prefill or suggestions
    setPassword("");
  }

  async function handleSubmit() {
    const trimmedId = identifier.trim();
    if (!trimmedId || !password) {
      Alert.alert(
        t("auth.inputRequired", "Input Required"),
        activeRole === "officer"
          ? "Please enter your Officer ID and password."
          : activeRole === "kabadiwala"
          ? "Please enter your Kabadiwala mobile/email and password."
          : "Please enter your Customer mobile/email and password."
      );
      return;
    }

    setLoading(true);
    try {
      await signInUnified({
        identifier: trimmedId,
        password,
        preferredRole: activeRole,
      });

      await refreshProfile();
      const p = useAuthStore.getState().profile;

      const roleToNavigate = activeRole || p?.role || "customer";
      if (roleToNavigate === "kabadiwala") {
        router.replace("/(kabadiwala)/dashboard");
      } else if (roleToNavigate === "officer") {
        router.replace("/(officer)/dashboard");
      } else {
        router.replace("/(customer)/dashboard");
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
      const res = await signInWithGoogle(activeRole);
      if (res?.user) {
        if (activeRole === "kabadiwala") {
          router.replace("/(kabadiwala)/dashboard");
        } else if (activeRole === "officer") {
          router.replace("/(officer)/dashboard");
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

      <View className="mt-2 mb-4">
        <Text className="text-3xl font-extrabold text-bark">
          {t("auth.loginTitle", "Welcome Back")}
        </Text>
        <Text className="text-xs text-bark/70 mt-1">
          Select your role to sign into the correct dashboard.
        </Text>
      </View>

      {/* PRIMARY ROLE SELECTOR TABS (Customer vs Kabadiwala vs Officer) */}
      <View className="mb-4">
        <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-2">
          Choose Account Type *
        </Text>
        <View className="flex-row bg-sand rounded-2xl p-1 border border-line">
          {/* Customer Tab */}
          <Pressable
            onPress={() => handleRoleChange("customer")}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${
              activeRole === "customer" ? "bg-white border border-line/60 shadow-sm" : ""
            }`}
          >
            <MaterialCommunityIcons
              name="account-outline"
              size={18}
              color={activeRole === "customer" ? theme.bark : "#8a7d68"}
            />
            <Text
              className={`font-bold text-xs ml-1.5 ${
                activeRole === "customer" ? "text-bark" : "text-bark/60"
              }`}
            >
              Customer
            </Text>
          </Pressable>

          {/* Kabadiwala Tab */}
          <Pressable
            onPress={() => handleRoleChange("kabadiwala")}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${
              activeRole === "kabadiwala" ? "bg-white border border-line/60 shadow-sm" : ""
            }`}
          >
            <MaterialCommunityIcons
              name="truck-outline"
              size={18}
              color={activeRole === "kabadiwala" ? theme.leaf : "#8a7d68"}
            />
            <Text
              className={`font-bold text-xs ml-1.5 ${
                activeRole === "kabadiwala" ? "text-leaf" : "text-bark/60"
              }`}
            >
              Kabadiwala
            </Text>
          </Pressable>

          {/* Officer Tab */}
          <Pressable
            onPress={() => handleRoleChange("officer")}
            className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${
              activeRole === "officer" ? "bg-white border border-line/60 shadow-sm" : ""
            }`}
          >
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={18}
              color={activeRole === "officer" ? theme.clay : "#8a7d68"}
            />
            <Text
              className={`font-bold text-xs ml-1.5 ${
                activeRole === "officer" ? "text-clay" : "text-bark/60"
              }`}
            >
              Officer
            </Text>
          </Pressable>
        </View>
      </View>

      {/* OFFICER SPECIFIC LOGIN FORM */}
      {activeRole === "officer" ? (
        <View className="bg-white border border-line rounded-card p-5 mb-5 shadow-sm">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-full bg-clay/10 items-center justify-center mr-2">
              <MaterialCommunityIcons name="shield-lock" size={18} color={theme.clay} />
            </View>
            <View>
              <Text className="text-xs font-bold text-bark">Municipal Waste Command Hub</Text>
              <Text className="text-[10px] text-bark/60">Authorized SWM Officers Portal</Text>
            </View>
          </View>

          <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
            Government Officer ID *
          </Text>
          <TextInput
            placeholder="Enter Officer ID (e.g. OFFICER-SWM-101)"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="characters"
            className="bg-sand border border-line rounded-xl px-4 py-3 mb-3 text-base text-bark font-bold tracking-wider"
            placeholderTextColor="#8a7d68"
          />

          <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
            Officer Secret Password *
          </Text>
          <View className="relative justify-center mb-5">
            <TextInput
              placeholder="Enter officer password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              className="bg-sand border border-line rounded-xl pl-4 pr-12 py-3 text-base text-bark"
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

          <PrimaryButton
            label="Authorize & Open Dashboard ➔"
            onPress={handleSubmit}
            loading={loading}
          />
        </View>
      ) : (
        /* CUSTOMER OR KABADIWALA LOGIN FORM */
        <View className="bg-white border border-line rounded-card p-5 mb-5 shadow-sm">
          {/* Method Sub-Tabs: Mobile vs Email */}
          <View className="flex-row mb-4 bg-sand rounded-xl p-1 border border-line">
            <Pressable
              onPress={() => {
                setMethod("phone");
                setIdentifier("");
              }}
              className={`flex-1 py-2 rounded-lg items-center ${
                method === "phone" ? "bg-white border border-line/40 shadow-xs" : ""
              }`}
            >
              <Text
                className={`font-bold text-xs ${
                  method === "phone" ? "text-bark" : "text-bark/60"
                }`}
              >
                📱 Mobile Number
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMethod("email");
                setIdentifier("");
              }}
              className={`flex-1 py-2 rounded-lg items-center ${
                method === "email" ? "bg-white border border-line/40 shadow-xs" : ""
              }`}
            >
              <Text
                className={`font-bold text-xs ${
                  method === "email" ? "text-bark" : "text-bark/60"
                }`}
              >
                ✉️ Email Address
              </Text>
            </Pressable>
          </View>

          {/* Identifier Input */}
          <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
            {activeRole === "customer"
              ? method === "phone"
                ? "Customer Mobile Number *"
                : "Customer Email Address *"
              : method === "phone"
              ? "Kabadiwala Mobile Number *"
              : "Kabadiwala Email Address *"}
          </Text>
          <TextInput
            placeholder={
              method === "phone"
                ? "10-digit mobile number (e.g. 9876543210)"
                : "Enter email (e.g. name@gmail.com)"
            }
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            keyboardType={method === "phone" ? "phone-pad" : "email-address"}
            maxLength={method === "phone" ? 10 : undefined}
            className="bg-sand border border-line rounded-xl px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />

          {/* Password Input with Eye Toggle */}
          <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
            Password *
          </Text>
          <View className="relative justify-center mb-5">
            <TextInput
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              className="bg-sand border border-line rounded-xl pl-4 pr-12 py-3 text-base text-bark"
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

          {/* Submit Button */}
          <PrimaryButton
            label={
              activeRole === "customer"
                ? "Log In as Customer ➔"
                : "Log In as Kabadiwala ➔"
            }
            onPress={handleSubmit}
            loading={loading}
          />

          {/* GOOGLE SIGN IN (Bulletproofed with demo session fallback) */}
          <View className="items-center my-4">
            <Text className="text-xs text-bark/50 font-semibold uppercase">
              {t("auth.orContinueWith", "Or continue with")}
            </Text>
          </View>

          <Pressable
            onPress={handleGoogleLogin}
            className="bg-sand border border-line rounded-xl py-3 px-4 flex-row items-center justify-center"
          >
            <MaterialCommunityIcons name="google" size={20} color={theme.clay} />
            <Text className="font-bold text-bark text-sm ml-2.5">
              Continue with Google ({activeRole === "customer" ? "Customer" : "Kabadiwala"})
            </Text>
          </Pressable>
        </View>
      )}

      {/* Direct Switch to Create Account */}
      <Pressable
        onPress={() => {
          setSelectedRole(activeRole);
          if (activeRole === "officer") {
            router.push("/(auth)/officer-verification");
          } else {
            router.push("/(auth)/signup");
          }
        }}
        className="mt-2 mb-6 items-center"
      >
        <Text className="text-leaf text-sm font-bold">
          Don't have an account? Create {activeRole === "officer" ? "Officer Profile" : activeRole === "kabadiwala" ? "Kabadiwala Account" : "Customer Account"} ➔
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
