import { useState, useEffect, useCallback } from "react";
import { Text, View, ScrollView, Pressable } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { ScreenContainer } from "../../components/ScreenContainer";
import { theme } from "../../constants/theme";

export default function UnitEconomicsHub() {
  const { t, i18n } = useTranslation();
  const [lotWeightKg, setLotWeightKg] = useState(50);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Dynamic calculations based on selected weight
  // 1. Informal route: loss of critical minerals + acid costs + health degradation
  const informalGross = Math.round(lotWeightKg * 64);
  const informalHealthLoss = Math.round(lotWeightKg * 12);
  const informalPenaltyRisk = Math.round(lotWeightKg * 8);
  const informalNet = Math.max(0, informalGross - informalHealthLoss - informalPenaltyRisk);

  // 2. Kawa Formal route: certified CPCB recycler price + EPR green incentive bonus
  const formalRecyclerPayout = Math.round(lotWeightKg * 132);
  const formalEprBonus = Math.round(lotWeightKg * 10);
  const formalPlatformFee = Math.round(lotWeightKg * 3); // 2.3% platform sustainability fee paid by recycler
  const formalNet = formalRecyclerPayout + formalEprBonus - formalPlatformFee;

  const netGain = formalNet - informalNet;
  const percentageGain = Math.round((netGain / (informalNet || 1)) * 100);

  // Voice narration
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

  function toggleSpeech() {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    const lang = i18n.language || "en";
    let text = "";

    if (lang.startsWith("mr")) {
      text = `युनिट इकॉनॉमिक्स तुलना. अनधिकृत पद्धतीने वायर जाळणे आणि ॲसिड वॉशिंग केल्याने सोन्यासारखे मौल्यवान धातू नष्ट होतात आणि आरोग्याचे नुकसान होते. कावा ॲपद्वारे अधिकृत रिसायकलरला माल दिल्यास प्रमाणित वजन, ईपीआर बोनस मिळतो आणि नफ्यात सत्तर ते ऐंशी टक्के वाढ होते.`;
    } else if (lang.startsWith("hi")) {
      text = `मुनाफा और कमाई की तुलना। अवैध तरीके से तार जलाने या एसिड से पीसीबी धोने पर भारी नुकसान होता है। कावा ऐप के जरिए रजिस्टर्ड रीसाइक्लर को माल देने पर सही वजन, सरकारी ईपीआर बोनस और लगभग दुगनी कमाई होती है।`;
    } else if (lang.startsWith("bn")) {
      text = `লাভের তুলনা। অননুমোদিত উপায়ে তার পোড়ানো বা অ্যাসিড ব্যবহারে ভারী ক্ষতি হয়। কাওয়ার মাধ্যমে অনুমোদিত রিসাইক্লারে বিক্রি করলে অনেক বেশি দাম ও সরকারি বোনাস পাওয়া যায়।`;
    } else {
      text = `Unit economics assessment. Informal backyard wire burning and acid leaching destroys critical minerals like lithium, gallium, and gold. Selling through Kawa to authorized CPCB recyclers yields certified weights, EPR green bonuses, and up to 80% higher net earnings.`;
    }

    const voiceLang = lang.startsWith("mr")
      ? "mr-IN"
      : lang.startsWith("hi")
      ? "hi-IN"
      : lang.startsWith("bn")
      ? "bn-IN"
      : "en-IN";

    setIsSpeaking(true);
    Speech.speak(text, {
      language: voiceLang,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  const weightPresets = [20, 50, 100, 250, 500];

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-1 mb-3">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => router.back()} className="p-2 mr-2 rounded-full bg-sand border border-line">
            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.bark} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-black text-bark">Unit Economics Hub</Text>
            <Text className="text-xs text-leaf font-semibold">मुनाफा व कमाई तुलना • E-Waste Rules 2022</Text>
          </View>
        </View>

        <Pressable
          onPress={toggleSpeech}
          className={`p-2 rounded-full border ${
            isSpeaking ? "bg-leaf border-leaf" : "bg-sand border-line"
          }`}
          accessibilityLabel="Audio Speech"
        >
          <MaterialCommunityIcons
            name={isSpeaking ? "volume-high" : "volume-medium"}
            size={22}
            color={isSpeaking ? "#FFF" : theme.bark}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
      >
        {/* Banner summary */}
        <View className="bg-leaf rounded-2xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-white/80 text-xs font-bold uppercase tracking-wider">
                Collector Income Upgrade
              </Text>
              <Text className="text-white text-2xl font-black mt-0.5">
                +{percentageGain}% Higher Earnings
              </Text>
            </View>
            <View className="p-2 rounded-xl bg-white/20">
              <MaterialCommunityIcons name="trending-up" size={26} color="#FFF" />
            </View>
          </View>
          <Text className="text-white/90 text-xs mt-2 leading-4">
            For a <Text className="font-bold text-white">{lotWeightKg} kg</Text> e-waste batch, formal CPCB recycling adds <Text className="font-bold text-white">+₹{netGain}</Text> extra clean cash into your pocket.
          </Text>
        </View>

        {/* VOLUME PRESET SELECTOR */}
        <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-2">
          Select Lot Collection Weight (वजन चुनें)
        </Text>
        <View className="flex-row gap-1.5 mb-4">
          {weightPresets.map((w) => {
            const isSelected = lotWeightKg === w;
            return (
              <Pressable
                key={w}
                onPress={() => setLotWeightKg(w)}
                className={`flex-1 py-2.5 rounded-xl items-center justify-center border ${
                  isSelected ? "bg-leaf border-leaf" : "bg-sand border-line"
                }`}
              >
                <Text
                  className={`font-black text-xs ${
                    isSelected ? "text-white" : "text-bark"
                  }`}
                >
                  {w} kg
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* SIDE BY SIDE COMPARISON */}
        <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-2">
          Channel Comparison (कहाँ कितना फायदा?)
        </Text>

        {/* ROUTE 1: INFORMAL BACKYARD BURNING */}
        <View className="bg-clay/10 border-2 border-clay/30 rounded-2xl p-4 mb-3">
          <View className="flex-row items-center justify-between pb-2 border-b border-clay/20 mb-2.5">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="fire" size={20} color={theme.clay} />
              <Text className="font-black text-clay text-sm ml-1.5">
                1. Informal Backyard Processing (कबाड़ जलाना / एसिड)
              </Text>
            </View>
          </View>

          <View className="gap-1.5 mb-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-bark/70">Raw Scrap Resale (Middleman rate):</Text>
              <Text className="text-xs font-bold text-bark">₹{informalGross}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-clay">Critical Minerals Lost (Gold/Lithium):</Text>
              <Text className="text-xs font-bold text-clay">-90% Extracted</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-clay">Medical & Health Costs (Toxic Fumes):</Text>
              <Text className="text-xs font-bold text-clay">-₹{informalHealthLoss}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-clay">Municipal Legal Penalty Risk:</Text>
              <Text className="text-xs font-bold text-clay">-₹{informalPenaltyRisk}</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center pt-2 border-t border-clay/30">
            <Text className="text-xs font-black text-clay">Net Collector Realization:</Text>
            <Text className="text-base font-black text-clay">₹{informalNet} (₹{(informalNet / lotWeightKg).toFixed(1)}/kg)</Text>
          </View>
        </View>

        {/* ROUTE 2: KAWA CPCB FORMAL CHANNEL */}
        <View className="bg-leafLight/90 border-2 border-leaf rounded-2xl p-4 mb-4 shadow-xs">
          <View className="flex-row items-center justify-between pb-2 border-b border-leaf/30 mb-2.5">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="shield-check" size={20} color={theme.leaf} />
              <Text className="font-black text-leaf text-sm ml-1.5">
                2. Kawa CPCB Authorized Recycler (रजिस्टर्ड चैनल)
              </Text>
            </View>
            <View className="px-2 py-0.5 rounded-full bg-leaf">
              <Text className="text-[10px] font-black text-white">Recommended</Text>
            </View>
          </View>

          <View className="gap-1.5 mb-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-bark/70">Certified Digital Weight Payout:</Text>
              <Text className="text-xs font-bold text-bark">₹{formalRecyclerPayout}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-leaf font-semibold">CPCB EPR Green Bonus (+₹10/kg):</Text>
              <Text className="text-xs font-bold text-leaf">+₹{formalEprBonus}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-leaf font-semibold">100% Minerals Recovered (Gold/Li/Co):</Text>
              <Text className="text-xs font-bold text-leaf">Fully Valued</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-xs text-bark/60">Platform Facilitation (EPR fee):</Text>
              <Text className="text-xs font-semibold text-bark/60">-₹{formalPlatformFee}</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center pt-2 border-t border-leaf/40">
            <Text className="text-xs font-black text-leaf">Net Collector Realization:</Text>
            <Text className="text-lg font-black text-leaf">₹{formalNet} (₹{(formalNet / lotWeightKg).toFixed(1)}/kg)</Text>
          </View>
        </View>

        {/* PLATFORM SUSTAINABILITY BOX */}
        <View className="bg-sand border border-line rounded-2xl p-3.5 mb-4">
          <View className="flex-row items-center mb-1.5">
            <MaterialCommunityIcons name="chart-pie" size={18} color={theme.bark} />
            <Text className="font-black text-bark text-xs ml-1.5 uppercase tracking-wider">
              Platform Business Model & Sustainability
            </Text>
          </View>
          <Text className="text-xs text-bark/80 leading-5">
            • <Text className="font-bold text-bark">Zero Cost to Collectors:</Text> Informal waste pickers and kabadiwalas pay ₹0 to use Kawa.
          </Text>
          <Text className="text-xs text-bark/80 leading-5 mt-1">
            • <Text className="font-bold text-bark">EPR Industry Revenue:</Text> Authorized recyclers and electronics brands fund platform operations by paying a 2.5% CPCB traceability and compliance fee on confirmed lots.
          </Text>
        </View>

        {/* QUICK ACTION */}
        <Pressable
          onPress={() => router.push("/(kabadiwala)/create-lot")}
          className="py-3.5 px-4 bg-leaf rounded-xl items-center justify-center flex-row shadow-sm"
        >
          <MaterialCommunityIcons name="qrcode-scan" size={18} color="#FFF" />
          <Text className="text-white font-black text-sm ml-2">
            Create Digital Lot & Claim Higher Rates
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
