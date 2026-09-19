import { useState } from "react";
import { Alert, Text, TextInput, View, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { theme } from "../../constants/theme";
import { signInOfficer, signUp } from "../../services/auth";
import { AUTHORIZED_OFFICER_IDS, findAuthorizedOfficer } from "../../constants/authorizedOfficers";
import { useAuthStore } from "../../store/authStore";

export default function OfficerVerification() {
  const { t } = useTranslation();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [officerCode, setOfficerCode] = useState("OFFICER-SWM-101");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-fill officer name when code changes
  function handleCodeChange(code: string) {
    setOfficerCode(code);
    const authOfficer = findAuthorizedOfficer(code);
    if (authOfficer) {
      setName(authOfficer.name);
    }
  }

  async function handleOfficerLogin() {
    const authOfficer = findAuthorizedOfficer(officerCode);
    if (!authOfficer) {
      Alert.alert(
        "Access Denied: Invalid ID",
        "Please enter one of the 5 authorized municipal officer IDs (e.g. OFFICER-SWM-101)."
      );
      return;
    }

    if (!password || password.length < 4) {
      Alert.alert("Password Required", "Please enter your officer secret password.");
      return;
    }

    setLoading(true);
    try {
      await signInOfficer({
        officerId: authOfficer.officerId,
        password,
      });

      await refreshProfile();
      Alert.alert(
        "Access Authorized",
        `Welcome, ${authOfficer.name}!\nMunicipal Zone: ${authOfficer.zone}`,
        [{ text: "Open Dashboard", onPress: () => router.replace("/(officer)/dashboard") }]
      );
    } catch (err: any) {
      Alert.alert("Officer Authorization Failed", err?.message ?? "Invalid password or officer ID.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOfficerRegister() {
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
          {t("common.back", "Back to Roles")}
        </Text>
      </View>

      <View className="mt-2 mb-4">
        <View className="w-14 h-14 rounded-full bg-leafLight items-center justify-center mb-3">
          <MaterialCommunityIcons name="shield-lock-outline" size={32} color={theme.leaf} />
        </View>
        <Text className="text-2xl font-bold text-bark">Government Officer Access</Text>
        <Text className="text-xs text-bark/70 mt-1">
          Restricted to the 5 authorized municipal officers. Log in with your Officer ID to open the Municipal Waste Command Hub.
        </Text>
      </View>

      {/* MODE TOGGLE: LOGIN VS REGISTER */}
      <View className="flex-row mb-4 bg-sand rounded-xl p-1 border border-line">
        <Pressable
          onPress={() => setMode("login")}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            mode === "login" ? "bg-white border border-line/40" : ""
          }`}
        >
          <Text className={`font-bold text-xs ${mode === "login" ? "text-leaf" : "text-bark/60"}`}>
            🔐 Officer Login
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode("register")}
          className={`flex-1 py-2.5 rounded-lg items-center ${
            mode === "register" ? "bg-white border border-line/40" : ""
          }`}
        >
          <Text className={`font-bold text-xs ${mode === "register" ? "text-leaf" : "text-bark/60"}`}>
            📝 Register / Custom
          </Text>
        </Pressable>
      </View>

      {/* QUICK PRESET SELECTOR FOR THE 5 AUTHORIZED OFFICERS */}
      <View className="mb-4">
        <Text className="text-xs font-bold text-bark/70 uppercase tracking-wider mb-2">
          Select Authorized Government Officer:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {AUTHORIZED_OFFICER_IDS.map((o) => (
            <Pressable
              key={o.officerId}
              onPress={() => handleCodeChange(o.officerId)}
              className={`px-3 py-2 rounded-xl mr-2.5 border ${
                officerCode === o.officerId
                  ? "bg-leafLight border-leaf"
                  : "bg-sand border-line"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  officerCode === o.officerId ? "text-leaf" : "text-bark"
                }`}
              >
                {o.officerId}
              </Text>
              <Text className="text-[10px] text-bark/60 mt-0.5">{o.name.split(" ")[0]} • {o.zone}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* OFFICER ID INPUT */}
      <View className="bg-sand border-2 border-leaf/40 rounded-card p-4 mb-4">
        <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
          Government Officer ID *
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
        ) : (
          <View className="flex-row items-center mt-2 bg-clay/10 p-2 rounded-lg">
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.clay} />
            <Text className="text-[11px] text-clay ml-1.5 font-medium">
              ID not recognized. Please choose one of the 5 authorized officers.
            </Text>
          </View>
        )}
      </View>

      {mode === "login" ? (
        /* LOGIN FORM */
        <View>
          <Text className="text-xs font-semibold text-bark mb-1.5">Officer Password *</Text>
          <View className="relative justify-center mb-5">
            <TextInput
              placeholder="Enter password (e.g. 123456)"
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

          <PrimaryButton
            label="Authorize & Enter Officer Hub"
            onPress={handleOfficerLogin}
            loading={loading}
          />
        </View>
      ) : (
        /* REGISTRATION FORM */
        <View>
          <Text className="text-xs font-semibold text-bark mb-1.5">Full Name *</Text>
          <TextInput
            placeholder="Official Full Name"
            value={name}
            onChangeText={setName}
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />

          <Text className="text-xs font-semibold text-bark mb-1.5">Official Email Address *</Text>
          <TextInput
            placeholder="e.g. officer@swm.gov.in"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />

          <Text className="text-xs font-semibold text-bark mb-1.5">Phone Number (Optional)</Text>
          <TextInput
            placeholder="10-digit phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            placeholderTextColor="#8a7d68"
          />

          <Text className="text-xs font-semibold text-bark mb-1.5">Create Password (min 6 characters) *</Text>
          <View className="relative justify-center mb-5">
            <TextInput
              placeholder="Secret password"
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

          <PrimaryButton
            label="Register & Enter Officer Hub"
            onPress={handleOfficerRegister}
            loading={loading}
          />
        </View>
      )}

      <View className="mt-4 mb-6">
        <PrimaryButton
          label="Choose another role"
          onPress={() => router.replace("/(auth)/role-select")}
          variant="secondary"
        />
      </View>
    </ScreenContainer>
  );
}
