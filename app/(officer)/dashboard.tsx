import { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, Text, View, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { LoadingView } from "../../components/LoadingView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuthStore } from "../../store/authStore";
import { getOfficerSummary } from "../../services/queries/officer";
import { signOut } from "../../services/auth";
import { theme } from "../../constants/theme";

export default function OfficerDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);
  const [summary, setSummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      setSummary(await getOfficerSummary(profile.id));
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    }
  }, [profile, t]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function refresh() {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }

  async function logout() {
    await signOut().catch(() => {});
    reset();
    router.replace("/(auth)/role-select");
  }

  if (summary === null) return <LoadingView />;

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <View className="flex-row items-center justify-between mt-4 mb-6">
          <View>
            <Text className="text-2xl font-bold text-bark">{t("officer.dashboardTitle")}</Text>
            <Text className="text-sm text-bark/60 mt-1">{profile?.name ?? ""}</Text>
          </View>
          <Pressable onPress={logout}>
            <MaterialCommunityIcons name="logout" size={22} color={theme.bark} />
          </Pressable>
        </View>

        <View className="bg-leaf rounded-card p-5 mb-4">
          <Text className="text-white/80 text-sm">{t("officer.totalCollected")}</Text>
          <Text className="text-white text-3xl font-bold mt-1">{summary.totalQuantity.toFixed(1)} kg</Text>
          <Text className="text-white/80 mt-1">₹{summary.totalValue.toFixed(0)}</Text>
        </View>

        <View className="flex-row mb-4">
          <View className="flex-1 bg-sand border border-line rounded-card p-4 mr-2">
            <Text className="text-bark/60 text-xs">{t("officer.handovers")}</Text>
            <Text className="text-2xl font-bold text-bark mt-1">{summary.handovers}</Text>
          </View>
          <View className="flex-1 bg-sand border border-line rounded-card p-4 ml-2">
            <Text className="text-bark/60 text-xs">{t("officer.materialTypes")}</Text>
            <Text className="text-2xl font-bold text-bark mt-1">
              {new Set(summary.rows.map((r: any) => r.material_category)).size}
            </Text>
          </View>
        </View>

        <PrimaryButton label={t("officer.openRecords")} onPress={() => router.push("/(officer)/records")} />
        <View className="mt-3">
          <PrimaryButton label={t("priceTrend.button")} onPress={() => router.push("/price-trends")} variant="secondary" />
        </View>

        <View className="mt-6">
          <Text className="text-lg font-bold text-bark mb-3">{t("officer.recentTitle")}</Text>
          {summary.rows.slice(0, 5).map((row: any) => (
            <View key={row.id} className="bg-sand border border-line rounded-card p-4 mb-3 flex-row justify-between">
              <View>
                <Text className="font-semibold text-bark">{row.material_category}</Text>
                <Text className="text-sm text-bark/60 mt-1">{Number(row.quantity ?? 0)} kg</Text>
              </View>
              <Text className="font-bold text-bark">₹{Number(row.price ?? 0).toFixed(0)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
