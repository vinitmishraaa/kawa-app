import { useState, useEffect, useCallback } from "react";
import { Text, View, ScrollView, Pressable, Platform } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { ScreenContainer } from "../../components/ScreenContainer";
import { theme } from "../../constants/theme";

export default function SafetyGuidance() {
  const { t, i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const DANGER_RULES = [
    {
      icon: "fire-alert",
      title: t("safety.noBurnCableTitle", "Never Burn Wires in Open Air"),
      desc: t(
        "safety.noBurnCableDesc",
        "Burning cables releases carcinogenic dioxins, destroys copper purity, and lowers your sale price."
      ),
      hazard: "Carcinogenic Dioxins / Air Poisoning",
    },
    {
      icon: "bottle-tonic-skull",
      title: t("safety.noAcidTitle", "No Backyard Acid Leaching"),
      desc: t(
        "safety.noAcidDesc",
        "Using nitric/cyanide acids causes lethal respiratory damage and severe groundwater contamination."
      ),
      hazard: "Severe Acid / Cyanide Vapor Burns",
    },
    {
      icon: "television-stop",
      title: t("safety.noBreakCrtTitle", "Do Not Break CRT Glass"),
      desc: t(
        "safety.noBreakCrtDesc",
        "Vacuum implosion scatters toxic phosphor dust and heavy lead particles."
      ),
      hazard: "Lead Poisoning & Implosion Hazard",
    },
    {
      icon: "battery-alert",
      title: t("safety.noPunctureBatteryTitle", "Do Not Puncture Lithium Batteries"),
      desc: t(
        "safety.noPunctureBatteryDesc",
        "Damaged or shorted lithium-ion cells cause instant thermal runaway fires and explosions."
      ),
      hazard: "Thermal Runaway Fire & Explosion",
    },
  ];

  const SAFE_RULES = [
    {
      icon: "shield-check",
      title: t("safety.safeHandoverTitle", "Direct Handover to CPCB Recycler"),
      desc: t(
        "safety.safeHandoverDesc",
        "Deliver intact items to authorized recyclers for certified weights, highest prices, and EPR receipts."
      ),
      benefit: "Highest Cash Payout & Zero Health Risk",
    },
    {
      icon: "hand-water",
      title: t("safety.safeHandlingTitle", "Use Protective Gloves & Sacks"),
      desc: t(
        "safety.safeHandlingDesc",
        "Store lithium batteries separately from heavy iron. Keep circuit boards dry."
      ),
      benefit: "Preserves Precious Metals (Gold, Gallium)",
    },
  ];

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
        "ई-कचरा सुरक्षा नियम. पहिली गोष्ट: केबल्स आणि वायर्स उघड्यावर अजिबात जाळू नका. दुसरी गोष्ट: सर्किट बोर्डवर घरी ॲसिड वापरू नका. तिसरी गोष्ट: सीआरटी टीव्ही काच फोडू नका. चौथी गोष्ट: लिथियम बॅटऱ्या पंचर करू नका. सर्व साहित्य सुरक्षित ठेवून अधिकृत रिसायकलरला द्या, ज्यामुळे तुम्हाला पूर्ण वजन आणि जास्तीत जास्त थेट भाव मिळेल.";
    } else if (lang.startsWith("hi")) {
      speechText =
        "ई-वेस्ट सुरक्षा नियम. पहली बात: तारों और केबलों को खुले में कभी न जलाएं। दूसरी बात: सर्किट बोर्ड से तेजाब या एसिड द्वारा धातु न निकालें। तीसरी बात: सीआरटी स्क्रीन को न तोड़ें। चौथी बात: लिथियम बैटरी को पंचर न करें। सारा माल बिना तोड़े सीधे अधिकृत रिसायकलर को दें, जिससे आपको पूरा वजन और सबसे ज्यादा नकद भाव मिलेगा।";
    } else if (lang.startsWith("bn")) {
      speechText =
        "ই-বর্জ্য নিরাপত্তা নির্দেশিকা। এক নম্বর: খোলা জায়গায় তার বা কেবল কখনোই পোড়াবেন না। দুই নম্বর: সার্কিট বোর্ডে ঘরে তৈরি অ্যাসিড ব্যবহার করবেন না। তিন নম্বর: পুরানো সিআরটি টিভির কাচ ভাঙবেন না। চার নম্বর: লিথিয়াম ব্যাটারি কখনোই ফুটো করবেন না। সমস্ত ই-বর্জ্য অক্ষত অবস্থায় সরাসরি অনুমোদিত রিসাইক্লারকে দিন, যার ফলে আপনি সঠিক ওজন এবং সর্বোচ্চ নগদ মূল্য পাবেন।";
    } else {
      speechText =
        "E-Waste Safety Guidelines under E-Waste Rules 2022. Number one: Never burn insulated cables in the open. Number two: Avoid backyard acid leaching on PCBs. Number three: Do not break CRT glass monitors. Number four: Never puncture lithium-ion batteries. Handover intact e-waste directly to authorized recyclers for maximum fair price and safety.";
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
    <ScreenContainer scroll>
      {/* Top Bar */}
      <View className="flex-row items-center justify-between mt-3 mb-3">
        <Pressable
          onPress={() => {
            Speech.stop();
            router.back();
          }}
          className="w-10 h-10 rounded-full bg-sand border border-line items-center justify-center"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.bark} />
        </Pressable>

        <Pressable
          onPress={toggleSpeech}
          className={`flex-row items-center px-3.5 py-2 rounded-xl border ${
            isSpeaking ? "bg-clay border-clay" : "bg-sand border-line"
          }`}
        >
          <MaterialCommunityIcons
            name={isSpeaking ? "volume-off" : "volume-high"}
            size={18}
            color={isSpeaking ? "#FFFFFF" : theme.leaf}
          />
          <Text
            className={`text-xs font-bold ml-1.5 ${
              isSpeaking ? "text-white" : "text-bark"
            }`}
          >
            {isSpeaking ? "Stop Voice" : t("safety.listenAudio", "🔊 Listen Rules")}
          </Text>
        </Pressable>
      </View>

      {/* Header Banner */}
      <View className="bg-bark rounded-card p-4 mb-4">
        <View className="flex-row items-center mb-1">
          <MaterialCommunityIcons name="shield-alert-outline" size={22} color="#FBBF24" />
          <Text className="text-white font-extrabold text-lg ml-2">
            {t("safety.title", "E-Waste Safety Hub")}
          </Text>
        </View>
        <Text className="text-white/80 text-xs leading-4">
          {t(
            "safety.subtitle",
            "Safe handling guidance under E-Waste Rules 2022. Protect health & maximize recycler payouts."
          )}
        </Text>
      </View>

      {/* DANGER SECTION */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <View className="w-6 h-6 rounded-full bg-clay/20 items-center justify-center mr-2">
            <MaterialCommunityIcons name="close-circle" size={16} color={theme.clay} />
          </View>
          <Text className="text-sm font-extrabold text-clay uppercase tracking-wider">
            {t("safety.dangerTitle", "Strictly Prohibited (Hazardous Practices)")}
          </Text>
        </View>

        {DANGER_RULES.map((rule, idx) => (
          <View
            key={idx}
            className="bg-white border-2 border-clay/30 rounded-2xl p-3.5 mb-2.5 shadow-sm"
          >
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-xl bg-clay/10 items-center justify-center mr-3">
                <MaterialCommunityIcons name={rule.icon as any} size={22} color={theme.clay} />
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-bark text-sm">{rule.title}</Text>
                <Text className="text-bark/70 text-xs mt-1 leading-4">{rule.desc}</Text>
                <View className="bg-clay/10 self-start px-2 py-0.5 rounded mt-2">
                  <Text className="text-[10px] font-bold text-clay">⚠️ {rule.hazard}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* SAFE PRACTICES SECTION */}
      <View className="mb-5">
        <View className="flex-row items-center mb-2">
          <View className="w-6 h-6 rounded-full bg-leafLight items-center justify-center mr-2">
            <MaterialCommunityIcons name="check-circle" size={16} color={theme.leaf} />
          </View>
          <Text className="text-sm font-extrabold text-leaf uppercase tracking-wider">
            {t("safety.safeTitle", "Approved Standard Handling (Best Practice)")}
          </Text>
        </View>

        {SAFE_RULES.map((rule, idx) => (
          <View
            key={idx}
            className="bg-white border-2 border-leaf/30 rounded-2xl p-3.5 mb-2.5 shadow-sm"
          >
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-xl bg-leafLight items-center justify-center mr-3">
                <MaterialCommunityIcons name={rule.icon as any} size={22} color={theme.leaf} />
              </View>
              <View className="flex-1">
                <Text className="font-extrabold text-bark text-sm">{rule.title}</Text>
                <Text className="text-bark/70 text-xs mt-1 leading-4">{rule.desc}</Text>
                <View className="bg-leafLight self-start px-2 py-0.5 rounded mt-2">
                  <Text className="text-[10px] font-bold text-leaf">✓ {rule.benefit}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Direct Action Link */}
      <Pressable
        onPress={() => {
          Speech.stop();
          router.push("/(kabadiwala)/sell-to-officer");
        }}
        className="bg-leaf rounded-2xl py-3.5 px-4 flex-row items-center justify-center mb-8 shadow-sm"
      >
        <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" />
        <Text className="text-white font-extrabold text-sm ml-2">
          {t("sellOfficer.title", "Handover to Authorized Recycler ➔")}
        </Text>
      </Pressable>
    </ScreenContainer>
  );
}
