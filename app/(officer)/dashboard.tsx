import { useCallback, useState, useEffect, useRef } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  Linking,
  Platform,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { AppSettingsModal } from "../../components/AppSettingsModal";
import { useAuthStore } from "../../store/authStore";
import { getOfficerSummary } from "../../services/queries/officer";
import {
  getMonitoredKabadiwalas,
  sendMunicipalNotice,
  type MonitoredKabadiwala,
} from "../../services/queries/notices";
import { SCRAP_PRICE_CATALOG } from "../../constants/scrapPricing";
import { signOut } from "../../services/auth";
import { supabase } from "../../services/supabase";
import { theme } from "../../constants/theme";

const DEFAULT_SUMMARY = {
  allRows: [],
  inflowRows: [],
  outflowRows: [],
  myHandovers: [],
  totalInflowKg: 0,
  totalInflowValue: 0,
  totalOutflowKg: 0,
  totalOutflowValue: 0,
  activeStockInCirculation: 0,
  qualityCounts: { "Grade A": 0, "Grade B": 0, "Grade C": 0 },
  totalTransactions: 0,
  materialTypesCount: 0,
};

export default function OfficerDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);

  const [activeTab, setActiveTab] = useState<"overview" | "margins" | "kabadiwalas">("overview");
  const [summary, setSummary] = useState<any>(DEFAULT_SUMMARY);
  const [kabadiwalas, setKabadiwalas] = useState<MonitoredKabadiwala[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Notice Dispatch Modal State
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [selectedKabadiwala, setSelectedKabadiwala] = useState<MonitoredKabadiwala | null>(null);
  const [noticeType, setNoticeType] = useState<"warning" | "legal_notice" | "final_order">("legal_notice");
  const [noticeSubject, setNoticeSubject] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [sendingNotice, setSendingNotice] = useState(false);

  const loadRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [sumRes, kabadiRes] = await Promise.all([
        getOfficerSummary(profile.id).catch(() => DEFAULT_SUMMARY),
        getMonitoredKabadiwalas().catch(() => []),
      ]);
      setSummary(sumRes ?? DEFAULT_SUMMARY);
      setKabadiwalas(kabadiRes ?? []);
    } catch {
      setSummary(DEFAULT_SUMMARY);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      loadRef.current();
    }, [])
  );

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`officer_${profile.id}_realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          loadRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  async function refresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function logout() {
    const doLogout = async () => {
      await signOut().catch(() => {});
      reset();
      router.replace("/(auth)/role-select");
    };

    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm("Are you sure you want to log out of the Officer Portal?")) {
        await doLogout();
      }
      return;
    }

    Alert.alert("Confirm Logout", "Are you sure you want to log out of the Officer Portal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: doLogout,
      },
    ]);
  }

  function openNoticeModal(kabadi: MonitoredKabadiwala) {
    setSelectedKabadiwala(kabadi);
    setNoticeType(kabadi.days_overdue > 10 ? "legal_notice" : "warning");
    setNoticeSubject(`MUNICIPAL SWM NOTICE: Overdue Scrap Handover (${kabadi.stock_held_kg} kg)`);
    setNoticeMessage(
      `Under Section 12 of the Municipal Solid Waste Management (SWM) By-laws, your registered collection centre "${kabadi.shop_name || kabadi.name}" is holding ${kabadi.stock_held_kg} kg of scrap stock overdue by ${kabadi.days_overdue} days.\n\nYou are instructed to immediately initiate resale handover of this accumulated stock to the Municipal Corporation or authorised recycling depot within 48 hours to avoid license suspension or fines.`
    );
    setNoticeModalOpen(true);
  }

  async function handleSendNotice() {
    if (!selectedKabadiwala || !profile) return;
    if (!noticeSubject.trim() || !noticeMessage.trim()) {
      Alert.alert("Required Fields", "Please enter both a notice subject and notice message.");
      return;
    }

    setSendingNotice(true);
    try {
      await sendMunicipalNotice({
        officer_id: profile.id,
        officer_name: profile.name || "Municipal Officer",
        officer_department: profile.department || "Solid Waste Management",
        kabadiwala_id: selectedKabadiwala.id,
        kabadiwala_name: selectedKabadiwala.name,
        kabadiwala_phone: selectedKabadiwala.phone,
        stock_held_kg: selectedKabadiwala.stock_held_kg,
        days_overdue: selectedKabadiwala.days_overdue,
        notice_type: noticeType,
        subject: noticeSubject.trim(),
        message: noticeMessage.trim(),
      });

      Alert.alert(
        "Notice Dispatched! 📜🚨",
        `Official notice has been sent to ${selectedKabadiwala.name} and a high-priority push alert was triggered.`
      );
      setNoticeModalOpen(false);
      load();
    } catch (err: any) {
      Alert.alert("Notice Dispatch Failed", err?.message ?? "Could not send notice.");
    } finally {
      setSendingNotice(false);
    }
  }

  function handleCall(phone: string) {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Call Unavailable", `Phone dialer could not be opened for ${phone}`);
    });
  }

  function handleWhatsApp(phone: string, name: string) {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
      `Namaste ${name}, this is regarding your registered scrap collection centre and municipal waste compliance.`
    )}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp Unavailable", "Could not launch WhatsApp.");
    });
  }

  const totalQuality =
    (summary.qualityCounts["Grade A"] || 0) +
    (summary.qualityCounts["Grade B"] || 0) +
    (summary.qualityCounts["Grade C"] || 0) || 1;

  const pctA = Math.round(((summary.qualityCounts["Grade A"] || 0) / totalQuality) * 100);
  const pctB = Math.round(((summary.qualityCounts["Grade B"] || 0) / totalQuality) * 100);
  const pctC = Math.round(((summary.qualityCounts["Grade C"] || 0) / totalQuality) * 100);

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-3 mb-3">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center flex-wrap">
            <Text className="text-2xl font-black text-bark">Authorized Recycler Hub</Text>
            <View className="ml-2 px-2.5 py-0.5 bg-leafLight rounded-full border border-leaf/40">
              <Text className="text-[10px] font-bold text-leaf uppercase">CPCB / SPCB Reg. Facility</Text>
            </View>
          </View>
          <Text className="text-xs text-bark/70 mt-0.5">
            {profile?.name ?? "Authorized Officer"} • {profile?.department ?? "E-Waste & SWM Enforcement"} • EPR Reg: 2022/REC-904
          </Text>
        </View>

        <View className="flex-row items-center">
          {/* Settings & Permissions */}
          <Pressable
            onPress={() => setSettingsOpen(true)}
            className="p-2 bg-sand rounded-full mr-2 border border-line"
          >
            <MaterialCommunityIcons name="cog" size={20} color={theme.bark} />
          </Pressable>

          {/* Logout */}
          <Pressable onPress={logout} className="p-2 bg-sand rounded-full border border-line">
            <MaterialCommunityIcons name="logout" size={20} color={theme.bark} />
          </Pressable>
        </View>
      </View>

      {/* Main Tabs Navigation */}
      <View className="flex-row mb-3 bg-sand rounded-xl p-1 border border-line">
        <Pressable
          onPress={() => setActiveTab("overview")}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === "overview" ? "bg-white border border-line/40 shadow-sm" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${activeTab === "overview" ? "text-bark" : "text-bark/60"}`}
          >
            Overview 📊
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("margins")}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === "margins" ? "bg-white border border-line/40 shadow-sm" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${activeTab === "margins" ? "text-leaf" : "text-bark/60"}`}
          >
            Scrap Margins 💰
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab("kabadiwalas")}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === "kabadiwalas" ? "bg-white border border-line/40 shadow-sm" : ""
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              activeTab === "kabadiwalas" ? "text-clay" : "text-bark/60"
            }`}
          >
            Collectors & Notice 📜
          </Text>
        </Pressable>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        contentContainerStyle={{ paddingBottom: 35 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <View>
            {/* Master Waste Balance Card */}
            <View className="bg-bark rounded-2xl p-5 mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white/70 text-xs uppercase font-bold tracking-wider">
                  Municipal Waste Transparency
                </Text>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-ok mr-1.5" />
                  <Text className="text-white/60 text-[10px] uppercase font-bold">Telemetry Active</Text>
                </View>
              </View>

              <View className="flex-row justify-between mb-4">
                {/* INTAKE */}
                <View className="flex-1 mr-2 bg-white/10 rounded-xl p-3">
                  <View className="flex-row items-center mb-1">
                    <MaterialCommunityIcons name="arrow-bottom-left" size={16} color="#85E0A3" />
                    <Text className="text-[#85E0A3] text-xs font-bold ml-1">Total Intake</Text>
                  </View>
                  <Text className="text-white text-xl font-black">
                    {summary.totalInflowKg.toFixed(1)} kg
                  </Text>
                  <Text className="text-white/60 text-[11px] mt-0.5">
                    Customer ➔ Kabadiwala
                  </Text>
                </View>

                {/* OUTFLOW */}
                <View className="flex-1 ml-2 bg-white/10 rounded-xl p-3">
                  <View className="flex-row items-center mb-1">
                    <MaterialCommunityIcons name="arrow-top-right" size={16} color="#FFB885" />
                    <Text className="text-[#FFB885] text-xs font-bold ml-1">Total Outflow</Text>
                  </View>
                  <Text className="text-white text-xl font-black">
                    {summary.totalOutflowKg.toFixed(1)} kg
                  </Text>
                  <Text className="text-white/60 text-[11px] mt-0.5">
                    Kabadiwala ➔ Officers
                  </Text>
                </View>
              </View>

              {/* In-Circulation Balance */}
              <View className="flex-row justify-between items-center pt-3 border-t border-white/15">
                <Text className="text-white/80 text-xs">Circulating Scrap in Network:</Text>
                <Text className="text-white font-black text-sm">
                  {summary.activeStockInCirculation.toFixed(1)} kg
                </Text>
              </View>
            </View>

            {/* Waste Quality Grading Breakdown */}
            <View className="bg-sand border border-line rounded-card p-4 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-bold text-bark">Quality & Segregation Index</Text>
                <Text className="text-xs text-leaf font-bold">{pctA}% Segregated</Text>
              </View>
              <View className="flex-row h-3 rounded-full overflow-hidden mb-3 bg-line/50">
                <View style={{ width: `${pctA}%` }} className="bg-leaf" />
                <View style={{ width: `${pctB}%` }} className="bg-warn" />
                <View style={{ width: `${pctC}%` }} className="bg-clay" />
              </View>
              <View className="flex-row justify-between">
                <View className="flex-row items-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-leaf mr-1.5" />
                  <Text className="text-xs text-bark/70 font-medium">Grade A Clean ({pctA}%)</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-warn mr-1.5" />
                  <Text className="text-xs text-bark/70 font-medium">Grade B Semi ({pctB}%)</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2.5 h-2.5 rounded-full bg-clay mr-1.5" />
                  <Text className="text-xs text-bark/70 font-medium">Grade C Mixed ({pctC}%)</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <PrimaryButton
              label="Open Full Waste Audit Records"
              onPress={() => router.push("/(officer)/records")}
            />

            {/* Recent Waste Movements */}
            <View className="mt-6">
              <Text className="text-base font-bold text-bark mb-3">Recent Waste Movements</Text>
              {summary.allRows.length === 0 ? (
                <View className="bg-sand border border-line rounded-card p-5 items-center justify-center my-1">
                  <MaterialCommunityIcons name="clipboard-text-clock-outline" size={36} color="#8a7d68" />
                  <Text className="font-bold text-bark mt-2 text-sm">No Waste Movements Logged Yet</Text>
                  <Text className="text-xs text-bark/60 text-center mt-1 leading-4">
                    As local Kabadiwalas collect scrap from residents, live intake and recycling outflow records will populate here automatically.
                  </Text>
                </View>
              ) : (
                summary.allRows.slice(0, 6).map((row: any) => {
                  const isOfficerLeg = row.to_role === "officer";
                  return (
                    <View
                      key={row.id}
                      className="bg-sand border border-line rounded-card p-3.5 mb-2.5"
                    >
                      <View className="flex-row justify-between items-start">
                        <View>
                          <View className="flex-row items-center">
                            <View
                              className={`px-2 py-0.5 rounded-md mr-2 ${
                                isOfficerLeg ? "bg-clay/20" : "bg-leaf/20"
                              }`}
                            >
                              <Text
                                className={`text-[11px] font-bold ${
                                  isOfficerLeg ? "text-clay" : "text-leaf"
                                }`}
                              >
                                {isOfficerLeg ? "Collector ➔ Recycler" : "Customer ➔ Collector"}
                              </Text>
                            </View>
                            <Text className="font-bold text-bark text-sm capitalize">
                              {row.material_category || "Scrap"}
                            </Text>
                          </View>
                          <Text className="text-xs text-bark/60 mt-1">
                            Quality: {row.quality || "Grade A"} • {new Date(row.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-sm font-extrabold text-bark">
                            {Number(row.quantity ?? 0).toFixed(1)} kg
                          </Text>
                          <Text className="text-xs font-bold text-leaf mt-0.5">
                            ₹{Number(row.price ?? 0).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* ================= TAB 2: SCRAP MARGINS & MARKET PRICE INDEX ================= */}
        {activeTab === "margins" && (
          <View>
            <View className="bg-leafLight border border-leaf/30 rounded-card p-4 mb-4">
              <View className="flex-row items-center mb-1">
                <MaterialCommunityIcons name="calculator-variant" size={20} color={theme.leaf} />
                <Text className="text-sm font-black text-leaf ml-1.5">
                  Scrap Price Index & Collector Margin Oversight
                </Text>
              </View>
              <Text className="text-xs text-bark/80 leading-5">
                Shows the benchmark customer purchase rate, municipal corporation resale rate, and calculated collector margin for each scrap commodity.
              </Text>
            </View>

            {/* List of all scrap commodities with margin calculation */}
            {SCRAP_PRICE_CATALOG.map((item) => {
              const buyRate = item.defaultBuyRate;
              const resaleRate = item.expectedOfficerRate;
              const marginAmt = resaleRate - buyRate;
              const marginPct = ((marginAmt / buyRate) * 100).toFixed(1);

              return (
                <View
                  key={item.key}
                  className="bg-sand border border-line rounded-card p-4 mb-3"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 rounded-full bg-white items-center justify-center border border-line mr-2.5">
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={22}
                          color={theme.bark}
                        />
                      </View>
                      <View>
                        <Text className="text-sm font-bold text-bark">{item.nameEn}</Text>
                        <Text className="text-xs text-bark/60">{item.nameHi} • Category: {item.category}</Text>
                      </View>
                    </View>

                    {/* Margin Badge */}
                    <View className="px-2.5 py-1 rounded-lg bg-leafLight border border-leaf/30 items-end">
                      <Text className="text-xs font-black text-leaf">+{marginPct}% Margin</Text>
                      <Text className="text-[10px] text-leaf/80 font-bold">+₹{marginAmt}/{item.unit}</Text>
                    </View>
                  </View>

                  {/* Pricing Comparison Row */}
                  <View className="flex-row bg-white rounded-xl p-3 border border-line/60 justify-between items-center mt-1">
                    {/* Actual Buy Rate */}
                    <View className="flex-1 mr-2">
                      <Text className="text-[10px] uppercase font-bold text-bark/60">
                        Customer Buy Rate
                      </Text>
                      <Text className="text-base font-black text-bark mt-0.5">
                        ₹{buyRate} <Text className="text-xs font-normal text-bark/60">/{item.unit}</Text>
                      </Text>
                      <Text className="text-[10px] text-bark/50">Collector pays citizen</Text>
                    </View>

                    <MaterialCommunityIcons name="arrow-right-thin" size={24} color={theme.line} />

                    {/* Resale Rate to Officer */}
                    <View className="flex-1 ml-2 items-end">
                      <Text className="text-[10px] uppercase font-bold text-leaf">
                        Municipal Resale Rate
                      </Text>
                      <Text className="text-base font-black text-leaf mt-0.5">
                        ₹{resaleRate} <Text className="text-xs font-normal text-leaf/70">/{item.unit}</Text>
                      </Text>
                      <Text className="text-[10px] text-leaf/70">Officer/Recycler pays</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ================= TAB 3: KABADIWALAS & LEGAL NOTICE ================= */}
        {activeTab === "kabadiwalas" && (
          <View>
            <View className="bg-white border border-line rounded-card p-4 mb-4 shadow-sm">
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-black text-bark">
                  Registered Collectors Monitoring
                </Text>
                <View className="px-2 py-0.5 bg-clay/15 rounded-md">
                  <Text className="text-[11px] font-bold text-clay">
                    {kabadiwalas.length} Registered Centers
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-bark/70 leading-5">
                Audit accumulated scrap stock held by local Kabadiwalas. Dispatch compliance warnings or formal municipal legal notices if scrap handover exceeds 7 days.
              </Text>
            </View>

            {kabadiwalas.length === 0 ? (
              <View className="bg-sand border border-line rounded-card p-6 items-center justify-center my-2">
                <MaterialCommunityIcons name="account-group-outline" size={44} color="#8a7d68" />
                <Text className="font-bold text-bark mt-2 text-sm">No Registered Kabadiwalas Yet</Text>
                <Text className="text-xs text-bark/60 text-center mt-1 leading-5 px-4">
                  When scrap collectors register on the platform and collect scrap from citizens, their live godown inventory, last handover date, and compliance status will show here.
                </Text>
              </View>
            ) : (
              kabadiwalas.map((kabadi) => {
                const isOverdue = kabadi.stock_held_kg > 0 && kabadi.days_overdue >= 7;

                return (
                  <View
                    key={kabadi.id}
                    className="bg-sand border border-line rounded-card p-4 mb-3"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-2">
                        <Text className="text-base font-bold text-bark">{kabadi.name}</Text>
                        <Text className="text-xs font-semibold text-leaf">
                          {kabadi.shop_name || "Scrap Collection Yard"}
                        </Text>
                        {kabadi.address ? (
                          <Text className="text-xs text-bark/60 mt-1" numberOfLines={1}>
                            📍 {kabadi.address}
                          </Text>
                        ) : null}
                      </View>

                      {/* Overdue Tag */}
                      <View
                        className={`px-2.5 py-1 rounded-full ${
                          isOverdue ? "bg-clay/20 border border-clay/40" : "bg-leafLight border border-leaf/30"
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-bold ${
                            isOverdue ? "text-clay" : "text-leaf"
                          }`}
                        >
                          {kabadi.stock_held_kg === 0
                            ? "✅ 0 kg Stock"
                            : isOverdue
                            ? `⚠️ ${kabadi.days_overdue} Days Overdue`
                            : "✅ Stock Compliant"}
                        </Text>
                      </View>
                    </View>

                    {/* Stock Metrics Row */}
                    <View className="flex-row bg-white rounded-xl p-3 border border-line/60 justify-between items-center my-2">
                      <View>
                        <Text className="text-[10px] uppercase font-bold text-bark/60">
                          Held Scrap Stock
                        </Text>
                        <Text className="text-lg font-black text-bark">
                          {kabadi.stock_held_kg} kg
                        </Text>
                      </View>

                      <View className="items-end">
                        <Text className="text-[10px] uppercase font-bold text-bark/60">
                          Last Handover Date
                        </Text>
                        <Text className="text-xs font-bold text-bark mt-0.5">
                          {kabadi.last_handover_date || (kabadi.stock_held_kg > 0 ? "Pending first handover" : "No stock held")}
                        </Text>
                      </View>
                    </View>

                    {/* Action Controls: Notice & Direct Contact */}
                    <View className="flex-row gap-2 mt-2">
                      <Pressable
                        onPress={() => openNoticeModal(kabadi)}
                        className="flex-1 py-2.5 bg-clay rounded-xl flex-row items-center justify-center shadow-sm"
                      >
                        <MaterialCommunityIcons name="gavel" size={16} color="#ffffff" />
                        <Text className="text-white font-bold text-xs ml-1.5">
                          Issue Legal Notice
                        </Text>
                      </Pressable>

                      {kabadi.phone ? (
                        <Pressable
                          onPress={() => handleCall(kabadi.phone)}
                          className="p-2.5 bg-white border border-line rounded-xl items-center justify-center"
                          accessibilityLabel="Call Kabadiwala"
                        >
                          <MaterialCommunityIcons name="phone" size={18} color={theme.bark} />
                        </Pressable>
                      ) : null}

                      {kabadi.whatsapp || kabadi.phone ? (
                        <Pressable
                          onPress={() => handleWhatsApp(kabadi.whatsapp || kabadi.phone, kabadi.name)}
                          className="p-2.5 bg-leafLight border border-leaf/40 rounded-xl items-center justify-center"
                          accessibilityLabel="WhatsApp Kabadiwala"
                        >
                          <MaterialCommunityIcons name="whatsapp" size={18} color={theme.leaf} />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= NOTICE DISPATCH MODAL ================= */}
      <Modal
        visible={noticeModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNoticeModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-sand rounded-t-3xl p-5 max-h-[85%] border-t border-line">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="file-document-edit" size={24} color={theme.clay} />
                <Text className="text-lg font-black text-bark ml-2">
                  Issue Municipal Notice
                </Text>
              </View>
              <Pressable
                onPress={() => setNoticeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white items-center justify-center border border-line"
              >
                <MaterialCommunityIcons name="close" size={18} color={theme.bark} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Collector Info Banner */}
              {selectedKabadiwala && (
                <View className="bg-white border border-line rounded-xl p-3 mb-3">
                  <Text className="text-xs font-bold text-bark">
                    Recipient: {selectedKabadiwala.name}
                  </Text>
                  <Text className="text-[11px] text-bark/70">
                    {selectedKabadiwala.shop_name} • Overdue Stock: {selectedKabadiwala.stock_held_kg} kg ({selectedKabadiwala.days_overdue} days)
                  </Text>
                </View>
              )}

              {/* Notice Type Picker */}
              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
                Notice Classification *
              </Text>
              <View className="flex-row mb-3 bg-white rounded-xl p-1 border border-line">
                <Pressable
                  onPress={() => setNoticeType("warning")}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    noticeType === "warning" ? "bg-warn/20 border border-warn/40" : ""
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      noticeType === "warning" ? "text-warn" : "text-bark/60"
                    }`}
                  >
                    ⚠️ Warning
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setNoticeType("legal_notice")}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    noticeType === "legal_notice" ? "bg-clay/20 border border-clay/40" : ""
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      noticeType === "legal_notice" ? "text-clay" : "text-bark/60"
                    }`}
                  >
                    ⚖️ Legal Notice
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setNoticeType("final_order")}
                  className={`flex-1 py-2 rounded-lg items-center ${
                    noticeType === "final_order" ? "bg-bark/20 border border-bark/40" : ""
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      noticeType === "final_order" ? "text-bark" : "text-bark/60"
                    }`}
                  >
                    ⛔ Final Order
                  </Text>
                </Pressable>
              </View>

              {/* Subject */}
              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
                Official Subject *
              </Text>
              <TextInput
                value={noticeSubject}
                onChangeText={setNoticeSubject}
                placeholder="Enter notice subject"
                className="bg-white border border-line rounded-xl px-4 py-3 text-sm text-bark font-semibold mb-3"
                placeholderTextColor="#8a7d68"
              />

              {/* Message */}
              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1.5">
                Notice Text & Legal Order *
              </Text>
              <TextInput
                value={noticeMessage}
                onChangeText={setNoticeMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholder="Enter detailed notice order"
                className="bg-white border border-line rounded-xl p-3 text-sm text-bark min-h-[120px] mb-4"
                placeholderTextColor="#8a7d68"
              />

              <PrimaryButton
                label="Dispatch Notice & Send Push Alert"
                onPress={handleSendNotice}
                loading={sendingNotice}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Universal Settings & Permissions Modal */}
      <AppSettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ScreenContainer>
  );
}
