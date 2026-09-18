import { useState } from "react";
import { Alert, Text, TextInput, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { theme } from "../../constants/theme";
import { signUp } from "../../services/auth";
import { findAuthorizedOfficer } from "../../constants/authorizedOfficers";
import { useAuthStore } from "../../store/authStore";

export default function OfficerVerification() {
  const { t } = useTranslation();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [officerCode, setOfficerCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // When officer code changes, check if it matches an authorized officer
  function handleCodeChange(code: string) {
    setOfficerCode(code);
    const authOfficer = findAuthorizedOfficer(code);
    if (authOfficer && !name) {
      setName(authOfficer.name);
    }
  }

  async function handleSubmit() {
    const authOfficer = findAuthorizedOfficer(officerCode);
    if (!authOfficer) {
      Alert.alert(
        "Access Denied: Unauthorized ID",
        "This Officer ID is not authorized. Only the 5 pre-assigned government municipal officers can access this portal."
      );
      return;
    }

    if (!name.trim() || !email.trim() || password.length < 6) {
      Alert.alert(
        "Required Fields",
        "Please enter your full name, official email, and a password (min 6 characters)."
      );
      return;
    }

    setLoading(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        role: "officer",
        name: name.trim(),
        phone: phone.trim() || undefined,
        govIdNumber: authOfficer.officerId,
        department: `${authOfficer.department} (${authOfficer.zone})`,
      });

      await refreshProfile();
      Alert.alert(
        "Officer Identity Authorized",
        `Welcome, ${authOfficer.name} (${authOfficer.zone}). Access granted to the Municipal Waste Command Hub.`,
        [{ text: "Enter Dashboard", onPress: () => router.replace("/(officer)/dashboard") }]
      );
    } catch (err: any) {
      Alert.alert("Registration Error", err?.message ?? "Could not authorize officer.");
    } finally {
      setLoading(false);
    }
  }

  const matchedOfficer = findAuthorizedOfficer(officerCode);

  return (
    <ScreenContainer scroll>
      <View className="mt-4 mb-4">
        <View className="w-14 h-14 rounded-full bg-leafLight items-center justify-center mb-3">
          <MaterialCommunityIcons name="shield-lock-outline" size={32} color={theme.leaf} />
        </View>
        <Text className="text-2xl font-bold text-bark">Government Officer Access</Text>
        <Text className="text-xs text-bark/70 mt-1">
          Restricted to the 5 authorized municipal officers. Enter your government-issued Officer ID to unlock access.
        </Text>
      </View>

      {/* OFFICER ID INPUT (CRITICAL SECURITY CHECK) */}
      <View className="bg-sand border-2 border-leaf/40 rounded-card p-4 mb-4">
        <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
          1. Authorized Officer ID *
        </Text>
        <TextInput
          placeholder="e.g. OFFICER-SWM-101"
          value={officerCode}
          onChangeText={handleCodeChange}
          autoCapitalize="characters"
          className="bg-white border border-line rounded-xl px-4 py-3 text-base text-bark font-bold tracking-wider"
          placeholderTextColor="#8a7d68"
        />

        {matchedOfficer ? (
          <View className="flex-row items-center mt-2.5 bg-leafLight p-2.5 rounded-lg border border-leaf/30">
            <MaterialCommunityIcons name="check-decagram" size={18} color={theme.leaf} />
            <View className="ml-2 flex-1">
              <Text className="text-xs font-bold text-leaf">{matchedOfficer.name}</Text>
              <Text className="text-[11px] text-bark/70">
                {matchedOfficer.department} • {matchedOfficer.zone}
              </Text>
            </View>
          </View>
        ) : officerCode.length > 3 ? (
          <View className="flex-row items-center mt-2 bg-clay/10 p-2 rounded-lg">
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.clay} />
            <Text className="text-[11px] text-clay ml-1.5 font-medium">
              ID not recognized. Only the 5 pre-assigned Officer IDs can register.
            </Text>
          </View>
        ) : null}
      </View>

      {/* OFFICER CREDENTIALS */}
      <Text className="text-xs font-bold text-bark/70 uppercase tracking-wider mb-2">
        2. Officer Profile & Login Details
      </Text>

      <TextInput
        placeholder="Official Full Name *"
        value={name}
        onChangeText={setName}
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />
      <TextInput
        placeholder="Official Email Address *"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />
      <TextInput
        placeholder="Phone Number (10 digits)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />
      <TextInput
        placeholder="Create Secret Password (min 6 characters) *"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-sand border border-line rounded-card px-4 py-3 mb-5 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />

      <PrimaryButton
        label="Authorize & Enter Officer Hub"
        onPress={handleSubmit}
        loading={loading}
      />

      <Pressable onPress={() => router.push("/(auth)/login")} className="mt-4 items-center">
        <Text className="text-leaf text-base font-semibold">Already authorized? Log in here</Text>
      </Pressable>

      <View className="mt-3 mb-6">
        <PrimaryButton
          label="Choose another role"
          onPress={() => router.replace("/(auth)/role-select")}
          variant="secondary"
        />
      </View>
    </ScreenContainer>
  );
}
