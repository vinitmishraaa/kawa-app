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
    if (selectedRole !== "officer") {
      router.replace("/(auth)/role-select");
      return;
    }
    if (!name.trim() || !email.trim() || password.length < 6 || documents.length === 0) {
      Alert.alert(t("officer.verificationRequired"));
      return;
    }

    setLoading(true);
    try {
      const result = await signUp({
        email: email.trim(),
        password,
        role: "officer",
        name: name.trim(),
        phone: phone.trim(),
      });

      const paths = [];
      for (const uri of documents) {
        paths.push(await uploadOfficerDocument(uri, result.user!.id));
      }

      await submitOfficerVerification({
        officerId: result.user!.id,
        documentPaths: paths,
      });

      await refreshProfile().catch(() => {});
      router.replace("/(auth)/officer-pending");
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="mt-5 mb-5">
        <View className="w-16 h-16 rounded-full bg-leafLight items-center justify-center mb-4">
          <MaterialCommunityIcons name="shield-check-outline" size={32} color={theme.leaf} />
        </View>
        <Text className="text-2xl font-bold text-bark">{t("officer.verificationTitle")}</Text>
        <Text className="text-base text-bark/70 mt-2">{t("officer.verificationBody")}</Text>
      </View>

      <TextInput placeholder={t("auth.name") as string} value={name} onChangeText={setName}
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark" placeholderTextColor="#8a7d68" />
      <TextInput placeholder={t("auth.phone") as string} value={phone} onChangeText={setPhone}
        keyboardType="phone-pad" className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark" placeholderTextColor="#8a7d68" />
      <TextInput placeholder={t("auth.email") as string} value={email} onChangeText={setEmail}
        autoCapitalize="none" keyboardType="email-address" className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark" placeholderTextColor="#8a7d68" />
      <TextInput placeholder={t("auth.password") as string} value={password} onChangeText={setPassword}
        secureTextEntry className="bg-sand border border-line rounded-card px-4 py-3 mb-5 text-base text-bark" placeholderTextColor="#8a7d68" />

      <Pressable onPress={pickDocuments} className="bg-sand border border-line rounded-card p-5 mb-4">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="file-document-multiple-outline" size={28} color={theme.leaf} />
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-bark">{t("officer.uploadDocuments")}</Text>
            <Text className="text-sm text-bark/60 mt-1">{t("officer.uploadDocumentsHint")}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.line} />
        </View>

        {documents.length > 0 && (
          <View className="flex-row flex-wrap mt-4">
            {documents.map((uri) => (
              <Image key={uri} source={{ uri }} className="w-20 h-20 rounded-xl mr-2 mb-2" resizeMode="cover" />
            ))}
          </View>
        )}
      </Pressable>

      <PrimaryButton label={t("officer.submitVerification")} onPress={handleSubmit} loading={loading} />
      <View className="mt-3">
        <PrimaryButton label={t("common.back")} onPress={() => router.replace("/(auth)/role-select")} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}
