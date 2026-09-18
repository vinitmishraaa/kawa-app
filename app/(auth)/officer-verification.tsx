import { useState } from "react";
import { Alert, Text, TextInput, View, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { theme } from "../../constants/theme";
import { signUp } from "../../services/auth";
import { uploadOfficerDocument, submitOfficerVerification } from "../../services/queries/officer";
import { useAuthStore } from "../../store/authStore";
import { useOnboardingStore } from "../../store/onboardingStore";

export default function OfficerVerification() {
  const { t } = useTranslation();
  const selectedRole = useOnboardingStore((s) => s.selectedRole);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("Municipal Solid Waste Management");
  const [govIdNumber, setGovIdNumber] = useState("");
  const [documents, setDocuments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function pickDocuments() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.75,
    });

    if (!result.canceled) {
      setDocuments((current) => [...current, ...result.assets.map((asset) => asset.uri)].slice(0, 3));
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || password.length < 6) {
      Alert.alert("Required Fields", "Please enter your name, email, and a password with at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({
        email: email.trim(),
        password,
        role: "officer",
        name: name.trim(),
        phone: phone.trim() || undefined,
        govIdNumber: govIdNumber.trim() || "GOV-OFFICER",
        department: department.trim() || "Municipal SWM",
      });

      // Upload documents if selected
      const paths: string[] = [];
      for (const uri of documents) {
        try {
          paths.push(await uploadOfficerDocument(uri, result.user!.id));
        } catch (uploadErr) {
          console.log("Document upload note:", uploadErr);
        }
      }

      if (paths.length > 0) {
        await submitOfficerVerification({
          officerId: result.user!.id,
          documentPaths: paths,
          govIdNumber: govIdNumber.trim() || undefined,
          department: department.trim() || undefined,
        }).catch(() => {});
      }

      await refreshProfile();
      Alert.alert(
        "Officer Account Verified",
        "Your official account has been configured with municipal waste oversight access.",
        [{ text: "Enter Dashboard", onPress: () => router.replace("/(officer)/dashboard") }]
      );
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="mt-4 mb-4">
        <View className="w-14 h-14 rounded-full bg-leafLight items-center justify-center mb-3">
          <MaterialCommunityIcons name="shield-check-outline" size={30} color={theme.leaf} />
        </View>
        <Text className="text-2xl font-bold text-bark">Officer Registration</Text>
        <Text className="text-sm text-bark/70 mt-1">
          Register with your Department and Employee/Gov ID to access municipal waste flow records.
        </Text>
      </View>

      <TextInput
        placeholder={t("auth.name") as string}
        value={name}
        onChangeText={setName}
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />
      <TextInput
        placeholder="Gov Department (e.g. Municipal SWM)"
        value={department}
        onChangeText={setDepartment}
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />
      <TextInput
        placeholder="Gov ID / Officer Badge No. (e.g. SWM-2024-91)"
        value={govIdNumber}
        onChangeText={setGovIdNumber}
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
        placeholder={t("auth.email") as string}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />
      <TextInput
        placeholder={t("auth.password") as string}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-sand border border-line rounded-card px-4 py-3 mb-4 text-base text-bark"
        placeholderTextColor="#8a7d68"
      />

      {/* Document Upload (Optional) */}
      <Pressable onPress={pickDocuments} className="bg-sand border border-line rounded-card p-4 mb-4">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="file-document-multiple-outline" size={26} color={theme.leaf} />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-semibold text-bark">Attach ID Card / Document (Optional)</Text>
            <Text className="text-xs text-bark/60 mt-0.5">Upload a photo of your official ID or authorization</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={theme.line} />
        </View>

        {documents.length > 0 && (
          <View className="flex-row flex-wrap mt-3">
            {documents.map((uri) => (
              <Image key={uri} source={{ uri }} className="w-16 h-16 rounded-xl mr-2 mb-2" resizeMode="cover" />
            ))}
          </View>
        )}
      </Pressable>

      <PrimaryButton label="Register & Enter Officer Dashboard" onPress={handleSubmit} loading={loading} />

      <Pressable onPress={() => router.push("/(auth)/login")} className="mt-4 items-center">
        <Text className="text-leaf text-base">{t("auth.haveAccount")}</Text>
      </Pressable>

      <View className="mt-2 mb-6">
        <PrimaryButton label={t("common.back")} onPress={() => router.replace("/(auth)/role-select")} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}
