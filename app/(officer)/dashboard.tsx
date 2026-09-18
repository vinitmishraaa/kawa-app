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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function logout() {
    await signOut().catch(() => {});
    reset();
    router.replace("/(auth)/role-select");
  }

  if (summary === null) return <LoadingView />;

  const totalQuality =
    (summary.qualityCounts["Grade A"] || 0) +
    (summary.qualityCounts["Grade B"] || 0) +
    (summary.qualityCounts["Grade C"] || 0) || 1;

  const pctA = Math.round(((summary.qualityCounts["Grade A"] || 0) / totalQuality) * 100);
  const pctB = Math.round(((summary.qualityCounts["Grade B"] || 0) / totalQuality) * 100);
  const pctC = Math.round(((summary.qualityCounts["Grade C"] || 0) / totalQuality) * 100);

  return (
    <ScreenContainer>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-4 mb-4">
          <View>
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-bark">Officer Hub</Text>
              <View className="ml-2 px-2 py-0.5 bg-leafLight rounded-full border border-leaf/30">
                <Text className="text-[10px] font-bold text-leaf uppercase">Verified Officer</Text>
              </View>
            </View>
            <Text className="text-xs text-bark/60 mt-0.5">
              {profile?.name ?? "Municipal Officer"} • SWM Waste Oversight
            </Text>
          </View>
          <Pressable onPress={logout} className="p-2 bg-sand rounded-full">
            <MaterialCommunityIcons name="logout" size={20} color={theme.bark} />
          </Pressable>
        </View>

        {/* Master Waste Balance Card */}
        <View className="bg-bark rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="text-white/70 text-xs uppercase font-bold tracking-wider mb-2">
            Territory Waste Transparency
          </Text>

          <View className="flex-row justify-between mb-4">
            {/* INTAKE */}
            <View className="flex-1 mr-2 bg-white/10 rounded-xl p-3">
              <View className="flex-row items-center mb-1">
                <MaterialCommunityIcons name="arrow-bottom-left" size={16} color="#85E0A3" />
                <Text className="text-[#85E0A3] text-xs font-bold ml-1">Total Intake</Text>
              </View>
              <Text className="text-white text-xl font-black">
                {summary.totalInflowKg.toFixed(1)} kg
              </Text>
              <Text className="text-white/60 text-[11px] mt-0.5">
                Customer ➔ Kabadiwala
              </Text>
            </View>

            {/* OUTFLOW */}
            <View className="flex-1 ml-2 bg-white/10 rounded-xl p-3">
              <View className="flex-row items-center mb-1">
                <MaterialCommunityIcons name="arrow-top-right" size={16} color="#FFB885" />
                <Text className="text-[#FFB885] text-xs font-bold ml-1">Total Outflow</Text>
              </View>
              <Text className="text-white text-xl font-black">
                {summary.totalOutflowKg.toFixed(1)} kg
              </Text>
              <Text className="text-white/60 text-[11px] mt-0.5">
                Kabadiwala ➔ Officers
              </Text>
            </View>
          </View>

          {/* In-Circulation Balance */}
          <View className="flex-row justify-between items-center pt-3 border-t border-white/15">
            <Text className="text-white/80 text-xs">Circulating Scrap in Network:</Text>
            <Text className="text-white font-bold text-sm">
              {summary.activeStockInCirculation.toFixed(1)} kg
            </Text>
          </View>
        </View>

        {/* Waste Quality Grading Breakdown */}
        <View className="bg-sand border border-line rounded-card p-4 mb-4">
          <Text className="text-sm font-bold text-bark mb-2">Quality & Segregation Index</Text>
          <View className="flex-row h-3 rounded-full overflow-hidden mb-3">
            <View style={{ width: `${pctA}%` }} className="bg-leaf" />
            <View style={{ width: `${pctB}%` }} className="bg-warn" />
            <View style={{ width: `${pctC}%` }} className="bg-clay" />
          </View>
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-leaf mr-1.5" />
              <Text className="text-xs text-bark/70">Grade A Clean ({pctA}%)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-warn mr-1.5" />
              <Text className="text-xs text-bark/70">Grade B Semi ({pctB}%)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-clay mr-1.5" />
              <Text className="text-xs text-bark/70">Grade C Mixed ({pctC}%)</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <PrimaryButton
          label="Open Full Waste Audit Records"
          onPress={() => router.push("/(officer)/records")}
        />
        <View className="mt-2.5">
          <PrimaryButton
            label="View Market Scrap Price Trends"
            onPress={() => router.push("/price-trends")}
            variant="secondary"
          />
        </View>

        {/* Recent Waste Movements */}
        <View className="mt-6">
          <Text className="text-base font-bold text-bark mb-3">Recent Waste Movements</Text>
          {summary.allRows.slice(0, 6).map((row: any) => {
            const isOfficerLeg = row.to_role === "officer";
            return (
              <View
                key={row.id}
                className="bg-sand border border-line rounded-card p-3.5 mb-2.5"
              >
                <View className="flex-row justify-between items-start">
                  <View>
                    <View className="flex-row items-center">
                      <View
                        className={`px-2 py-0.5 rounded-md mr-2 ${
                          isOfficerLeg ? "bg-clay/20" : "bg-leaf/20"
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-bold ${
                            isOfficerLeg ? "text-clay" : "text-leaf"
                          }`}
                        >
                          {isOfficerLeg ? "Kabadiwala ➔ Officer" : "Customer ➔ Kabadiwala"}
                        </Text>
                      </View>
                      <Text className="font-bold text-bark capitalize">
                        {row.material_category ?? "Scrap"}
                      </Text>
                    </View>
                    <Text className="text-xs text-bark/50 mt-1">
                      {new Date(row.created_at).toLocaleDateString()} • {row.quality ?? "Grade A"}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="font-extrabold text-bark text-base">
                      {Number(row.quantity ?? 0).toFixed(1)} kg
                    </Text>
                    <Text className="text-xs text-leaf font-bold">
                      ₹{Number(row.price ?? 0).toFixed(0)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
