import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { RoleCard } from "../../components/RoleCard";
import { useOnboardingStore } from "../../store/onboardingStore";
import { theme } from "../../constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Role } from "../../services/auth";

export default function RoleSelect() {
  const { t } = useTranslation();
  const setSelectedRole = useOnboardingStore((s) => s.setSelectedRole);

  function choose(role: Role) {
    setSelectedRole(role);
    AsyncStorage.setItem("@kawa_intended_role", role).catch(() => {});
    if (role === "officer") {
      router.push("/(auth)/officer-verification");
    } else {
      router.push("/(auth)/signup");
    }
  }

  return (
    <ScreenContainer scroll>
      {/* Top Navigation Bar */}
      <View className="flex-row items-center justify-between mt-2 mb-4">
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(auth)/language-select");
            }
          }}
          className="w-10 h-10 rounded-full bg-sand border border-line items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.bark} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/(auth)/login")}
          className="px-3.5 py-2 bg-leafLight rounded-xl border border-leaf/30 flex-row items-center"
        >
          <MaterialCommunityIcons name="login" size={16} color={theme.leaf} />
          <Text className="text-xs font-bold text-leaf ml-1.5">{t("auth.loginButton", "Log In")}</Text>
        </Pressable>
      </View>

      <View className="mb-6">
        <Text className="text-3xl font-bold text-bark">{t("roleSelect.title")}</Text>
        <Text className="text-base text-bark/70 mt-2">{t("roleSelect.subtitle")}</Text>
      </View>

      <RoleCard
        icon="account-outline"
        title={t("roleSelect.customer")}
        hint={t("roleSelect.customerHint")}
        onPress={() => choose("customer")}
      />
      <RoleCard
        icon="truck-outline"
        title={t("roleSelect.kabadiwala")}
        hint={t("roleSelect.kabadiwalaHint")}
        onPress={() => choose("kabadiwala")}
      />
      <RoleCard
        icon="shield-check-outline"
        title={t("roleSelect.officer")}
        hint={t("roleSelect.officerHint")}
        onPress={() => choose("officer")}
      />
    </ScreenContainer>
  );
}
