import { useCallback, useState, useEffect } from "react";
import { Alert, RefreshControl, ScrollView, Text, View, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { LoadingView } from "../../components/LoadingView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AppSettingsModal } from "../../components/AppSettingsModal";
import { useAuthStore } from "../../store/authStore";
import { getOfficerSummary } from "../../services/queries/officer";
import { signOut } from "../../services/auth";
import { supabase } from "../../services/supabase";
import { theme } from "../../constants/theme";

const DEFAULT_SUMMARY = {
  allRows: [],
  inflowRows: [],
  outflowRows: [],
  myHandovers: [],
  totalInflowKg: 0,
  totalInflowValue: 0,
  totalOutflowKg: 0,
  totalOutflowValue: 0,
  activeStockInCirculation: 0,
  qualityCounts: { "Grade A": 0, "Grade B": 0, "Grade C": 0 },
  totalTransactions: 0,
  materialTypesCount: 0,
};

export default function OfficerDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);
  const [summary, setSummary] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const res = await getOfficerSummary(profile.id);
      setSummary(res ?? DEFAULT_SUMMARY);
    } catch (err: any) {
      // Provide fallback so dashboard doesn't remain stuck on loading screen
      setSummary(DEFAULT_SUMMARY);
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`officer_${profile.id}_realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, load]);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function logout() {
    Alert.alert("Confirm Logout", "Are you sure you want to log out of the Officer Portal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await signOut().catch(() => {});
          reset();
          router.replace("/(auth)/role-select");
        },
      },
    ]);
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
        contentContainerStyle={{ paddingBottom: 35 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-4 mb-4">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center flex-wrap">
              <Text className="text-2xl font-black text-bark">Officer Hub</Text>
              <View className="ml-2 px-2.5 py-0.5 bg-leafLight rounded-full border border-leaf/40">
                <Text className="text-[10px] font-bold text-leaf uppercase">Gov SWM Verified</Text>
              </View>
            </View>
            <Text className="text-xs text-bark/70 mt-0.5">
              {profile?.name ?? "Municipal Officer"} • {profile?.department ?? "Solid Waste Management"}
            </Text>
          </View>

          <View className="flex-row items-center">
            {/* Settings & Permissions */}
            <Pressable
              onPress={() => setSettingsOpen(true)}
              className="p-2 bg-sand rounded-full mr-2 border border-line"
            >
              <MaterialCommunityIcons name="cog" size={20} color={theme.bark} />
            </Pressable>

            {/* Logout */}
            <Pressable onPress={logout} className="p-2 bg-sand rounded-full border border-line">
              <MaterialCommunityIcons name="logout" size={20} color={theme.bark} />
            </Pressable>
          </View>
        </View>

        {/* Master Waste Balance Card */}
        <View className="bg-bark rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white/70 text-xs uppercase font-bold tracking-wider">
              Municipal Waste Transparency
            </Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-ok mr-1.5" />
              <Text className="text-white/60 text-[10px] uppercase font-bold">Telemetry Active</Text>
            </View>
          </View>

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
            <Text className="text-white font-black text-sm">
              {summary.activeStockInCirculation.toFixed(1)} kg
            </Text>
          </View>
        </View>

        {/* Waste Quality Grading Breakdown */}
        <View className="bg-sand border border-line rounded-card p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-bold text-bark">Quality & Segregation Index</Text>
            <Text className="text-xs text-leaf font-bold">{pctA}% Segregated</Text>
          </View>
          <View className="flex-row h-3 rounded-full overflow-hidden mb-3 bg-line/50">
            <View style={{ width: `${pctA}%` }} className="bg-leaf" />
            <View style={{ width: `${pctB}%` }} className="bg-warn" />
            <View style={{ width: `${pctC}%` }} className="bg-clay" />
          </View>
          <View className="flex-row justify-between">
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-leaf mr-1.5" />
              <Text className="text-xs text-bark/70 font-medium">Grade A Clean ({pctA}%)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-warn mr-1.5" />
              <Text className="text-xs text-bark/70 font-medium">Grade B Semi ({pctB}%)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-clay mr-1.5" />
              <Text className="text-xs text-bark/70 font-medium">Grade C Mixed ({pctC}%)</Text>
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
          {summary.allRows.length === 0 ? (
            <View className="bg-sand border border-line rounded-card p-5 items-center justify-center my-1">
              <MaterialCommunityIcons name="clipboard-text-clock-outline" size={36} color="#8a7d68" />
              <Text className="font-bold text-bark mt-2 text-sm">No Waste Movements Logged Yet</Text>
              <Text className="text-xs text-bark/60 text-center mt-1 leading-4">
                As local Kabadiwalas collect scrap from residents, live intake and recycling outflow records will populate here automatically.
              </Text>
            </View>
          ) : (
            summary.allRows.slice(0, 6).map((row: any) => {
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
            })
          )}
        </View>

        {/* Account Switcher Footer */}
        <View className="mt-6 pt-4 border-t border-line">
          <Pressable
            onPress={() => setSettingsOpen(true)}
            className="bg-sand border border-line rounded-2xl p-3.5 flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="swap-horizontal-circle" size={24} color={theme.leaf} />
              <View className="ml-2.5">
                <Text className="font-bold text-sm text-bark">Switch to Customer or Kabadiwala</Text>
                <Text className="text-[11px] text-bark/60">Manage permissions or log in as another role</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.bark} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Universal Settings & Permissions Modal */}
      <AppSettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ScreenContainer>
  );
}

