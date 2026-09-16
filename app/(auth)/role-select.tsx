import { Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "../../components/ScreenContainer";
import { RoleCard } from "../../components/RoleCard";
import { useOnboardingStore } from "../../store/onboardingStore";
import type { Role } from "../../services/auth";

export default function RoleSelect() {
  const { t } = useTranslation();
  const setSelectedRole = useOnboardingStore((s) => s.setSelectedRole);

  function choose(role: Role) {
    setSelectedRole(role);
    if (role === "officer") {
      router.push("/(auth)/officer-verification");
    } else {
      router.push("/(auth)/signup");
    }
  }

  return (
    <ScreenContainer>
      <View className="mt-8 mb-8">
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
