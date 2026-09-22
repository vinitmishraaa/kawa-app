import { useCallback, useState, useEffect } from "react";
import { Alert, Text, TextInput, View, FlatList, Pressable, Modal, ScrollView } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { LoadingView } from "../../components/LoadingView";
import { SCRAP_CATEGORIES } from "../../constants/scrapCategories";
import { getProfileById, getVerifiedOfficers } from "../../services/queries/profiles";
import { recordOfficerSale, QUALITY_GRADES } from "../../services/queries/transactions";
import { getCurrentCoords } from "../../services/location";
import { useAuthStore } from "../../store/authStore";
import { theme } from "../../constants/theme";

interface ManifestInfo {
  lotId: string;
  officerName: string;
  officerPhone: string;
  officerDept: string;
  category: string;
  quantity: number;
  price: number;
  quality: string;
  timestamp: string;
}

export default function SellToOfficer() {
  const { t, i18n } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const [officers, setOfficers] = useState<any[] | null>(null);
  const [officerId, setOfficerId] = useState("");
  const [category, setCategory] = useState("pcb_circuit_boards");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [quality, setQuality] = useState("grade_a");
  const [loading, setLoading] = useState(false);
  const [manifest, setManifest] = useState<ManifestInfo | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    let speechText = "";

    if (lang.startsWith("mr")) {
      speechText =
        "अधिकृत रिसायकलरकडे ई-कचरा सुपूर्द करा. प्रथम रिसायकलर आणि भंगार प्रकार निवडा, वजन आणि ठरलेला भाव टाका. कन्फर्म केल्यावर तुम्हाला तात्काळ डिजिटल लॉट पावती आणि अधिकृत ईपीआर प्रमाणपत्र मिळेल.";
    } else if (lang.startsWith("hi")) {
      speechText =
        "अधिकृत रीसाइक्लर को अपना ई-कचरा दें। पहले रीसाइक्लर और कबाड़ का प्रकार चुनें, फिर वजन और तय किया गया भाव दर्ज करें। कन्फर्म करने पर आपको तुरंत डिजिटल लॉट रसीद और सरकारी ईपीआर सर्टिफिकेट मिल जाएगा।";
    } else if (lang.startsWith("bn")) {
      speechText =
        "অনুমোদিত রিসাইক্লারে আপনার ই-বর্জ্য হস্তান্তর করুন। প্রথমে রিসাইক্লার ও ভাঙারির প্রকার বাছুন, তারপর ওজন এবং নির্ধারিত মূল্য লিখুন। নিশ্চিত করলে অবিলম্বে ডিজিটাল লট রসিদ এবং সরকারি ইপিআর সার্টিফিকেট পাবেন।";
    } else {
      speechText =
        "Hand over collected e-waste directly to authorized recyclers. Select the registered facility and scrap category, enter weight and agreed payout, and confirm to generate a verified digital EPR lot manifest.";
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

  const load = useCallback(async () => {
    setOfficers(await getVerifiedOfficers());
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function submit() {
    if (!profile || !officerId || !category || Number(quantity) <= 0 || Number(price) <= 0) {
      Alert.alert(t("sellOfficer.required"));
      return;
    }

    setLoading(true);
    try {
      const coords = await getCurrentCoords().catch(() => null);
      const generatedLotId = `LOT-EW-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase()}`;

      const notes = `[CPCB-EPR-LOT: ${generatedLotId}] Handover to CPCB/SPCB authorized recycler. Rule 13(1) E-Waste (Management) Rules 2022 compliant. Chain-of-custody recorded.`;

      await recordOfficerSale({
        kabadiwalaId: profile.id,
        officerId,
        category,
        quantity: Number(quantity),
        price: Number(price),
        quality,
        notes,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      const officer = await getProfileById(officerId);

      setManifest({
        lotId: generatedLotId,
        officerName: officer?.name ?? "Authorized Recycler",
        officerPhone: officer?.phone ?? "N/A",
        officerDept: officer?.department ?? "CPCB / SPCB Authorized Unit",
        category,
        quantity: Number(quantity),
        price: Number(price),
        quality,
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      });
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setLoading(false);
    }
  }

  if (officers === null) return <LoadingView />;

  return (
    <ScreenContainer scroll>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-4 mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <Pressable
            onPress={() => {
              Speech.stop();
              router.back();
            }}
            className="mr-3"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.bark} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-black text-bark">
              {t("sellOfficer.title", { defaultValue: "Recycler Handover" })}
            </Text>
            <Text className="text-xs text-bark/60">
              E-Waste Rules 2022 • Chain of Custody
            </Text>
          </View>
        </View>

        {/* Audio Listen Guide Button */}
        <Pressable
          onPress={toggleSpeech}
          className={`flex-row items-center px-3 py-1.5 rounded-xl border ${
            isSpeaking ? "bg-clay border-clay" : "bg-leafLight border-leaf/40"
          }`}
        >
          <MaterialCommunityIcons
            name={isSpeaking ? "volume-off" : "volume-high"}
            size={18}
            color={isSpeaking ? "#FFFFFF" : theme.leaf}
          />
          <Text
            className={`text-xs font-bold ml-1 ${
              isSpeaking ? "text-white" : "text-leaf"
            }`}
          >
            {isSpeaking ? "Stop" : "Listen"}
          </Text>
        </Pressable>
      </View>

      {/* Compliance Information Card */}
      <View className="bg-leaf/10 border border-leaf/30 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center mb-1.5">
          <MaterialCommunityIcons name="certificate-outline" size={20} color={theme.leaf} />
          <Text className="font-black text-leaf text-xs ml-1.5 uppercase">
            Authorized CPCB/SPCB Recycling Depot
          </Text>
        </View>
        <Text className="text-xs text-bark/80 leading-5">
          Handing over e-waste and scrap to authorized recyclers prevents hazardous backyard burning
          and acid leaching, while securing verifiable EPR lot documentation and premium payouts.
        </Text>
      </View>

      {/* Recycler Selection */}
      <Text className="text-sm font-bold text-bark mb-2">
        {t("sellOfficer.chooseOfficer", { defaultValue: "Select Authorized Recycler / Officer" })}
      </Text>
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
            <Pressable
              onPress={() => setOfficerId(item.id)}
              className={`mr-3 rounded-2xl border px-4 py-3.5 min-w-[170px] ${
                officerId === item.id ? "bg-leaf border-leaf" : "bg-sand border-line"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <MaterialCommunityIcons
                  name="shield-check"
                  size={24}
                  color={officerId === item.id ? "#fff" : theme.leaf}
                />
                <View className="px-1.5 py-0.5 rounded bg-black/10">
                  <Text
                    className={`text-[9px] font-bold ${
                      officerId === item.id ? "text-white" : "text-bark/60"
                    }`}
                  >
                    VERIFIED
                  </Text>
                </View>
              </View>
              <Text
                className={`${officerId === item.id ? "text-white" : "text-bark"} font-bold text-sm mt-2`}
                numberOfLines={1}
              >
                {item.name ?? t("sellOfficer.officer")}
              </Text>
              <Text
                className={`${officerId === item.id ? "text-white/80" : "text-bark/60"} text-[11px] mt-0.5`}
                numberOfLines={1}
              >
                {item.department || "Authorized Recycler"}
              </Text>
              <Text
                className={`${officerId === item.id ? "text-white/90" : "text-leaf"} text-xs font-bold mt-1`}
              >
                ★ {Number(item.rating ?? 5.0).toFixed(1)} EPR Rated
              </Text>
            </Pressable>
          )}
        />
      )}

      {/* Material Selection */}
      <Text className="text-sm font-bold text-bark mb-2">
        {t("sellOfficer.material", { defaultValue: "Select Material / Scrap Category" })}
      </Text>
      <View className="flex-row flex-wrap mb-3">
        {SCRAP_CATEGORIES.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setCategory(item.id)}
            className={`rounded-full px-3.5 py-2 mr-2 mb-2 border ${
              category === item.id ? "bg-leaf border-leaf" : "bg-sand border-line"
            }`}
          >
            <Text
              className={`text-xs font-bold ${category === item.id ? "text-white" : "text-bark"}`}
            >
              {t(item.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Quality Grade */}
      <Text className="text-sm font-bold text-bark mb-2">Material Quality & Sorting Grade</Text>
      <View className="flex-row flex-wrap mb-4 gap-2">
        {QUALITY_GRADES.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => setQuality(g.id)}
            className={`px-3.5 py-2 rounded-xl border ${
              quality === g.id ? "bg-leaf border-leaf" : "bg-sand border-line"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${quality === g.id ? "text-white" : "text-bark"}`}
            >
              {t(g.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Weight Input */}
      <Text className="text-xs font-bold text-bark/70 mb-1">Batch Weight (in Kilograms):</Text>
      <TextInput
        value={quantity}
        onChangeText={(v) => setQuantity(v.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        placeholder="Enter weight in kg (e.g. 25.5)"
        placeholderTextColor="#8a7d68"
        className="bg-sand border border-line rounded-xl px-4 py-3 mb-3 text-base text-bark"
      />

      {/* Price Input */}
      <Text className="text-xs font-bold text-bark/70 mb-1">Total Agreed Handover Price (₹):</Text>
      <TextInput
        value={price}
        onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        placeholder="Total amount payable to you (₹)"
        placeholderTextColor="#8a7d68"
        className="bg-sand border border-line rounded-xl px-4 py-3 mb-5 text-base text-bark"
      />

      <PrimaryButton
        label={t("sellOfficer.confirm", { defaultValue: "Generate EPR Lot & Handover" })}
        onPress={submit}
        loading={loading}
      />

      {/* Verifiable EPR Handover Certificate Modal */}
      <Modal visible={manifest !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-center items-center p-4">
          <View className="bg-sand w-full max-w-md rounded-3xl p-5 border-2 border-leaf shadow-2xl">
            {/* Header Badge */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-leaf/20 items-center justify-center border-2 border-leaf mb-2">
                <MaterialCommunityIcons name="check-decagram" size={38} color={theme.leaf} />
              </View>
              <Text className="text-lg font-black text-bark text-center">
                EPR HANDOVER MANIFEST
              </Text>
              <Text className="text-[11px] font-bold text-leaf text-center uppercase tracking-wider">
                E-Waste (Management) Rules, 2022 Compliant
              </Text>
            </View>

            {/* Manifest Details */}
            <View className="bg-white rounded-2xl p-4 border border-line mb-4 space-y-2">
              <View className="flex-row justify-between items-center pb-2 border-b border-line/60">
                <Text className="text-xs text-bark/60 font-medium">Digital Lot ID:</Text>
                <Text className="text-xs font-black text-clay font-mono">{manifest?.lotId}</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-bark/60 font-medium">Authorized Recycler:</Text>
                <Text className="text-xs font-bold text-bark">{manifest?.officerName}</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-bark/60 font-medium">Facility / Dept:</Text>
                <Text className="text-xs font-semibold text-bark/80">{manifest?.officerDept}</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-bark/60 font-medium">Material Stream:</Text>
                <Text className="text-xs font-black text-bark capitalize">
                  {manifest?.category.replace(/_/g, " ")}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-bark/60 font-medium">Net Weight:</Text>
                <Text className="text-xs font-black text-leaf">{manifest?.quantity} kg</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-bark/60 font-medium">Quality Grade:</Text>
                <Text className="text-xs font-semibold text-bark">{manifest?.quality}</Text>
              </View>

              <View className="flex-row justify-between items-center pt-2 border-t border-line/60">
                <Text className="text-xs text-bark/60 font-medium">Agreed Payout:</Text>
                <Text className="text-base font-black text-leaf">₹{manifest?.price}</Text>
              </View>

              <View className="flex-row justify-between items-center pt-1">
                <Text className="text-[10px] text-bark/50">Recorded Timestamp:</Text>
                <Text className="text-[10px] text-bark/70">{manifest?.timestamp}</Text>
              </View>
            </View>

            {/* Environmental Safety Endorsement */}
            <View className="bg-sand rounded-xl p-2.5 border border-line mb-4 flex-row items-center">
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={theme.leaf} />
              <Text className="text-[10px] text-bark/80 ml-2 flex-1">
                Formally logged into CPCB recycling stream. Backyard burning and acid bath
                prohibited.
              </Text>
            </View>

            <PrimaryButton
              label="Done & Return to Dashboard"
              onPress={() => {
                Speech.stop();
                setManifest(null);
                router.replace("/(kabadiwala)/dashboard");
              }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
