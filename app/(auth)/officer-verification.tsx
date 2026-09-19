import { useState, useEffect } from "react";
import { Alert, Text, TextInput, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { theme } from "../../constants/theme";
import { signInOfficer } from "../../services/auth";
import { findAuthorizedOfficer } from "../../constants/authorizedOfficers";
import { useAuthStore } from "../../store/authStore";

export default function OfficerVerification() {
  const { t } = useTranslation();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [officerCode, setOfficerCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authorizedOfficer, setAuthorizedOfficer] = useState<{
    officerId: string;
    name: string;
    zone: string;
    department: string;
  } | null>(null);

  // Auto-redirect if authorized
  useEffect(() => {
    if (authorizedOfficer) {
      const timer = setTimeout(() => {
        router.replace("/(officer)/dashboard");
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [authorizedOfficer]);

  async function handleOfficerLogin() {
    const trimmedCode = officerCode.trim().toUpperCase();
    if (!trimmedCode) {
      Alert.alert("Officer ID Required", "Please enter your assigned Municipal Officer ID (e.g. OFFICER-SWM-101).");
      return;
    }

    const authOfficer = findAuthorizedOfficer(trimmedCode);
    if (!authOfficer) {
      Alert.alert(
        "Access Denied: Invalid ID",
        "This Officer ID is not authorized. Only pre-assigned government municipal officers can access this portal."
      );
      return;
    }

    if (!password || password.length < 4) {
      Alert.alert("Password Required", "Please enter your officer secret password (min 4 characters).");
      return;
    }

    setLoading(true);
    try {
      await signInOfficer({
        officerId: authOfficer.officerId,
        password,
      });

      await refreshProfile();
      setAuthorizedOfficer(authOfficer);
    } catch (err: any) {
      Alert.alert("Officer Authorization Failed", err?.message ?? "Invalid password or officer ID.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      {/* Top Back Navigation Bar */}
      <View className="flex-row items-center mt-2 mb-3">
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
          {t("common.back", "Back to Roles")}
        </Text>
      </View>

      <View className="mt-1 mb-5">
        <View className="w-14 h-14 rounded-full bg-leafLight items-center justify-center mb-3">
          <MaterialCommunityIcons name="shield-lock-outline" size={32} color={theme.leaf} />
        </View>
        <Text className="text-2xl font-bold text-bark">Government Officer Access</Text>
        <Text className="text-xs text-bark/70 mt-1">
          Municipal Waste Command Hub • Solid Waste Management (SWM) Directorate
        </Text>
      </View>

      {/* SUCCESS AUTHORIZATION CARD (Renders on Web and Mobile seamlessly) */}
      {authorizedOfficer ? (
        <View className="bg-leafLight border-2 border-leaf rounded-card p-6 mb-6 items-center shadow-md">
          <View className="w-16 h-16 rounded-full bg-leaf items-center justify-center mb-3">
            <MaterialCommunityIcons name="check-decagram" size={36} color="#ffffff" />
          </View>
          <Text className="text-xl font-black text-leaf mb-1 text-center">
            Access Authorized!
          </Text>
          <Text className="text-sm font-bold text-bark text-center">
            Welcome, {authorizedOfficer.name}
          </Text>
          <Text className="text-xs text-bark/70 text-center mt-0.5 mb-5">
            {authorizedOfficer.department} • {authorizedOfficer.zone}
          </Text>

          {/* Prominent Open Dashboard Button */}
          <Pressable
            onPress={() => router.replace("/(officer)/dashboard")}
            className="w-full py-3.5 bg-leaf rounded-xl items-center justify-center shadow-sm"
          >
            <Text className="text-white font-black text-base">
              Open Officer Dashboard ➔
            </Text>
          </Pressable>
          <Text className="text-[11px] text-leaf/80 mt-2">Opening automatically...</Text>
        </View>
      ) : (
        /* OFFICER CREDENTIALS FORM */
        <View className="bg-white border border-line rounded-card p-5 mb-5 shadow-sm">
          {/* Officer ID Input */}
          <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
            Government Officer ID *
          </Text>
          <TextInput
            placeholder="Enter Officer ID (e.g. OFFICER-SWM-101)"
            value={officerCode}
            onChangeText={setOfficerCode}
            autoCapitalize="characters"
            className="bg-sand border border-line rounded-xl px-4 py-3 text-base text-bark font-bold tracking-wider mb-4"
            placeholderTextColor="#8a7d68"
          />

          {/* Password Input with Eye Toggle */}
          <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
            Officer Secret Password *
          </Text>
          <View className="relative justify-center mb-5">
            <TextInput
              placeholder="Enter password (e.g. 123456)"
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
            label="Authorize & Open Dashboard"
            onPress={handleOfficerLogin}
            loading={loading}
          />
        </View>
      )}

      {/* Return to Role Select */}
      <View className="mt-2 mb-6">
        <PrimaryButton
          label="Choose another role"
          onPress={() => router.replace("/(auth)/role-select")}
          variant="secondary"
        />
      </View>
    </ScreenContainer>
  );
}
