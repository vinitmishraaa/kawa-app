import { useCallback, useState, useEffect } from "react";
import { RefreshControl, ScrollView, Text, View, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { ScreenContainer } from "../components/ScreenContainer";
import { LoadingView } from "../components/LoadingView";
import { SCRAP_CATEGORIES } from "../constants/scrapCategories";
import { getPriceTrend } from "../services/queries/transactions";
import { theme } from "../constants/theme";

export default function PriceTrends() {
  const { t, i18n } = useTranslation();
  const [category, setCategory] = useState("ewaste");
  const [rows, setRows] = useState<any[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const load = useCallback(async () => {
    setRows(await getPriceTrend(category === "all" ? undefined : category));
  }, [category]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const max = Math.max(...(rows ?? []).map((row) => row.avgPrice), 1);

  const refresh = async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  };

  const selectedCategoryObj = SCRAP_CATEGORIES.find((c) => c.id === category);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        Speech.stop();
        setIsSpeaking(false);
      };
    }, [])
  );

  function speakPrices() {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const lang = i18n.language || "en";
    let speechText = "";

    if (lang.startsWith("mr")) {
      speechText =
        "आजचा ई-कचरा व भंगार खरेदी भाव. सर्किट बोर्ड 350 ते 550 रुपये प्रति किलो. लिथियम बॅटऱ्या 120 ते 220 रुपये प्रति किलो. तांब्याच्या वायर्स 420 ते 620 रुपये प्रति किलो. सीआरटी स्क्रीन 80 ते 180 रुपये प्रति नग. सर्व माल अधिकृत रिसायकलरला दिल्यास पूर्ण वजन व रोख मोबदला मिळतो.";
    } else if (lang.startsWith("hi")) {
      speechText =
        "आज का ई-वेस्ट और कबाड़ का ताजा भाव. सर्किट बोर्ड 350 से 550 रुपये प्रति किलो. लिथियम बैटरी 120 से 220 रुपये प्रति किलो. तांबे की तारें 420 से 620 रुपये प्रति किलो. सीआरटी स्क्रीन 80 से 180 रुपये प्रति पीस. माल सीधे अधिकृत रिसायकलर को दें और सही नकद भाव पाएं।";
    } else if (lang.startsWith("bn")) {
      speechText =
        "আজকের অফিসিয়াল ই-বর্জ্য ও স্ক্র্যাপের বাজার দর। সার্কিট বোর্ড ৩৫০ থেকে ৫৫০ টাকা প্রতি কেজি। লিথিয়াম ব্যাটারি ১২০ থেকে ২২০ টাকা প্রতি কেজি। তামার তার ৪২০ থেকে ৬২০ টাকা প্রতি কেজি। সিআরটি স্ক্রিন ৮০ থেকে ১৮০ টাকা প্রতি পিস। অনুমোদিত রিসাইক্লারকে সরাসরি স্ক্র্যাপ দিলে সঠিক ওজন ও সেরা নগদ দাম পাওয়া যায়।";
    } else {
      speechText =
        "Today's official buying rates under E-Waste Rules 2022. Circuit boards: 350 to 550 rupees per kg. Lithium batteries: 120 to 220 rupees per kg. Copper cables: 420 to 620 rupees per kg. CRT screens: 80 to 180 rupees per piece. Handover directly to authorized recyclers for certified weights and maximum payout.";
    }

    const voiceLang = lang.startsWith("mr")
      ? "mr-IN"
      : lang.startsWith("hi")
      ? "hi-IN"
      : lang.startsWith("bn")
      ? "bn-IN"
      : "en-IN";

    setIsSpeaking(true);
    Speech.speak(speechText, {
      language: voiceLang,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  return (
    <ScreenContainer>
      {/* Top Header Bar */}
      <View className="flex-row items-center justify-between mt-3 mb-2">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => {
              Speech.stop();
              router.back();
            }}
            className="mr-3 w-10 h-10 rounded-full bg-sand border border-line items-center justify-center"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={theme.bark} />
          </Pressable>
          <Text className="text-xl font-bold text-bark">{t("priceTrend.title", "Price Trends")}</Text>
        </View>

        {/* Voice Readout Button */}
        <Pressable
          onPress={speakPrices}
          className={`flex-row items-center px-3 py-2 rounded-xl border ${
            isSpeaking ? "bg-clay border-clay" : "bg-leafLight border-leaf/30"
          }`}
        >
          <MaterialCommunityIcons
            name={isSpeaking ? "volume-off" : "volume-high"}
            size={18}
            color={isSpeaking ? "#FFFFFF" : theme.leaf}
          />
          <Text
            className={`text-xs font-bold ml-1.5 ${
              isSpeaking ? "text-white" : "text-leaf"
            }`}
          >
            {isSpeaking ? "Stop" : t("priceTrend.listenPrices", "🔊 Listen Rates")}
          </Text>
        </Pressable>
      </View>

      <Text className="text-xs text-bark/70 mb-3">
        {t("priceTrend.subtitle", "Authorized Recycler buying prices under E-Waste Rules 2022.")}
      </Text>

      {/* Category Horizontal Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-3 max-h-12"
      >
        <Pressable
          onPress={() => setCategory("all")}
          className={`rounded-full px-4 py-2 mr-2 ${
            category === "all" ? "bg-leaf" : "bg-sand border border-line"
          }`}
        >
          <Text className={category === "all" ? "text-white font-semibold text-xs" : "text-bark text-xs"}>
            {t("priceTrend.all", "All")}
          </Text>
        </Pressable>
        {SCRAP_CATEGORIES.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setCategory(item.id)}
            className={`rounded-full px-4 py-2 mr-2 flex-row items-center ${
              category === item.id ? "bg-leaf" : "bg-sand border border-line"
            }`}
          >
            <MaterialCommunityIcons
              name={item.icon as any}
              size={14}
              color={category === item.id ? "#FFFFFF" : theme.bark}
            />
            <Text
              className={`ml-1 text-xs ${
                category === item.id ? "text-white font-semibold" : "text-bark"
              }`}
            >
              {t(item.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* BENCHMARK RATE CARD for Selected Category */}
      {selectedCategoryObj && selectedCategoryObj.subCategories.length > 0 && (
        <View className="bg-white border border-line rounded-card p-3 mb-3 shadow-xs">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-bark uppercase tracking-wider">
              {t(selectedCategoryObj.labelKey)} Benchmark Rates
            </Text>
            <Text className="text-[10px] text-leaf font-bold">CPCB Reference Rates</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
            {selectedCategoryObj.subCategories.map((sub) => (
              <View
                key={sub.id}
                className="bg-sand/80 border border-line rounded-xl px-3 py-2 mr-2 min-w-[140px]"
              >
                <Text className="font-bold text-bark text-xs" numberOfLines={1}>
                  {t(sub.labelKey)}
                </Text>
                <Text className="text-leaf font-extrabold text-sm mt-0.5">
                  ₹{sub.minPrice ?? 20} - ₹{sub.maxPrice ?? 50} / kg
                </Text>
                {sub.criticalMinerals && (
                  <Text className="text-[9px] text-bark/60 mt-0.5 font-medium" numberOfLines={1}>
                    ✨ {sub.criticalMinerals.slice(0, 2).join(", ")}
                  </Text>
                )}
                {sub.isHazardous && (
                  <Text className="text-[9px] text-clay font-bold mt-0.5">⚠️ Hazardous</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* RECENT HISTORICAL TRANSACTIONS GRAPH / LIST */}
      <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-2">
        Recent Recycler Handover Transactions
      </Text>

      {rows === null ? (
        <LoadingView />
      ) : rows.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <MaterialCommunityIcons name="chart-line" size={48} color={theme.line} />
          <Text className="text-bark/60 text-center text-xs mt-2">
            {t("priceTrend.empty", "No transactions found yet.")}
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {rows.map((row, idx) => (
            <View key={idx} className="bg-sand border border-line rounded-card p-3 mb-2.5">
              <View className="flex-row justify-between items-center mb-1.5">
                <Text className="font-semibold text-bark text-xs">
                  {new Date(row.date).toLocaleDateString()}
                </Text>
                <Text className="font-extrabold text-leaf text-sm">
                  ₹{Number(row.avgPrice).toFixed(0)} / kg
                </Text>
              </View>

              <View className="h-2.5 bg-line/40 rounded-full overflow-hidden">
                <View
                  className="h-full bg-leaf rounded-full"
                  style={{ width: `${Math.max(8, (row.avgPrice / max) * 100)}%` }}
                />
              </View>

              <View className="flex-row justify-between items-center mt-1.5">
                <Text className="text-[11px] text-bark/60">
                  Total Volume: {Number(row.totalQuantity).toFixed(1)} kg
                </Text>
                <Text className="text-[10px] text-bark/50 font-semibold">
                  EPR Handover Verified ✓
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
