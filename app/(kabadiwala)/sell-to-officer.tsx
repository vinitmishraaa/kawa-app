import { useCallback, useState, useEffect, useMemo } from "react";
import {
  Alert,
  Text,
  TextInput,
  View,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  Image,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { LoadingView } from "../../components/LoadingView";
import { SCRAP_PRICE_CATALOG } from "../../constants/scrapPricing";
import {
  CPCB_AUTHORIZED_RECYCLERS,
  matchRecyclersForLot,
  type MatchedRecycler,
} from "../../constants/authorizedRecyclers";
import { recordOfficerSale, QUALITY_GRADES } from "../../services/queries/transactions";
import { getCurrentCoords } from "../../services/location";
import { useAuthStore } from "../../store/authStore";
import { theme } from "../../constants/theme";
import { detectPriceAnomaly } from "../../services/ai/anomalyDetection";
import { enqueueOfflineItem } from "../../services/offlineQueue";

interface ManifestInfo {
  lotId: string;
  recyclerName: string;
  cpcbRegNumber: string;
  recyclerPhone: string;
  recyclerLocation: string;
  category: string;
  quantity: number;
  price: number;
  quality: string;
  photoUri?: string | null;
  timestamp: string;
  isOffline?: boolean;
}

export default function SellToOfficer() {
  const { t, i18n } = useTranslation();
  const profile = useAuthStore((s) => s.profile);

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedRecyclerId, setSelectedRecyclerId] = useState<string>("RECYCLER-CPCB-01");
  const [category, setCategory] = useState("ewaste_pcb");
  const [quantity, setQuantity] = useState("25");
  const [price, setPrice] = useState("");
  const [quality, setQuality] = useState("Grade A (Clean)");
  const [lotPhoto, setLotPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [manifest, setManifest] = useState<ManifestInfo | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Fetch collector coords once
  useEffect(() => {
    getCurrentCoords()
      .then((loc) => {
        if (loc) setCoords(loc);
      })
      .catch(() => {});
  }, []);

  // Ranked CPCB Recyclers based on collector location and selected lot
  const rankedRecyclers = useMemo(() => {
    return matchRecyclersForLot(coords, category, Number(quantity) || 10);
  }, [coords, category, quantity]);

  const activeRecycler = useMemo(() => {
    return rankedRecyclers.find((r) => r.id === selectedRecyclerId) ?? rankedRecyclers[0];
  }, [rankedRecyclers, selectedRecyclerId]);

  // Auto-fill suggested payout based on recycler's benchmark rate
  useEffect(() => {
    if (activeRecycler && Number(quantity) > 0) {
      const offeredRate = activeRecycler.offeredRates[category] ?? activeRecycler.offeredRates["ewaste_appliances"] ?? 50;
      setPrice(String(Math.round(offeredRate * Number(quantity))));
    }
  }, [activeRecycler, category, quantity]);

  // Price Anomaly Validation
  const anomalyReport = useMemo(() => {
    const ratePerKg = Number(quantity) > 0 ? Number(price) / Number(quantity) : 0;
    return detectPriceAnomaly(category, ratePerKg, true);
  }, [category, price, quantity]);

  // Audio speech guide
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
        "अधिकृत रिसायकलरकडे ई-कचरा सुपूर्द करा. सर्वोत्तम भाव देणाऱ्या प्रमाणित रिसायकलरची निवड करा, वजन आणि रक्कम तपासा. कन्फर्म केल्यावर तात्काळ डिजिटल ईपीआर लॉट पावती मिळेल.";
    } else if (lang.startsWith("hi")) {
      text: speechText =
        "अधिकृत रीसाइक्लर को अपना ई-कचरा दें। सबसे अधिक भाव देने वाले रजिस्टर्ड सेंटर को चुनें, वजन और तय मूल्य दर्ज करें। कन्फर्म करने पर आपको तुरंत सरकारी ईपीआर डिजिटल लॉट रसीद मिल जाएगी।";
    } else if (lang.startsWith("bn")) {
      speechText =
        "অনুমোদিত রিসাইক্লারে আপনার ই-বর্জ্য হস্তান্তর করুন। সর্বোচ্চ দর প্রদানকারী সংস্থাকে নির্বাচন করে ডিজিটাল ইপিআর লট চালান সংগ্রহ করুন।";
    } else {
      speechText =
        "Hand over collected e-waste directly to CPCB/SPCB authorized recyclers. Compare ranked facilities, verify offered rates, and generate a legally traceable digital EPR manifest.";
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

  async function handleTakePhoto() {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission Required", "Camera permission is needed to take a handover photo.");
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

  async function submit() {
    if (!profile || !selectedRecyclerId || !category || Number(quantity) <= 0 || Number(price) <= 0) {
      Alert.alert("Required Fields", "Please specify recycler, scrap category, weight, and agreed payout.");
      return;
    }

    setLoading(true);
    const generatedLotId = `LOT-EW-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    const notes = `[CPCB-EPR-LOT: ${generatedLotId}] Recycler: ${activeRecycler.facilityName} (${activeRecycler.cpcbRegNumber}). Rule 13(1) E-Waste Rules 2022 compliant. Chain-of-custody locked.`;

    try {
      // Attempt remote Supabase insertion
      await recordOfficerSale({
        kabadiwalaId: profile.id,
        officerId: selectedRecyclerId,
        category,
        quantity: Number(quantity),
        price: Number(price),
        quality,
        notes,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      setManifest({
        lotId: generatedLotId,
        recyclerName: activeRecycler.facilityName,
        cpcbRegNumber: activeRecycler.cpcbRegNumber,
        recyclerPhone: activeRecycler.contactPhone,
        recyclerLocation: activeRecycler.facilityLocation,
        category,
        quantity: Number(quantity),
        price: Number(price),
        quality,
        photoUri: lotPhoto,
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        isOffline: false,
      });
    } catch (netErr) {
      // Offline fallback: Queue in AsyncStorage
      await enqueueOfflineItem("recycler_handover", {
        kabadiwalaId: profile.id,
        officerId: selectedRecyclerId,
        category,
        quantity: Number(quantity),
        price: Number(price),
        quality,
        notes: `${notes} [SAVED OFFLINE]`,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      setManifest({
        lotId: generatedLotId,
        recyclerName: activeRecycler.facilityName,
        cpcbRegNumber: activeRecycler.cpcbRegNumber,
        recyclerPhone: activeRecycler.contactPhone,
        recyclerLocation: activeRecycler.facilityLocation,
        category,
        quantity: Number(quantity),
        price: Number(price),
        quality,
        photoUri: lotPhoto,
        timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        isOffline: true,
      });
    } finally {
      setLoading(false);
    }
  }

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
              Recycler Handover
            </Text>
            <Text className="text-xs text-bark/60">
              E-Waste Rules 2022 • CPCB Authorized Stream
            </Text>
          </View>
        </View>

        {/* Audio Guide */}
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
            CPCB & SPCB Registered E-Waste Depots
          </Text>
        </View>
        <Text className="text-xs text-bark/80 leading-5">
          Delivering lots directly to certified recyclers guarantees certified digital weights, zero backyard burning hazards, and legal EPR transfer receipts with premium payouts.
        </Text>
      </View>

      {/* RECYCLER SELECTION (RANKED BY HIGHEST PAYOUT + DISTANCE) */}
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-bold text-bark">
          1. Select Authorized Recycler (रीसाइक्लर चुनें)
        </Text>
        <Text className="text-[11px] font-bold text-leaf">Sorted by Best Payout</Text>
      </View>

      <FlatList
        horizontal
        data={rankedRecyclers}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        renderItem={({ item }) => {
          const isSelected = selectedRecyclerId === item.id;
          return (
            <Pressable
              onPress={() => setSelectedRecyclerId(item.id)}
              className={`mr-3 rounded-2xl border p-3.5 min-w-[220px] max-w-[260px] ${
                isSelected ? "bg-leaf border-leaf" : "bg-sand border-line"
              }`}
            >
              <View className="flex-row items-center justify-between mb-1.5">
                <View className="px-2 py-0.5 rounded-full bg-black/10">
                  <Text
                    className={`text-[9px] font-bold ${
                      isSelected ? "text-white" : "text-bark/70"
                    }`}
                  >
                    {item.cpcbRegNumber}
                  </Text>
                </View>
                {item.isBestMatch && (
                  <View className="px-2 py-0.5 rounded-full bg-clay">
                    <Text className="text-[9px] font-black text-white uppercase">#1 Best Payout</Text>
                  </View>
                )}
              </View>

              <Text
                className={`${isSelected ? "text-white" : "text-bark"} font-extrabold text-sm`}
                numberOfLines={1}
              >
                {item.facilityName}
              </Text>
              <Text
                className={`${isSelected ? "text-white/80" : "text-bark/60"} text-[11px] mt-0.5`}
                numberOfLines={1}
              >
                📍 {item.district}, {item.state} ({item.distanceKm} km away)
              </Text>

              <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-black/10">
                <Text className={`${isSelected ? "text-white" : "text-leaf"} font-black text-xs`}>
                  Rate: ₹{item.offeredRateForCategory}/kg
                </Text>
                <Text className={`${isSelected ? "text-white/80" : "text-bark/60"} text-[10px]`}>
                  ★ {item.rating}
                </Text>
              </View>
              <Text
                className={`${isSelected ? "text-white/90" : "text-bark/60"} text-[10px] mt-1 italic`}
                numberOfLines={1}
              >
                🚚 {item.pickupAvailability}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* MATERIAL SELECTION */}
      <Text className="text-sm font-bold text-bark mb-2">
        2. Select Scrap Material Category (कबाड़ की श्रेणी)
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
        {SCRAP_PRICE_CATALOG.map((item) => {
          const isSelected = category === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setCategory(item.key)}
              className={`rounded-xl px-3 py-2 mr-2 border flex-row items-center ${
                isSelected ? "bg-leafLight border-leaf" : "bg-sand border-line"
              }`}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={16}
                color={isSelected ? theme.leaf : theme.bark}
              />
              <Text className={`text-xs font-bold ml-1.5 ${isSelected ? "text-leaf" : "text-bark"}`}>
                {item.nameEn}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* LOT PHOTO ATTACHMENT */}
      <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-2">
        3. Attach Lot Photo (लॉट की फोटो)
      </Text>
      {lotPhoto ? (
        <View className="relative w-full h-36 rounded-2xl overflow-hidden border border-line mb-4 shadow-xs">
          <Image source={{ uri: lotPhoto }} className="w-full h-full" resizeMode="cover" />
          <Pressable
            onPress={() => setLotPhoto(null)}
            className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"
          >
            <MaterialCommunityIcons name="close" size={16} color="#FFF" />
          </Pressable>
          <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded">
            <Text className="text-white text-[10px] font-semibold">✓ Photo Attached</Text>
          </View>
        </View>
      ) : (
        <View className="flex-row gap-2.5 mb-4">
          <Pressable
            onPress={handleTakePhoto}
            className="flex-1 bg-leaf/10 border border-dashed border-leaf/40 rounded-xl p-3 flex-row items-center justify-center"
          >
            <MaterialCommunityIcons name="camera" size={18} color={theme.leaf} />
            <Text className="font-bold text-xs text-leaf ml-1.5">Camera Photo</Text>
          </Pressable>
          <Pressable
            onPress={handlePickPhoto}
            className="flex-1 bg-sand border border-dashed border-line rounded-xl p-3 flex-row items-center justify-center"
          >
            <MaterialCommunityIcons name="image-outline" size={18} color={theme.bark} />
            <Text className="font-bold text-xs text-bark ml-1.5">From Gallery</Text>
          </Pressable>
        </View>
      )}

      {/* QUALITY GRADE */}
      <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-2">
        4. Material Quality & Sorting Grade
      </Text>
      <View className="flex-row flex-wrap mb-4 gap-2">
        {QUALITY_GRADES.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => setQuality(g.id === "grade_a" ? "Grade A (Clean)" : g.id === "grade_b" ? "Grade B (Semi-sorted)" : "Grade C (Mixed)")}
            className={`px-3.5 py-2 rounded-xl border ${
              quality.startsWith(g.id === "grade_a" ? "Grade A" : g.id === "grade_b" ? "Grade B" : "Grade C")
                ? "bg-leafLight border-leaf"
                : "bg-sand border-line"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                quality.startsWith(g.id === "grade_a" ? "Grade A" : g.id === "grade_b" ? "Grade B" : "Grade C")
                  ? "text-leaf"
                  : "text-bark"
              }`}
            >
              {t(g.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* WEIGHT INPUT */}
      <Text className="text-xs font-bold text-bark/70 mb-1">5. Batch Weight (in Kilograms): *</Text>
      <TextInput
        value={quantity}
        onChangeText={(v) => setQuantity(v.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        placeholder="Enter weight in kg (e.g. 25.5)"
        placeholderTextColor="#8a7d68"
        className="bg-white border border-line rounded-xl px-4 py-3 mb-3 text-base text-bark font-bold"
      />

      {/* PRICE INPUT */}
      <Text className="text-xs font-bold text-bark/70 mb-1">
        6. Agreed Handover Payout (₹): *
      </Text>
      <TextInput
        value={price}
        onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
        keyboardType="decimal-pad"
        placeholder="Total amount payable to you (₹)"
        placeholderTextColor="#8a7d68"
        className="bg-white border border-line rounded-xl px-4 py-3 mb-3 text-base text-bark font-bold"
      />

      {/* ANOMALY ALERT */}
      {anomalyReport.isAnomaly && (
        <View className="bg-clay/10 border-2 border-clay rounded-2xl p-3 mb-4 shadow-xs">
          <View className="flex-row items-center mb-1">
            <MaterialCommunityIcons name="alert-octagon" size={18} color={theme.clay} />
            <Text className="text-xs font-black text-clay ml-1.5">
              {anomalyReport.warningTitle}
            </Text>
          </View>
          <Text className="text-xs text-bark font-medium leading-4 mb-1">
            {anomalyReport.warningMessage}
          </Text>
          <Text className="text-[10px] text-bark/70 italic">
            Recommendation: {anomalyReport.recommendedAction}
          </Text>
        </View>
      )}

      <PrimaryButton
        label={loading ? "Generating Manifest..." : "Generate CPCB Lot & Confirm Handover"}
        onPress={submit}
        loading={loading}
      />

      {/* Verifiable EPR Handover Certificate Modal */}
      <Modal visible={manifest !== null} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-center items-center p-4">
          <View className="bg-sand w-full max-w-md rounded-3xl p-5 border-2 border-leaf shadow-2xl">
            {/* Header Badge */}
            <View className="items-center mb-3">
              <View className="w-14 h-14 rounded-full bg-leaf/20 items-center justify-center border-2 border-leaf mb-1.5">
                <MaterialCommunityIcons name="check-decagram" size={32} color={theme.leaf} />
              </View>
              <Text className="text-base font-black text-bark text-center">
                EPR HANDOVER MANIFEST
              </Text>
              <Text className="text-[10px] font-bold text-leaf text-center uppercase tracking-wider">
                E-Waste (Management) Rules, 2022 Compliant
              </Text>
            </View>

            {/* Offline Status Badge if queued */}
            {manifest?.isOffline && (
              <View className="bg-clay/20 border border-clay rounded-xl p-2 mb-3 items-center">
                <Text className="text-clay text-xs font-bold">
                  📶 Stored Offline — Will Sync When Online
                </Text>
              </View>
            )}

            {/* Manifest Details */}
            <View className="bg-white rounded-2xl p-3.5 border border-line mb-3">
              <View className="flex-row justify-between items-center pb-2 border-b border-line/60">
                <Text className="text-xs text-bark/60 font-medium">Digital Lot ID:</Text>
                <Text className="text-xs font-black text-clay font-mono">{manifest?.lotId}</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-bark/60 font-medium">Authorized Recycler:</Text>
                <Text className="text-xs font-bold text-bark">{manifest?.recyclerName}</Text>
              </View>

              <View className="flex-row justify-between items-center py-1">
                <Text className="text-xs text-bark/60 font-medium">CPCB Reg Number:</Text>
                <Text className="text-xs font-bold text-leaf font-mono">{manifest?.cpcbRegNumber}</Text>
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
                <Text className="text-xs text-bark/60 font-medium">Agreed Cash Payout:</Text>
                <Text className="text-base font-black text-leaf">₹{manifest?.price}</Text>
              </View>

              <View className="flex-row justify-between items-center pt-1">
                <Text className="text-[10px] text-bark/50">Recorded Timestamp:</Text>
                <Text className="text-[10px] text-bark/70">{manifest?.timestamp}</Text>
              </View>
            </View>

            {/* Environmental Safety Endorsement */}
            <View className="bg-sand rounded-xl p-2 border border-line mb-3.5 flex-row items-center">
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={theme.leaf} />
              <Text className="text-[10px] text-bark/80 ml-2 flex-1">
                Formally registered in CPCB secondary smelting chain. Backyard cable burning & acid washing prohibited.
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
