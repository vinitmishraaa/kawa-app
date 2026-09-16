import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, TextInput, View, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { ScreenContainer } from "../../components/ScreenContainer";
import { LoadingView } from "../../components/LoadingView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SCRAP_CATEGORIES } from "../../constants/scrapCategories";
import { getOfficerRecords } from "../../services/queries/transactions";
import { useAuthStore } from "../../store/authStore";
import { theme } from "../../constants/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function OfficerRecords() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const [rows, setRows] = useState<any[] | null>(null);
  const [category, setCategory] = useState("");
  const [minQuantity, setMinQuantity] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const data = await getOfficerRecords({
      officerId: profile.id,
      category: category || undefined,
      minQuantity: minQuantity ? Number(minQuantity) : undefined,
    });
    setRows(data);
  }, [profile, category, minQuantity]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  const totalQuantity = (rows ?? []).reduce((sum, row) => sum + Number(row.quantity ?? 0), 0);
  const totalValue = (rows ?? []).reduce((sum, row) => sum + Number(row.price ?? 0), 0);

  return (
    <ScreenContainer>
      <View className="flex-row items-center mt-4 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.bark} />
        </Pressable>
        <Text className="text-2xl font-bold text-bark">{t("officer.recordsTitle")}</Text>
      </View>

      <View className="flex-row mb-3">
        <View className="flex-1 bg-sand border border-line rounded-card p-3 mr-2">
          <Text className="text-xs text-bark/60">{t("officer.totalQuantity")}</Text>
          <Text className="text-xl font-bold text-bark mt-1">{totalQuantity.toFixed(1)} kg</Text>
        </View>
        <View className="flex-1 bg-sand border border-line rounded-card p-3 ml-2">
          <Text className="text-xs text-bark/60">{t("officer.totalValue")}</Text>
          <Text className="text-xl font-bold text-bark mt-1">₹{totalValue.toFixed(0)}</Text>
        </View>
      </View>

      <View className="mb-3">
        <Text className="text-sm font-semibold text-bark mb-2">{t("officer.materialFilter")}</Text>
        <View className="flex-row flex-wrap">
          <Pressable onPress={() => setCategory("")} className={`rounded-full px-4 py-2 mr-2 mb-2 ${!category ? "bg-leaf" : "bg-sand border border-line"}`}>
            <Text className={!category ? "text-white font-semibold" : "text-bark"}>{t("officer.allMaterials")}</Text>
          </Pressable>
          {SCRAP_CATEGORIES.map((item) => (
            <Pressable key={item.id} onPress={() => setCategory(category === item.id ? "" : item.id)}
              className={`rounded-full px-4 py-2 mr-2 mb-2 ${category === item.id ? "bg-leaf" : "bg-sand border border-line"}`}>
              <Text className={category === item.id ? "text-white font-semibold" : "text-bark"}>{t(item.labelKey)}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <TextInput
        value={minQuantity}
        onChangeText={(v) => setMinQuantity(v.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        placeholder={t("officer.minQuantity")}
        placeholderTextColor="#8a7d68"
        className="bg-sand border border-line rounded-card px-4 py-3 mb-4 text-base text-bark"
      />

      {rows === null ? <LoadingView /> : rows.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <MaterialCommunityIcons name="clipboard-text-off-outline" size={46} color={theme.line} />
          <Text className="text-bark/60 mt-3 text-center">{t("officer.noRecords")}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <View className="bg-sand border border-line rounded-card p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-3">
                  <Text className="font-semibold text-bark">
                    {SCRAP_CATEGORIES.find((c) => c.id === item.material_category)
                      ? t(SCRAP_CATEGORIES.find((c) => c.id === item.material_category)!.labelKey)
                      : item.material_category}
                  </Text>
                  <Text className="text-sm text-bark/60 mt-1">
                    {item.from_profile?.name ?? t("officer.unknownKabadiwala")}
                  </Text>
                </View>
                <Text className="font-bold text-bark">₹{Number(item.price ?? 0).toFixed(0)}</Text>
              </View>
              <View className="flex-row justify-between mt-3">
                <Text className="text-sm text-bark/70">{Number(item.quantity ?? 0)} kg</Text>
                <Text className="text-sm text-bark/60">{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
          )}
        />
      )}
    </ScreenContainer>
  );
}
