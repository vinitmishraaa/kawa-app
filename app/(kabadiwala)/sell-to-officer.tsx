import { useCallback, useState } from "react";
import { Alert, Text, TextInput, View, FlatList, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { LoadingView } from "../../components/LoadingView";
import { SCRAP_CATEGORIES } from "../../constants/scrapCategories";
import { getProfileById, getVerifiedOfficers } from "../../services/queries/profiles";
import { recordOfficerSale, QUALITY_GRADES } from "../../services/queries/transactions";
import { getCurrentCoords } from "../../services/location";
import { useAuthStore } from "../../store/authStore";
import { theme } from "../../constants/theme";

export default function SellToOfficer() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const [officers, setOfficers] = useState<any[] | null>(null);
  const [officerId, setOfficerId] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [quality, setQuality] = useState("Grade A (Clean)");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setOfficers(await getVerifiedOfficers());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function submit() {
    if (!profile || !officerId || !category || Number(quantity) <= 0 || Number(price) <= 0) {
      Alert.alert(t("sellOfficer.required"));
      return;
    }

    setLoading(true);
    try {
      const coords = await getCurrentCoords().catch(() => null);
      await recordOfficerSale({
        kabadiwalaId: profile.id,
        officerId,
        category,
        quantity: Number(quantity),
        price: Number(price),
        quality,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      const officer = await getProfileById(officerId);
      Alert.alert(
        t("sellOfficer.successTitle"),
        t("sellOfficer.successBody", {
          name: officer?.name ?? t("sellOfficer.officer"),
          phone: officer?.phone ?? t("sellOfficer.noPhone"),
        }),
        [{ text: t("common.next"), onPress: () => router.replace("/(kabadiwala)/dashboard") }]
      );
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setLoading(false);
    }
  }

  if (officers === null) return <LoadingView />;

  return (
    <ScreenContainer scroll>
      <View className="flex-row items-center mt-4 mb-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.bark} />
        </Pressable>
        <Text className="text-2xl font-bold text-bark">{t("sellOfficer.title")}</Text>
      </View>

      <Text className="text-sm font-semibold text-bark mb-2">{t("sellOfficer.chooseOfficer")}</Text>
      {officers.length === 0 ? (
        <View className="bg-sand rounded-card p-5 border border-line mb-5">
          <Text className="text-bark/70">{t("sellOfficer.noOfficers")}</Text>
        </View>
      ) : (
        <FlatList
          horizontal
          data={officers}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          className="mb-5"
          renderItem={({ item }) => (
            <Pressable onPress={() => setOfficerId(item.id)}
              className={`mr-3 rounded-card border px-4 py-4 min-w-[155px] ${officerId === item.id ? "bg-leaf border-leaf" : "bg-sand border-line"}`}>
              <MaterialCommunityIcons name="shield-account-outline" size={28} color={officerId === item.id ? "#fff" : theme.leaf} />
              <Text className={`${officerId === item.id ? "text-white" : "text-bark"} font-semibold mt-2`} numberOfLines={1}>
                {item.name ?? t("sellOfficer.officer")}
              </Text>
              <Text className={`${officerId === item.id ? "text-white/80" : "text-bark/60"} text-sm mt-1`}>
                ★ {Number(item.rating ?? 0).toFixed(1)}
              </Text>
            </Pressable>
          )}
        />
      )}

      <Text className="text-sm font-semibold text-bark mb-2">{t("sellOfficer.material")}</Text>
      <View className="flex-row flex-wrap mb-3">
        {SCRAP_CATEGORIES.map((item) => (
          <Pressable key={item.id} onPress={() => setCategory(category === item.id ? "" : item.id)}
            className={`rounded-full px-4 py-2 mr-2 mb-2 ${category === item.id ? "bg-leaf" : "bg-sand border border-line"}`}>
            <Text className={category === item.id ? "text-white font-semibold" : "text-bark"}>{t(item.labelKey)}</Text>
          </Pressable>
        ))}
      </View>

      <Text className="text-sm font-semibold text-bark mb-2">Quality Grade</Text>
      <View className="flex-row flex-wrap mb-4 gap-2">
        {["Grade A (Clean)", "Grade B (Semi-sorted)", "Grade C (Mixed)"].map((g) => (
          <Pressable
            key={g}
            onPress={() => setQuality(g)}
            className={`px-3.5 py-2 rounded-full border ${
              quality === g ? "bg-leaf border-leaf" : "bg-sand border-line"
            }`}
          >
            <Text className={`text-xs font-semibold ${quality === g ? "text-white" : "text-bark"}`}>
              {g}
            </Text>
          </Pressable>
        ))}
      </View>

      <TextInput value={quantity} onChangeText={(v) => setQuantity(v.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad" placeholder={t("sellOfficer.quantity")} placeholderTextColor="#8a7d68"
        className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark" />
      <TextInput value={price} onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad" placeholder={t("sellOfficer.price")} placeholderTextColor="#8a7d68"
        className="bg-sand border border-line rounded-card px-4 py-3 mb-5 text-base text-bark" />

      <PrimaryButton label={t("sellOfficer.confirm")} onPress={submit} loading={loading} />
    </ScreenContainer>
  );
}
