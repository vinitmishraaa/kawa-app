import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, Text, View, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../components/ScreenContainer";
import { LoadingView } from "../components/LoadingView";
import { SCRAP_CATEGORIES } from "../constants/scrapCategories";
import { getPriceTrend } from "../services/queries/transactions";
import { theme } from "../constants/theme";

export default function PriceTrends() {
  const { t } = useTranslation();
  const [category, setCategory] = useState("");
  const [rows, setRows] = useState<any[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRows(await getPriceTrend(category || undefined));
  }, [category]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const max = Math.max(...(rows ?? []).map((row) => row.avgPrice), 1);

  const refresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  return (
    <ScreenContainer>
      <View className="flex-row items-center mt-4 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.bark} />
        </Pressable>
        <Text className="text-2xl font-bold text-bark">{t("priceTrend.title")}</Text>
      </View>

      <Text className="text-sm text-bark/70 mb-3">{t("priceTrend.subtitle")}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        <Pressable onPress={() => setCategory("")} className={`rounded-full px-4 py-2 mr-2 ${!category ? "bg-leaf" : "bg-sand border border-line"}`}>
          <Text className={!category ? "text-white font-semibold" : "text-bark"}>{t("priceTrend.all")}</Text>
        </Pressable>
        {SCRAP_CATEGORIES.map((item) => (
          <Pressable key={item.id} onPress={() => setCategory(item.id)}
            className={`rounded-full px-4 py-2 mr-2 ${category === item.id ? "bg-leaf" : "bg-sand border border-line"}`}>
            <Text className={category === item.id ? "text-white font-semibold" : "text-bark"}>{t(item.labelKey)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {rows === null ? (
        <LoadingView />
      ) : rows.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <MaterialCommunityIcons name="chart-line" size={52} color={theme.line} />
          <Text className="text-bark/60 text-center mt-3">{t("priceTrend.empty")}</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {rows.map((row) => (
            <View key={row.date} className="bg-sand border border-line rounded-card p-4 mb-3">
              <View className="flex-row justify-between mb-2">
                <Text className="font-semibold text-bark">{new Date(row.date).toLocaleDateString()}</Text>
                <Text className="font-bold text-bark">₹{Number(row.avgPrice).toFixed(0)}</Text>
              </View>
              <View className="h-3 bg-line/40 rounded-full overflow-hidden">
                <View className="h-full bg-leaf rounded-full" style={{ width: `${Math.max(5, (row.avgPrice / max) * 100)}%` }} />
              </View>
              <Text className="text-sm text-bark/60 mt-2">{Number(row.totalQuantity).toFixed(1)} kg</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
