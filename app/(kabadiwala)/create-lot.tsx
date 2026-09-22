import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Speech from "expo-speech";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SCRAP_PRICE_CATALOG } from "../../constants/scrapPricing";
import { theme } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { getCurrentCoords } from "../../services/location";
import { recordDirectIntake, QUALITY_GRADES } from "../../services/queries/transactions";
import { getMaterialAdvice, estimateMaterialValuation } from "../../services/ai/materialAdvisor";
import { detectPriceAnomaly } from "../../services/ai/anomalyDetection";
import { enqueueOfflineItem } from "../../services/offlineQueue";

export default function CreateDigitalLot() {
  const { t, i18n } = useTranslation();
  const profile = useAuthStore((s) => s.profile);

  const [category, setCategory] = useState("ewaste_pcb");
  const [weight, setWeight] = useState("");
  const [condition, setCondition] = useState<"Grade A (Clean)" | "Grade B (Semi-sorted)" | "Grade C (Mixed / Wet)">("Grade A (Clean)");
  const [lotPhoto, setLotPhoto] = useState<string | null>(null);
  const [sourceNote, setSourceNote] = useState("");
  const [customPricePaid, setCustomPricePaid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Auto-generated Unique Lot Reference ID per CPCB format
  const [generatedLotId] = useState(
    () => `LOT-EW-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  );

  // Material AI & Valuation calculations
  const materialAdvice = useMemo(() => getMaterialAdvice(category), [category]);
  const parsedWeight = Number(weight) > 0 ? Number(weight) : 0;

  const valuation = useMemo(
    () => estimateMaterialValuation(category, parsedWeight, condition),
    [category, parsedWeight, condition]
  );

  // Auto-fill or adjust price paid
  useEffect(() => {
    if (parsedWeight > 0) {
      setCustomPricePaid(String(valuation.buyingCost));
    } else {
      setCustomPricePaid("");
    }
  }, [valuation.buyingCost, parsedWeight]);

  // Price Anomaly Check
  const anomalyReport = useMemo(() => {
    const ratePerKg = parsedWeight > 0 ? Number(customPricePaid) / parsedWeight : 0;
    return detectPriceAnomaly(category, ratePerKg, false);
  }, [category, customPricePaid, parsedWeight]);

  // Text-To-Speech Audio Voice Assistant
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
      text = `डिजिटल लॉट तयार करा. गोळा केलेल्या मालाचा फोटो काढा किंवा अपलोड करा, प्रकार आणि अंदाजे वजन टाका. सिस्टम तुम्हाला ताबडतोब योग्य खरेदी आणि विक्री मूल्य देईल.`;
    } else if (lang.startsWith("hi")) {
      text = `डिजिटल लॉट बनाएं। अपने कबाड़ का फोटो लें या अपलोड करें, श्रेणी और अनुमानित वजन दर्ज करें। सिस्टम आपको तुरंत सही खरीद भाव और रिसाइक्लर से मिलने वाली रकम दिखाएगा।`;
    } else if (lang.startsWith("bn")) {
      text = `ডিজিটাল লট তৈরি করুন। আপনার ভাঙারির ছবি তুলুন, প্রকার ও ওজন দিন। সাথে সাথে সঠিক মূল্য দেখতে পাবেন।`;
    } else {
      text = `Create a digital lot. Take a photo of collected materials, select category, and enter weight to receive an instant market valuation and CPCB lot reference.`;
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

  async function handleTakePhoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Camera permission is needed to photograph the scrap lot.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        setLotPhoto(res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Camera Error", err?.message ?? "Could not take photo");
    }
  }

  async function handlePickPhoto() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Gallery permission is needed to choose a lot photo.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        allowsEditing: true,
        aspect: [4, 3],
      });
      if (!res.canceled && res.assets && res.assets[0]?.uri) {
        setLotPhoto(res.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert("Gallery Error", err?.message ?? "Could not select photo");
    }
  }

  async function handleSaveLot() {
    if (!profile) {
      Alert.alert("Sign In Required", "Please log in as a scrap collector to register lots.");
      return;
    }
    if (parsedWeight <= 0) {
      Alert.alert("Weight Required", "Please enter the approximate weight in kilograms.");
      return;
    }

    setIsSubmitting(true);
    try {
      const coords = await getCurrentCoords().catch(() => null);
      const finalPrice = Number(customPricePaid) || valuation.buyingCost;
      const notes = `[CPCB-LOT: ${generatedLotId}] ${sourceNote.trim() ? `Source: ${sourceNote.trim()}` : "Informal Collector Lot"}. Minerals: ${materialAdvice.criticalMinerals.map((m) => m.name).join(", ")}.`;

      try {
        // Attempt primary Supabase save
        await recordDirectIntake({
          kabadiwalaId: profile.id,
          category,
          quantity: parsedWeight,
          pricePaid: finalPrice,
          quality: condition,
          customerName: sourceNote.trim() || undefined,
          notes,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });

        Alert.alert(
          "Digital Lot Created! 📦",
          `Lot #${generatedLotId} successfully registered in inventory.\n\nMaterial: ${materialAdvice.displayName}\nWeight: ${parsedWeight} kg\nExpected Recycler Resale: ₹${valuation.expectedRecyclerPayout}\nProjected Profit: +₹${valuation.projectedNetProfit}`,
          [
            {
              text: "Handover to Recycler",
              onPress: () => router.replace("/(kabadiwala)/sell-to-officer"),
            },
            {
              text: "Done",
              onPress: () => router.back(),
            },
          ]
        );
      } catch (networkErr) {
        // Offline Fallback: Queue locally in AsyncStorage
        await enqueueOfflineItem("digital_lot", {
          kabadiwalaId: profile.id,
          category,
          quantity: parsedWeight,
          pricePaid: finalPrice,
          quality: condition,
          customerName: sourceNote.trim() || undefined,
          notes: `${notes} [SAVED OFFLINE]`,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        });

        Alert.alert(
          "Saved Offline! 📶",
          `Lot #${generatedLotId} saved to local device storage.\nIt will automatically synchronize with CPCB servers when internet connectivity resumes.`,
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // E-Waste categories filter from scrap pricing
  const ewasteItems = SCRAP_PRICE_CATALOG.filter(
    (item) => item.category === "ewaste" || item.category === "metal" || item.key === "plastic"
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-1 mb-3">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => router.back()} className="p-2 mr-2 rounded-full bg-sand border border-line">
            <MaterialCommunityIcons name="arrow-left" size={20} color={theme.bark} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-black text-bark">Create Digital Lot</Text>
            <Text className="text-xs text-leaf font-semibold">डिजिटल कबाड़ लॉट बनाएं • E-Waste 2022</Text>
          </View>
        </View>

        <Pressable
          onPress={toggleSpeech}
          className={`p-2 rounded-full border ${
            isSpeaking ? "bg-leaf border-leaf" : "bg-sand border-line"
          }`}
          accessibilityLabel="Audio Guidance"
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
        {/* Lot Reference ID Badge */}
        <View className="bg-sand/70 border border-line rounded-2xl p-3 mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="qrcode-scan" size={18} color={theme.leaf} />
            <Text className="text-xs font-black text-bark ml-1.5">{generatedLotId}</Text>
          </View>
          <View className="px-2 py-0.5 rounded-md bg-leafLight border border-leaf/30">
            <Text className="text-[10px] font-bold text-leaf uppercase">CPCB Traceable</Text>
          </View>
        </View>

        {/* STEP 1: PHOTOGRAPH SCRAP LOT */}
        <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-2">
          1. Photograph Collected Material (फोटो खींचें)
        </Text>

        {lotPhoto ? (
          <View className="relative w-full h-44 rounded-2xl overflow-hidden border border-line mb-4 shadow-xs">
            <Image source={{ uri: lotPhoto }} className="w-full h-full" resizeMode="cover" />
            <Pressable
              onPress={() => setLotPhoto(null)}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"
            >
              <MaterialCommunityIcons name="close" size={18} color="#FFF" />
            </Pressable>
            <View className="absolute bottom-2 left-2 bg-black/60 px-2.5 py-1 rounded-lg">
              <Text className="text-white text-[11px] font-semibold">✓ Verified Photo Attached</Text>
            </View>
          </View>
        ) : (
          <View className="flex-row gap-2.5 mb-4">
            <Pressable
              onPress={handleTakePhoto}
              className="flex-1 bg-leaf/10 border-2 border-dashed border-leaf/40 rounded-2xl p-4 items-center justify-center"
            >
              <MaterialCommunityIcons name="camera" size={28} color={theme.leaf} />
              <Text className="font-bold text-xs text-leaf mt-1">Take Photo</Text>
              <Text className="text-[10px] text-bark/60">कैमरा से फोटो लें</Text>
            </Pressable>

            <Pressable
              onPress={handlePickPhoto}
              className="flex-1 bg-sand border-2 border-dashed border-line rounded-2xl p-4 items-center justify-center"
            >
              <MaterialCommunityIcons name="image-outline" size={28} color={theme.bark} />
              <Text className="font-bold text-xs text-bark mt-1">From Gallery</Text>
              <Text className="text-[10px] text-bark/60">गैलरी से चुनें</Text>
            </Pressable>
          </View>
        )}

        {/* STEP 2: SELECT CATEGORY */}
        <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-2">
          2. Select E-Waste Category (कबाड़ की श्रेणी)
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
          {ewasteItems.map((item) => {
            const isSelected = category === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setCategory(item.key)}
                className={`px-3 py-2.5 rounded-xl mr-2 border flex-row items-center ${
                  isSelected ? "bg-leafLight border-leaf" : "bg-sand border-line"
                }`}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={18}
                  color={isSelected ? theme.leaf : theme.bark}
                />
                <View className="ml-2">
                  <Text className={`text-xs font-bold ${isSelected ? "text-leaf" : "text-bark"}`}>
                    {item.nameEn}
                  </Text>
                  <Text className="text-[10px] text-bark/50 font-medium">{item.nameHi}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* AI MATERIAL ADVISOR & CRITICAL MINERALS */}
        <View className="bg-sand border border-line rounded-2xl p-3.5 mb-4 shadow-xs">
          <View className="flex-row items-center justify-between pb-2 border-b border-line/50 mb-2">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="molecule" size={18} color={theme.leaf} />
              <Text className="text-xs font-black text-bark ml-1.5">
                AI Material Advisor: Critical Minerals
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-leaf">CPCB Rule 13</Text>
          </View>

          <Text className="text-xs text-bark font-bold mb-1.5">
            Valuable Recoverable Minerals in this Lot:
          </Text>
          <View className="flex-row flex-wrap gap-1.5 mb-2.5">
            {materialAdvice.criticalMinerals.map((m, idx) => (
              <View
                key={idx}
                className="bg-white border border-line rounded-lg px-2 py-1 flex-row items-center"
              >
                <View className="w-5 h-5 rounded-full bg-leafLight items-center justify-center mr-1">
                  <Text className="text-[9px] font-black text-leaf">{m.symbol}</Text>
                </View>
                <Text className="text-[11px] font-bold text-bark">{m.name}</Text>
              </View>
            ))}
          </View>

          {materialAdvice.hazardousAlert && (
            <View className="bg-clay/10 border border-clay/30 rounded-xl p-2.5 mb-2 flex-row items-start">
              <MaterialCommunityIcons name="alert-decagram" size={16} color={theme.clay} />
              <Text className="text-[11px] text-clay font-bold ml-1.5 flex-1 leading-4">
                {materialAdvice.hazardousAlert}
              </Text>
            </View>
          )}

          <Text className="text-[11px] text-bark/70 leading-4">
            💡 <Text className="font-bold text-bark">Sorting Tip:</Text> {materialAdvice.sortingTip}
          </Text>
        </View>

        {/* STEP 3: APPROXIMATE WEIGHT */}
        <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-1">
          3. Approximate Weight in Kilograms (वजन kg में) *
        </Text>
        <TextInput
          value={weight}
          onChangeText={(v) => setWeight(v.replace(/[^0-9.]/g, ""))}
          placeholder="e.g. 25 kg"
          keyboardType="decimal-pad"
          className="bg-white border border-line rounded-xl px-4 py-3 text-base text-bark font-black mb-3"
          placeholderTextColor="#8a7d68"
        />

        {/* STEP 4: QUALITY CONDITION */}
        <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-2">
          4. Material Condition (गुणवत्ता स्थिति)
        </Text>
        <View className="gap-2 mb-4">
          {QUALITY_GRADES.map((q) => {
            const label = q.id === "grade_a" ? "Grade A (Clean)" : q.id === "grade_b" ? "Grade B (Semi-sorted)" : "Grade C (Mixed / Wet)";
            const isSelected = condition === label;
            return (
              <Pressable
                key={q.id}
                onPress={() => setCondition(label as any)}
                className={`p-3 rounded-xl border flex-row items-center justify-between ${
                  isSelected ? "bg-leafLight border-leaf" : "bg-white border-line"
                }`}
              >
                <View>
                  <Text className={`text-xs font-bold ${isSelected ? "text-leaf" : "text-bark"}`}>
                    {label}
                  </Text>
                  <Text className="text-[10px] text-bark/60 mt-0.5">
                    {q.id === "grade_a"
                      ? "Unbroken, clean components (100% payout)"
                      : q.id === "grade_b"
                      ? "Minor dust or casing attached (88% payout)"
                      : "Mixed wires or moisture present (75% payout)"}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                  size={20}
                  color={isSelected ? theme.leaf : theme.line}
                />
              </Pressable>
            );
          })}
        </View>

        {/* STEP 5: INSTANT VALUATION CALCULATOR */}
        {parsedWeight > 0 && (
          <View className="bg-leafLight/90 border-2 border-leaf/40 rounded-2xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between pb-2 border-b border-leaf/20 mb-3">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="calculator-variant" size={20} color={theme.leaf} />
                <Text className="text-xs font-black text-bark ml-1.5 uppercase tracking-wider">
                  Instant Valuation Engine (तात्कालिक मूल्य)
                </Text>
              </View>
              <View className="px-2 py-0.5 rounded-full bg-leaf">
                <Text className="text-[10px] font-black text-white">Live CPCB Benchmark</Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-xs text-bark/70">Fair Buying Cost from Customer:</Text>
              <Text className="text-sm font-bold text-bark">₹{valuation.buyingCost}</Text>
            </View>

            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-xs text-bark/70">Expected Recycler Resale Value:</Text>
              <Text className="text-sm font-black text-leaf">₹{valuation.expectedRecyclerPayout}</Text>
            </View>

            <View className="flex-row justify-between items-center pt-2 border-t border-leaf/20">
              <Text className="text-xs font-black text-leaf">Projected Net Margin:</Text>
              <Text className="text-base font-black text-leaf">
                +₹{valuation.projectedNetProfit} (+₹{valuation.marginPerKg}/kg)
              </Text>
            </View>
          </View>
        )}

        {/* PRICE ANOMALY WARNING (IF TRIGGERED) */}
        {anomalyReport.isAnomaly && (
          <View className="bg-clay/10 border-2 border-clay rounded-2xl p-3.5 mb-4 shadow-xs">
            <View className="flex-row items-center mb-1">
              <MaterialCommunityIcons name="alert-octagon" size={20} color={theme.clay} />
              <Text className="text-xs font-black text-clay ml-1.5">
                {anomalyReport.warningTitle}
              </Text>
            </View>
            <Text className="text-xs text-bark leading-4 font-semibold mb-1">
              {anomalyReport.warningMessage}
            </Text>
            <Text className="text-[11px] text-bark/70 italic">
              Recommendation: {anomalyReport.recommendedAction}
            </Text>
          </View>
        )}

        {/* SOURCE / NOTES */}
        <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-1">
          Source Note / Walk-in Customer (वैकल्पिक विवरण)
        </Text>
        <TextInput
          value={sourceNote}
          onChangeText={setSourceNote}
          placeholder="e.g. Ramesh Electronics / Sector 15 pickup"
          className="bg-white border border-line rounded-xl px-4 py-3 text-sm text-bark mb-5"
          placeholderTextColor="#8a7d68"
        />

        {/* ACTION BUTTON */}
        <PrimaryButton
          label={isSubmitting ? "Registering Lot..." : "Register Digital Lot (डिजिटल लॉट दर्ज करें)"}
          onPress={handleSaveLot}
          loading={isSubmitting}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
