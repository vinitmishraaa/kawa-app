import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, TextInput, View, Pressable, ScrollView } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "../../components/ScreenContainer";
import { LoadingView } from "../../components/LoadingView";
import { SCRAP_CATEGORIES } from "../../constants/scrapCategories";
import { getOfficerMasterTransactions } from "../../services/queries/transactions";
import { useAuthStore } from "../../store/authStore";
import { theme } from "../../constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function OfficerRecords() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);

  const [flow, setFlow] = useState<"all" | "customer_intake" | "officer_handovers">("all");
  const [rows, setRows] = useState<any[] | null>(null);
  const [category, setCategory] = useState("");
  const [qualityGrade, setQualityGrade] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await getOfficerMasterTransactions({
        flow,
        category: category || undefined,
        quality: qualityGrade || undefined,
        minQuantity: minQuantity ? Number(minQuantity) : undefined,
      });
      setRows(data);
    } catch {
      setRows([]);
    }
  }, [profile, flow, category, qualityGrade, minQuantity]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const totalQuantity = (rows ?? []).reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
  const totalValue = (rows ?? []).reduce((sum, row) => sum + Number(row.price ?? 0), 0);

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center mt-4 mb-3">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.bark} />
        </Pressable>
        <View>
          <Text className="text-xl font-bold text-bark">Master Waste Records</Text>
          <Text className="text-xs text-bark/60">End-to-end municipal scrap audit ledger</Text>
        </View>
      </View>

      {/* Aggregate Banner */}
      <View className="flex-row mb-3">
        <View className="flex-1 bg-sand border border-line rounded-card p-3 mr-2">
          <Text className="text-xs text-bark/60">Filtered Quantity</Text>
          <Text className="text-xl font-bold text-bark mt-0.5">{totalQuantity.toFixed(1)} kg</Text>
        </View>
        <View className="flex-1 bg-sand border border-line rounded-card p-3 ml-2">
          <Text className="text-xs text-bark/60">Filtered Value</Text>
          <Text className="text-xl font-bold text-leaf mt-0.5">₹{totalValue.toFixed(0)}</Text>
        </View>
      </View>

      {/* Flow Filter Segments */}
      <View className="flex-row mb-3 bg-sand rounded-xl p-1 border border-line">
        <Pressable
          onPress={() => setFlow("all")}
          className={`flex-1 py-2 rounded-lg items-center ${
            flow === "all" ? "bg-white shadow-sm" : ""
          }`}
        >
          <Text className={`font-bold text-[11px] ${flow === "all" ? "text-bark" : "text-bark/60"}`}>
            All Flow
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFlow("customer_intake")}
          className={`flex-1 py-2 rounded-lg items-center ${
            flow === "customer_intake" ? "bg-white shadow-sm" : ""
          }`}
        >
          <Text className={`font-bold text-[11px] ${flow === "customer_intake" ? "text-leaf" : "text-bark/60"}`}>
            Inflow (Citizen)
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFlow("officer_handovers")}
          className={`flex-1 py-2 rounded-lg items-center ${
            flow === "officer_handovers" ? "bg-white shadow-sm" : ""
          }`}
        >
          <Text className={`font-bold text-[11px] ${flow === "officer_handovers" ? "text-clay" : "text-bark/60"}`}>
            Outflow (Officer)
          </Text>
        </Pressable>
      </View>

      {/* Quality Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2 max-h-9">
        <Pressable
          onPress={() => setQualityGrade("")}
          className={`rounded-full px-3 py-1.5 mr-2 ${
            !qualityGrade ? "bg-leaf" : "bg-sand border border-line"
          }`}
        >
          <Text className={`text-xs font-semibold ${!qualityGrade ? "text-white" : "text-bark"}`}>
            All Quality
          </Text>
        </Pressable>
        {["Grade A (Clean)", "Grade B (Semi-sorted)", "Grade C (Mixed)"].map((g) => (
          <Pressable
            key={g}
            onPress={() => setQualityGrade(qualityGrade === g ? "" : g)}
            className={`rounded-full px-3 py-1.5 mr-2 ${
              qualityGrade === g ? "bg-leaf" : "bg-sand border border-line"
            }`}
          >
            <Text className={`text-xs font-semibold ${qualityGrade === g ? "text-white" : "text-bark"}`}>
              {g}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Material Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 max-h-9">
        <Pressable
          onPress={() => setCategory("")}
          className={`rounded-full px-3 py-1.5 mr-2 ${
            !category ? "bg-bark" : "bg-sand border border-line"
          }`}
        >
          <Text className={`text-xs font-semibold ${!category ? "text-white" : "text-bark"}`}>
            All Materials
          </Text>
        </Pressable>
        {SCRAP_CATEGORIES.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setCategory(category === item.id ? "" : item.id)}
            className={`rounded-full px-3 py-1.5 mr-2 ${
              category === item.id ? "bg-bark" : "bg-sand border border-line"
            }`}
          >
            <Text className={`text-xs font-semibold ${category === item.id ? "text-white" : "text-bark"}`}>
              {t(item.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* List */}
      {rows === null ? (
        <LoadingView />
      ) : rows.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <MaterialCommunityIcons name="clipboard-text-off-outline" size={46} color={theme.line} />
          <Text className="text-bark/60 mt-3 text-center">No waste transaction records found for these filters.</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ paddingBottom: 30 }}
          renderItem={({ item }) => {
            const isOfficerHandover = item.to_role === "officer";
            return (
              <View className="bg-sand border border-line rounded-card p-4 mb-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center mb-1">
                      <View
                        className={`px-2 py-0.5 rounded mr-2 ${
                          isOfficerHandover ? "bg-clay/20" : "bg-leaf/20"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-bold ${
                            isOfficerHandover ? "text-clay" : "text-leaf"
                          }`}
                        >
                          {isOfficerHandover ? "Kabadiwala ➔ Officer" : "Customer ➔ Kabadiwala"}
                        </Text>
                      </View>
                      <Text className="font-bold text-bark capitalize">
                        {item.material_category ?? "General Scrap"}
                      </Text>
                    </View>

                    <Text className="text-xs text-bark/80">
                      From: <Text className="font-semibold">{item.from_profile?.name ?? item.from_role}</Text>
                      {" ➔ "}
                      To: <Text className="font-semibold">{item.to_profile?.name ?? item.to_role}</Text>
                    </Text>
                  </View>

                  <View className="items-end">
                    <Text className="font-bold text-bark text-base">
                      {Number(item.quantity ?? 0).toFixed(1)} kg
                    </Text>
                    <Text className="text-xs font-bold text-leaf">
                      ₹{Number(item.price ?? 0).toFixed(0)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center mt-3 pt-2 border-t border-line/40">
                  <View className="px-2 py-0.5 bg-paper rounded border border-line">
                    <Text className="text-xs text-bark/80 font-medium">
                      {item.quality ?? "Grade A (Clean)"}
                    </Text>
                  </View>
                  <Text className="text-xs text-bark/50">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
}
