import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import {
  FlatList,
  Text,
  View,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
  Linking,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { LoadingView } from "../../components/LoadingView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { LeafletMap } from "../../components/LeafletMap";
import { theme } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { syncProfileLocation } from "../../services/location";
import { getNearbyListings, type NearbyListing } from "../../services/queries/listings";
import {
  getBookingsForKabadiwala,
  bookListing,
  updateBookingStatus,
  type Booking,
} from "../../services/queries/bookings";
import {
  markBookingCollected,
  getKabadiwalaWasteLedger,
  recordDirectIntake,
  QUALITY_GRADES,
} from "../../services/queries/transactions";
import {
  SCRAP_PRICE_CATALOG,
  getDefaultPriceRates,
  getExpectedOfficerRates,
} from "../../constants/scrapPricing";
import { signOut } from "../../services/auth";
import { supabase } from "../../services/supabase";
import { AppSettingsModal } from "../../components/AppSettingsModal";
import {
  getNoticesForKabadiwala,
  acknowledgeNotice,
  type MunicipalNotice,
} from "../../services/queries/notices";

function buildInitialLedger(customRates?: Record<string, number> | null) {
  const rates = customRates ?? getDefaultPriceRates();
  const categoryBreakdown = SCRAP_PRICE_CATALOG.map((item) => {
    const buyRate = rates[item.key] ?? item.defaultBuyRate;

    return {
      key: item.key,
      nameEn: item.nameEn,
      nameHi: item.nameHi,
      icon: item.icon,
      intakeKg: 0,
      spent: 0,
      outgoingKg: 0,
      earned: 0,
      stockKg: 0,
      avgBuyRate: buyRate,
      expectedOfficerRate: item.expectedOfficerRate,
      expectedOfficerPayout: 0,
      expectedProfit: 0,
    };
  });

  return {
    intakeRows: [],
    outgoingRows: [],
    totalIntakeKg: 0,
    totalOutgoingKg: 0,
    totalIntakeSpent: 0,
    totalOutgoingEarned: 0,
    stockBalanceKg: 0,
    categoryBreakdown,
    totalExpectedOfficerPayout: 0,
    totalProjectedProfit: 0,
  };
}

export default function KabadiwalaDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [activeTab, setActiveTab] = useState<"pickups" | "rates" | "ledger" | "route">("pickups");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<NearbyListing[]>([]);
  const [ledger, setLedger] = useState<any>(() => buildInitialLedger(profile?.price_rates));
  const [ledgerSubTab, setLedgerSubTab] = useState<"breakdown" | "intake" | "outgoing">("breakdown");
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Rate Card Management State
  const [editingRates, setEditingRates] = useState<Record<string, number>>(() => ({
    ...getDefaultPriceRates(),
    ...(profile?.price_rates ?? {}),
  }));
  const [savingRates, setSavingRates] = useState(false);

  // Direct Intake Modal State
  const [directIntakeOpen, setDirectIntakeOpen] = useState(false);
  const [directCategory, setDirectCategory] = useState("copper");
  const [directWeight, setDirectWeight] = useState("");
  const [directPrice, setDirectPrice] = useState("");
  const [directExpectedRate, setDirectExpectedRate] = useState("750");
  const [directCustomerName, setDirectCustomerName] = useState("");
  const [directQuality, setDirectQuality] = useState("Grade A (Clean)");
  const [submittingDirect, setSubmittingDirect] = useState(false);

  // Mark Collected Modal State
  const [collectingBooking, setCollectingBooking] = useState<Booking | null>(null);
  const [collectWeight, setCollectWeight] = useState("");
  const [collectPrice, setCollectPrice] = useState("");
  const [collectQuality, setCollectQuality] = useState("Grade A (Clean)");
  const [submittingCollection, setSubmittingCollection] = useState(false);

  // Municipal Notices State
  const [notices, setNotices] = useState<MunicipalNotice[]>([]);
  const [selectedNoticeForModal, setSelectedNoticeForModal] = useState<MunicipalNotice | null>(null);

  // Shop Profile & Contact Edit Modal State
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [editShopName, setEditShopName] = useState(profile?.shop_name ?? "");
  const [editShopPhone, setEditShopPhone] = useState(profile?.phone ?? "");
  const [editShopWhatsapp, setEditShopWhatsapp] = useState(profile?.whatsapp ?? profile?.phone ?? "");
  const [editShopAddress, setEditShopAddress] = useState(profile?.address ?? "");
  const [savingShopProfile, setSavingShopProfile] = useState(false);

  // Shop Photo Picker Modal State
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  async function handlePickShopPhoto() {
    setPhotoModalOpen(false);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please grant gallery permission to choose a shop photo.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const photoUri = result.assets[0].uri;
        await updateProfile({ shop_photo_url: photoUri });
        Alert.alert("Shop Photo Updated! 📸", "Your scrap shop photo is now visible to customers.");
      }
    } catch (err: any) {
      Alert.alert("Photo Error", err?.message ?? "Could not select shop photo.");
    }
  }

  async function handleTakeShopPhoto() {
    setPhotoModalOpen(false);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Please grant camera permission to take a shop photo.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const photoUri = result.assets[0].uri;
        await updateProfile({ shop_photo_url: photoUri });
        Alert.alert("Shop Photo Updated! 📸", "Your scrap shop photo has been saved.");
      }
    } catch (err: any) {
      Alert.alert("Camera Error", err?.message ?? "Could not take photo.");
    }
  }

  async function handleUseSamplePhoto() {
    setPhotoModalOpen(false);
    try {
      const sampleUrl =
        "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop";
      await updateProfile({
        shop_photo_url: sampleUrl,
        shop_name: profile?.shop_name || `${profile?.name ?? "Kawa"} Scrap Center`,
      });
      Alert.alert("Shop Photo Set! 📸", "Sample scrap center photo applied.");
    } catch (err: any) {
      Alert.alert("Photo Error", err?.message ?? "Could not apply sample photo.");
    }
  }

  async function handleRemoveShopPhoto() {
    setPhotoModalOpen(false);
    try {
      await updateProfile({ shop_photo_url: null });
      Alert.alert("Photo Removed", "Your shop photo has been removed.");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not remove photo.");
    }
  }

  function handleChoosePhotoSource() {
    setPhotoModalOpen(true);
  }

  useEffect(() => {
    if (profile?.price_rates) {
      setEditingRates((prev) => ({
        ...getDefaultPriceRates(),
        ...prev,
        ...profile.price_rates,
      }));
    }
  }, [profile?.price_rates]);

  const coordsRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const loadRef = useRef<(force?: boolean) => Promise<void>>(() => Promise.resolve());
  const lastLoadedAtRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  // Non-blocking location sync performed once on mount
  useEffect(() => {
    if (!profile?.id) return;
    let active = true;
    syncProfileLocation(profile.id)
      .then((loc) => {
        if (active && loc) {
          coordsRef.current = loc;
          setCoords(loc);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [profile?.id]);

  const load = useCallback(async (force = false) => {
    if (!profile?.id) return;
    if (isFetchingRef.current) return;
    const now = Date.now();
    // Prevent duplicate heavy queries if screen was focused recently (< 25s) and not forced
    if (!force && now - lastLoadedAtRef.current < 25000) {
      return;
    }

    isFetchingRef.current = true;
    try {
      const currentRates = profile.price_rates ?? getDefaultPriceRates();
      const currentCoords = coordsRef.current ?? coords ?? { latitude: 28.6139, longitude: 77.209 };

      const [bookingsData, nearbyListingsData, ledgerData, noticesData] = await Promise.all([
        getBookingsForKabadiwala(profile.id).catch(() => []),
        getNearbyListings(currentCoords).catch(() => []),
        getKabadiwalaWasteLedger(profile.id, currentRates).catch(() => null),
        getNoticesForKabadiwala(profile.id).catch(() => []),
      ]);

      if (bookingsData) setBookings(bookingsData as any);
      if (nearbyListingsData) setListings(nearbyListingsData);
      if (ledgerData) setLedger(ledgerData);
      if (noticesData) setNotices(noticesData);
      lastLoadedAtRef.current = Date.now();
    } catch {
      // Keep UI active on errors
    } finally {
      isFetchingRef.current = false;
    }
  }, [profile?.id, profile?.price_rates]);

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      loadRef.current(false);
    }, [])
  );

  // Multi-user Real-Time Subscription: Listen for booking & transaction events once per profile
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`kabadiwala_${profile.id}_realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          loadRef.current(true);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          loadRef.current(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await signOut();
    reset();
    router.replace("/(auth)/role-select");
  }

  async function handleUpdateStatus(bookingId: string, status: any) {
    try {
      await updateBookingStatus(bookingId, status);
      await load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not update status");
    }
  }

  async function handleSaveShopProfile() {
    if (!editShopName.trim() || !editShopPhone.trim()) {
      Alert.alert("Required Fields", "Please provide your scrap shop name and phone number.");
      return;
    }
    setSavingShopProfile(true);
    try {
      await updateProfile({
        shop_name: editShopName.trim(),
        phone: editShopPhone.trim(),
        whatsapp: editShopWhatsapp.trim() || editShopPhone.trim(),
        address: editShopAddress.trim() || undefined,
      });
      Alert.alert("Contact Details Updated! ✅", "Your scrap business details have been saved.");
      setShopModalOpen(false);
    } catch (err: any) {
      Alert.alert("Update Error", err?.message ?? "Could not save details.");
    } finally {
      setSavingShopProfile(false);
    }
  }

  async function handleAcknowledgeNotice(noticeId: string) {
    try {
      await acknowledgeNotice(noticeId);
      Alert.alert("Notice Acknowledged", "You have acknowledged this municipal compliance notice.");
      setSelectedNoticeForModal(null);
      if (profile) {
        const updated = await getNoticesForKabadiwala(profile.id);
        setNotices(updated);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not acknowledge notice.");
    }
  }

  function handleCallCustomer(phone?: string) {
    if (!phone) {
      Alert.alert("Phone Unavailable", "Customer phone number is not available.");
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Call Unavailable", `Phone dialer could not be launched for ${phone}`);
    });
  }

  function handleWhatsAppCustomer(phone?: string, name?: string) {
    if (!phone) {
      Alert.alert("WhatsApp Unavailable", "Customer contact number is not available.");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formatted = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(
      `Namaste ${name || "Customer"}, this is your KAWA scrap collector. I am coordinating your scheduled scrap pickup.`
    )}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp Unavailable", "Could not launch WhatsApp.");
    });
  }

  function openCollectModal(b: Booking) {
    setCollectingBooking(b);
    const firstItem = b.items?.[0] || b.scrap_listings;
    setCollectWeight(firstItem?.quantity ? String(firstItem.quantity) : "");
    setCollectPrice(b.price_agreed ? String(b.price_agreed) : "");
    setCollectQuality("Grade A (Clean)");
  }

  async function submitCollection() {
    if (!collectingBooking || !collectPrice || Number(collectPrice) <= 0) {
      Alert.alert("Price Required", "Please enter the price paid for this collection.");
      return;
    }

    setSubmittingCollection(true);
    try {
      await markBookingCollected({
        bookingId: collectingBooking.id,
        price: Number(collectPrice),
        actualQuantity: collectWeight ? Number(collectWeight) : undefined,
        quality: collectQuality,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      Alert.alert("Collection Recorded", "Garbage intake successfully logged in your waste ledger.");
      setCollectingBooking(null);
      await load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to mark collected.");
    } finally {
      setSubmittingCollection(false);
    }
  }

  // Rate Card Management: Adjust single rate
  function handleRateChange(materialKey: string, newPrice: number) {
    const valid = Math.max(1, Math.min(9999, Math.round(newPrice)));
    setEditingRates((prev) => ({
      ...prev,
      [materialKey]: valid,
    }));
  }

  async function handleSaveRateCard() {
    if (!profile) return;
    setSavingRates(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ price_rates: editingRates })
        .eq("id", profile.id);

      if (error) throw error;

      useAuthStore.getState().updateProfile({ price_rates: editingRates });
      Alert.alert(
        "Rate Card Published! 🏷️",
        "Your scrap buying prices have been successfully saved and are now visible live to all customers in your area."
      );
      await load(true);
    } catch (err: any) {
      Alert.alert("Save Error", err?.message ?? "Could not save rates. Please try again.");
    } finally {
      setSavingRates(false);
    }
  }

  // Direct Scrap Intake Handlers
  function handleDirectCategoryChange(catKey: string) {
    setDirectCategory(catKey);
    const benchmarkRates = getExpectedOfficerRates();
    if (benchmarkRates[catKey]) {
      setDirectExpectedRate(String(benchmarkRates[catKey]));
    }
    if (directWeight && Number(directWeight) > 0) {
      const buyRate = editingRates[catKey] ?? getDefaultPriceRates()[catKey] ?? 20;
      setDirectPrice(String(Math.round(Number(directWeight) * buyRate)));
    }
  }

  function handleDirectWeightChange(val: string) {
    const cleaned = val.replace(/[^0-9.]/g, "");
    setDirectWeight(cleaned);
    if (cleaned && Number(cleaned) > 0) {
      const buyRate = editingRates[directCategory] ?? getDefaultPriceRates()[directCategory] ?? 20;
      setDirectPrice(String(Math.round(Number(cleaned) * buyRate)));
    }
  }

  async function submitDirectIntake() {
    if (!profile) return;
    if (!directWeight || Number(directWeight) <= 0) {
      Alert.alert("Weight Required", "Please enter the measured weight in kg.");
      return;
    }
    if (!directPrice || Number(directPrice) <= 0) {
      Alert.alert("Price Required", "Please enter the total price paid to the customer.");
      return;
    }

    setSubmittingDirect(true);
    try {
      await recordDirectIntake({
        kabadiwalaId: profile.id,
        category: directCategory,
        quantity: Number(directWeight),
        pricePaid: Number(directPrice),
        quality: directQuality,
        customerName: directCustomerName.trim() || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      Alert.alert(
        "Scrap Intake Recorded! 📦",
        `${directWeight} kg of ${directCategory.toUpperCase()} added to inventory.\nBuying Cost: ₹${directPrice}\nExpected Resale: ₹${Math.round(Number(directWeight) * Number(directExpectedRate))}`
      );

      setDirectIntakeOpen(false);
      setDirectWeight("");
      setDirectPrice("");
      setDirectCustomerName("");
      await load(true);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not record intake.");
    } finally {
      setSubmittingDirect(false);
    }
  }

  // Calculate planned route stops from accepted/in-progress bookings
  const routeStops = useMemo(
    () =>
      (bookings ?? []).filter(
        (b) => b.status === "accepted" || b.status === "in_progress" || b.status === "requested"
      ),
    [bookings]
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-2 mb-2">
        <View>
          <Text className="text-xl font-bold text-bark">{t("kabadiwalaDashboard.title")}</Text>
          <Text className="text-xs font-semibold text-leaf">
            {profile?.name ?? t("roleSelect.kabadiwala")} • {t("kabadiwalaDashboard.subtitle")}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Pressable onPress={() => setSettingsOpen(true)} className="mr-2 p-2 bg-sand rounded-full border border-line" accessibilityLabel="Settings">
            <MaterialCommunityIcons name="cog" size={20} color={theme.bark} />
          </Pressable>
          <Pressable onPress={handleLogout} className="p-2 bg-sand rounded-full border border-line" accessibilityLabel="Logout">
            <MaterialCommunityIcons name="logout" size={20} color={theme.bark} />
          </Pressable>
        </View>
      </View>

      {/* URGENT MUNICIPAL COMPLIANCE NOTICE BANNER */}
      {(() => {
        const activeNotice = notices.find((n) => n.status === "pending" && n.kabadiwala_id === profile?.id);
        if (!activeNotice) return null;

        return (
          <View className="bg-clay/10 border-2 border-clay rounded-2xl p-3 mb-2.5 shadow-sm">
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center flex-1 mr-2">
                <MaterialCommunityIcons name="gavel" size={18} color={theme.clay} />
                <Text className="font-black text-clay text-xs ml-1.5 uppercase">
                  {activeNotice.notice_type.replace("_", " ")}: Municipal Notice
                </Text>
              </View>
              <View className="px-2 py-0.5 bg-clay rounded-md">
                <Text className="text-white text-[10px] font-black uppercase">
                  {activeNotice.days_overdue} Days Overdue
                </Text>
              </View>
            </View>

            <Text className="text-xs font-bold text-bark">
              {activeNotice.subject}
            </Text>
            <Text className="text-[11px] text-bark/80 mt-1 leading-4" numberOfLines={2}>
              {activeNotice.message}
            </Text>
            <Text className="text-[10px] text-bark/60 mt-1">
              Issued by: {activeNotice.officer_name} ({activeNotice.officer_department}) • Stock: {activeNotice.stock_held_kg} kg
            </Text>

            <View className="flex-row gap-2 mt-2.5">
              <Pressable
                onPress={() => router.push("/(kabadiwala)/sell-to-officer")}
                className="flex-1 py-2 px-3 bg-leaf rounded-xl flex-row items-center justify-center shadow-sm"
              >
                <MaterialCommunityIcons name="truck-delivery" size={15} color="#ffffff" />
                <Text className="text-white font-black text-xs ml-1.5">
                  Handover Stock to Officer
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSelectedNoticeForModal(activeNotice)}
                className="py-2 px-3 bg-white border border-line rounded-xl items-center justify-center"
              >
                <Text className="text-bark font-bold text-xs">View Order</Text>
              </Pressable>
            </View>
          </View>
        );
      })()}

      {/* Shop Profile & Photo Banner */}
      <View className="bg-sand rounded-card p-2.5 mb-2.5 border border-line">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => setPhotoModalOpen(true)}
            className="flex-row items-center flex-1 mr-2"
          >
            {profile?.shop_photo_url ? (
              <View className="relative mr-2.5">
                <Image
                  source={{ uri: profile.shop_photo_url }}
                  className="w-12 h-12 rounded-xl border border-line"
                  resizeMode="cover"
                />
                <View className="absolute -bottom-1 -right-1 bg-leaf rounded-full p-1 border border-white">
                  <MaterialCommunityIcons name="camera" size={10} color="#FFF" />
                </View>
              </View>
            ) : (
              <View className="relative mr-2.5">
                <View className="w-12 h-12 rounded-xl bg-leaf/10 border border-leaf/30 items-center justify-center">
                  <MaterialCommunityIcons name="storefront-outline" size={24} color={theme.leaf} />
                </View>
                <View className="absolute -bottom-1 -right-1 bg-leaf rounded-full p-1 border border-white">
                  <MaterialCommunityIcons name="plus" size={10} color="#FFF" />
                </View>
              </View>
            )}
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="font-bold text-bark text-sm" numberOfLines={1}>
                  {profile?.shop_name || `${profile?.name ?? "Collector"}'s Scrap Center`}
                </Text>
                <MaterialCommunityIcons name="check-decagram" size={14} color={theme.leaf} />
              </View>
              <Text className="text-[11px] text-bark/60 mt-0.5" numberOfLines={1}>
                {profile?.phone ? `📞 ${profile.phone}` : "No contact saved"} • {profile?.address ? profile.address.slice(0, 20) + "..." : "Local Mandi"}
              </Text>
            </View>
          </Pressable>
          <View className="flex-row gap-1.5">
            <Pressable
              onPress={() => setShopModalOpen(true)}
              className="py-1 px-2 bg-white border border-line rounded-lg flex-row items-center"
            >
              <MaterialCommunityIcons name="pencil-outline" size={13} color={theme.bark} />
              <Text className="text-bark text-[11px] font-bold ml-1">Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => setPhotoModalOpen(true)}
              className="py-1 px-2 bg-leaf rounded-lg flex-row items-center"
            >
              <MaterialCommunityIcons name="camera" size={13} color="#FFF" />
              <Text className="text-white text-[11px] font-bold ml-1">
                {profile?.shop_photo_url ? "Photo" : "+ Photo"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* E-Waste Rules 2022 Quick Action Hub */}
      <View className="flex-row gap-2 mb-2.5">
        <Pressable
          onPress={() => router.push("/(kabadiwala)/safety-guidance" as any)}
          className="flex-1 bg-clay/10 border border-clay/30 rounded-xl py-2 px-1 items-center justify-center shadow-xs"
        >
          <MaterialCommunityIcons name="shield-alert-outline" size={18} color={theme.clay} />
          <Text className="text-[11px] font-black text-clay mt-0.5 text-center" numberOfLines={1}>
            {t("kabadiwalaDashboard.safetyHub")}
          </Text>
          <Text className="text-[9px] text-clay/80 text-center font-medium" numberOfLines={1}>
            {t("kabadiwalaDashboard.safetyHubSub")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/(kabadiwala)/sell-to-officer" as any)}
          className="flex-1 bg-leaf/10 border border-leaf/30 rounded-xl py-2 px-1 items-center justify-center shadow-xs"
        >
          <MaterialCommunityIcons name="factory" size={18} color={theme.leaf} />
          <Text className="text-[11px] font-black text-leaf mt-0.5 text-center" numberOfLines={1}>
            {t("kabadiwalaDashboard.recyclerSale")}
          </Text>
          <Text className="text-[9px] text-leaf/80 text-center font-medium" numberOfLines={1}>
            {t("kabadiwalaDashboard.recyclerSaleSub")}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/price-trends" as any)}
          className="flex-1 bg-sand border border-line rounded-xl py-2 px-1 items-center justify-center shadow-xs"
        >
          <MaterialCommunityIcons name="volume-high" size={18} color={theme.bark} />
          <Text className="text-[11px] font-black text-bark mt-0.5 text-center" numberOfLines={1}>
            {t("kabadiwalaDashboard.voiceRates")}
          </Text>
          <Text className="text-[9px] text-bark/60 text-center font-medium" numberOfLines={1}>
            {t("kabadiwalaDashboard.voiceRatesSub")}
          </Text>
        </Pressable>
      </View>

      {/* 4 Main Tabs */}
      <View className="flex-row mb-2.5 bg-sand rounded-xl p-1 border border-line">
        <Pressable
          onPress={() => setActiveTab("pickups")}
          className={`flex-1 py-2 px-1 rounded-lg items-center justify-center ${
            activeTab === "pickups" ? "bg-white border border-line/40 shadow-sm" : ""
          }`}
        >
          <Text
            numberOfLines={1}
            className={`font-bold text-[11px] text-center ${
              activeTab === "pickups" ? "text-bark" : "text-bark/60"
            }`}
          >
            {t("kabadiwalaDashboard.tabPickups")} ({routeStops.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("rates")}
          className={`flex-1 py-2 px-1 rounded-lg items-center justify-center ${
            activeTab === "rates" ? "bg-white border border-line/40 shadow-sm" : ""
          }`}
        >
          <Text
            numberOfLines={1}
            className={`font-bold text-[11px] text-center ${
              activeTab === "rates" ? "text-leaf" : "text-bark/60"
            }`}
          >
            {t("kabadiwalaDashboard.tabRates")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("ledger")}
          className={`flex-1 py-2 px-1 rounded-lg items-center justify-center ${
            activeTab === "ledger" ? "bg-white border border-line/40 shadow-sm" : ""
          }`}
        >
          <Text
            numberOfLines={1}
            className={`font-bold text-[11px] text-center ${
              activeTab === "ledger" ? "text-clay" : "text-bark/60"
            }`}
          >
            {t("kabadiwalaDashboard.tabLedger")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("route")}
          className={`flex-1 py-2 px-1 rounded-lg items-center justify-center ${
            activeTab === "route" ? "bg-white border border-line/40 shadow-sm" : ""
          }`}
        >
          <Text
            numberOfLines={1}
            className={`font-bold text-[11px] text-center ${
              activeTab === "route" ? "text-bark" : "text-bark/60"
            }`}
          >
            {t("kabadiwalaDashboard.tabRoute")}
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: PICKUPS & BOOKINGS */}
      {activeTab === "pickups" && (
        <ScrollView
          style={{ flex: 1 }}
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        >
          {/* Incoming Customer Bookings */}
          <Text className="text-base font-bold text-bark mb-2">{t("kabadiwalaDashboard.incomingBookings")}</Text>

          {bookings.length === 0 ? (
            <View className="bg-sand rounded-card p-6 items-center border border-line mb-5">
              <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={theme.line} />
              <Text className="text-bark/60 text-center mt-3">{t("kabadiwalaDashboard.noBookings")}</Text>
            </View>
          ) : (
            bookings.map((b) => {
              const isCollected = b.status === "collected" || b.status === "completed";
              const itemsList = b.items ?? [];
              return (
                <View key={b.id} className="bg-sand border border-line rounded-card p-4 mb-3">
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="clock-time-four-outline" size={16} color={theme.leaf} />
                        <Text className="font-bold text-bark text-sm ml-1.5">
                          {b.time_slot ?? "Flexible Time Slot"}
                        </Text>
                      </View>
                      <Text className="text-xs text-bark/60 mt-0.5">
                        Scheduled: {b.scheduled_date ?? "Today"}
                      </Text>
                    </View>
                    <View className="px-2.5 py-1 rounded-full bg-leafLight">
                      <Text className="text-xs font-bold text-leaf uppercase">{b.status}</Text>
                    </View>
                  </View>

                  {/* Items to collect */}
                  <View className="bg-paper/70 rounded-xl p-2.5 my-2 border border-line/50">
                    <Text className="text-xs font-semibold text-bark/70 mb-1">{t("kabadiwalaDashboard.itemsToCollect")}</Text>
                    {itemsList.length > 0 ? (
                      <View className="flex-row flex-wrap gap-1.5">
                        {itemsList.map((it, idx) => (
                          <View key={idx} className="bg-sand px-2 py-0.5 rounded-md border border-line">
                            <Text className="text-xs font-bold text-bark capitalize">
                              {it.category}: {it.quantity} {it.unit || "kg"}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : b.scrap_listings ? (
                      <Text className="text-xs font-bold text-bark">
                        {b.scrap_listings.category} ({b.scrap_listings.quantity} {b.scrap_listings.unit})
                      </Text>
                    ) : (
                      <Text className="text-xs text-bark/60">Scrap parcel</Text>
                    )}

                    {b.pickup_address && (
                      <Text className="text-xs text-bark/80 mt-1.5">📍 {b.pickup_address}</Text>
                    )}
                  </View>

                  {/* Customer Contact & Direct Communication */}
                  <View className="flex-row items-center justify-between py-2 px-1 border-t border-b border-line/40 my-1">
                    <View className="flex-1 mr-2">
                      <Text className="text-xs font-bold text-bark" numberOfLines={1}>
                        👤 {b.customer?.name || "Customer"}
                      </Text>
                      <Text className="text-[11px] text-bark/60">
                        📞 {b.customer?.phone || b.customer?.whatsapp || "Mobile on file"}
                      </Text>
                    </View>
                    <View className="flex-row gap-1.5">
                      <Pressable
                        onPress={() => handleCallCustomer(b.customer?.phone || b.customer?.whatsapp)}
                        className="px-2.5 py-1.5 bg-white border border-line rounded-lg flex-row items-center shadow-xs"
                        accessibilityLabel="Call Customer"
                      >
                        <MaterialCommunityIcons name="phone" size={13} color={theme.bark} />
                        <Text className="text-xs font-bold text-bark ml-1">{t("kabadiwalaDashboard.call")}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleWhatsAppCustomer(b.customer?.whatsapp || b.customer?.phone, b.customer?.name)}
                        className="px-2.5 py-1.5 bg-leafLight border border-leaf/40 rounded-lg flex-row items-center shadow-xs"
                        accessibilityLabel="WhatsApp Customer"
                      >
                        <MaterialCommunityIcons name="whatsapp" size={13} color={theme.leaf} />
                        <Text className="text-xs font-bold text-leaf ml-1">{t("kabadiwalaDashboard.whatsapp")}</Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Action Controls */}
                  {!isCollected && (
                    <View className="flex-row gap-2 mt-2">
                      {b.status === "requested" && (
                        <Pressable
                          onPress={() => handleUpdateStatus(b.id, "accepted")}
                          className="flex-1 py-2.5 bg-leaf rounded-xl items-center"
                        >
                          <Text className="text-white font-bold text-xs">{t("kabadiwalaDashboard.acceptBooking")}</Text>
                        </Pressable>
                      )}
                      {b.status === "accepted" && (
                        <Pressable
                          onPress={() => handleUpdateStatus(b.id, "in_progress")}
                          className="flex-1 py-2.5 bg-bark rounded-xl items-center"
                        >
                          <Text className="text-white font-bold text-xs">{t("kabadiwalaDashboard.startPickup")}</Text>
                        </Pressable>
                      )}
                      {(b.status === "in_progress" || b.status === "accepted") && (
                        <Pressable
                          onPress={() => openCollectModal(b)}
                          className="flex-1 py-2.5 bg-ok rounded-xl items-center"
                        >
                          <Text className="text-white font-bold text-xs">{t("kabadiwalaDashboard.markCollected")}</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* TAB 4: PLANNED ROUTE (प्लांट रूट) */}
      {activeTab === "route" && (
        <ScrollView
          style={{ flex: 1 }}
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        >
          <View className="mb-4">
            <Text className="text-base font-bold text-bark mb-1">{t("kabadiwalaDashboard.routeTitle")}</Text>
            <Text className="text-xs text-bark/60 mb-3">
              {t("kabadiwalaDashboard.routeSubtitle")}
            </Text>

            {(() => {
              const currentMapCenter = coords ?? coordsRef.current ?? { latitude: 28.6139, longitude: 77.209 };
              return (
                <LeafletMap
                  center={currentMapCenter}
                  markers={[
                    { id: "self", latitude: currentMapCenter.latitude, longitude: currentMapCenter.longitude, isSelf: true },
                    ...routeStops.map((s, idx) => ({
                      id: s.id,
                      latitude: s.pickup_lat ?? currentMapCenter.latitude + (idx + 1) * 0.005,
                      longitude: s.pickup_lng ?? currentMapCenter.longitude + (idx + 1) * 0.005,
                      label: `Stop ${idx + 1}`,
                    })),
                  ]}
                />
              );
            })()}
          </View>

          {routeStops.length === 0 ? (
            <View className="bg-sand rounded-card p-6 items-center border border-line">
              <MaterialCommunityIcons name="map-check-outline" size={40} color={theme.line} />
              <Text className="text-bark/70 text-center mt-3">{t("kabadiwalaDashboard.routeCompleted")}</Text>
            </View>
          ) : (
            <View>
              <Text className="text-sm font-bold text-bark mb-3">
                Route Itinerary ({routeStops.length} Stops):
              </Text>
              {routeStops.map((stop, idx) => (
                <View key={stop.id} className="bg-sand border border-line rounded-card p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-7 h-7 rounded-full bg-leaf items-center justify-center mr-2">
                        <Text className="text-white font-bold text-xs">{idx + 1}</Text>
                      </View>
                      <Text className="font-bold text-bark text-base">Stop #{idx + 1}</Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-full bg-leafLight">
                      <Text className="text-xs font-bold text-leaf">{stop.time_slot ?? "Anytime"}</Text>
                    </View>
                  </View>

                  <Text className="text-xs text-bark/70 mb-1">
                    📍 {stop.pickup_address ?? "Customer Location nearby"}
                  </Text>
                  {stop.items && stop.items.length > 0 && (
                    <Text className="text-xs font-semibold text-bark mb-3">
                      📦 {stop.items.map((it) => `${it.category} (${it.quantity}${it.unit || "kg"})`).join(", ")}
                    </Text>
                  )}

                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        const lat = stop.pickup_lat ?? coords?.latitude;
                        const lng = stop.pickup_lng ?? coords?.longitude;
                        if (lat && lng) {
                          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                        }
                      }}
                      className="flex-1 py-2 px-3 bg-paper border border-line rounded-xl flex-row items-center justify-center"
                    >
                      <MaterialCommunityIcons name="navigation-variant" size={16} color={theme.leaf} />
                      <Text className="text-xs font-bold text-bark ml-1.5">{t("kabadiwalaDashboard.openGoogleMaps")}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => openCollectModal(stop)}
                      className="py-2 px-4 bg-leaf rounded-xl items-center justify-center"
                    >
                      <Text className="text-xs font-bold text-white">Collect</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* ========================================================
          TAB 2: RATE CARD & PRICE CHART (दाम सूची / स्क्रैप भाव)
         ======================================================== */}
      {activeTab === "rates" && (
        <ScrollView
          style={{ flex: 1 }}
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        >
          <View className="mb-3">
            <Text className="text-lg font-extrabold text-bark">
              {t("kabadiwalaDashboard.rateCardTitle")}
            </Text>
            <Text className="text-xs text-bark/70 mt-0.5">
              {t("kabadiwalaDashboard.rateCardSubtitle")}
            </Text>
          </View>

          {/* Rate List */}
          <View className="gap-2.5 mb-4">
            {SCRAP_PRICE_CATALOG.map((item) => {
              const currentRate = editingRates[item.key] ?? item.defaultBuyRate;
              const expectedResale = item.expectedOfficerRate;
              const marginPerKg = expectedResale - currentRate;

              return (
                <View
                  key={item.key}
                  className="bg-sand border border-line rounded-2xl p-3.5 shadow-xs"
                >
                  {/* ROW 1: Item Info & Stepper Controls */}
                  <View className="flex-row items-center justify-between">
                    {/* Left: Icon & Dual-language Name */}
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-10 h-10 rounded-xl bg-leafLight items-center justify-center mr-2.5 border border-leaf/20">
                        <MaterialCommunityIcons name={item.icon as any} size={22} color={theme.leaf} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-extrabold text-bark text-sm" numberOfLines={1}>
                          {item.nameEn}
                        </Text>
                        <Text className="text-xs text-bark/60 font-semibold mt-0.5" numberOfLines={1}>
                          {item.nameHi}
                        </Text>
                      </View>
                    </View>

                    {/* Right: Plus / Minus Stepper */}
                    <View className="flex-row items-center bg-white border border-line rounded-xl px-1.5 py-1">
                      <Pressable
                        onPress={() => handleRateChange(item.key, currentRate - 5)}
                        className="w-7 h-7 rounded-lg bg-sand items-center justify-center border border-line"
                        hitSlop={8}
                      >
                        <MaterialCommunityIcons name="minus" size={16} color={theme.bark} />
                      </Pressable>

                      <View className="flex-row items-center px-1.5">
                        <Text className="text-sm font-black text-bark">₹</Text>
                        <TextInput
                          value={String(currentRate)}
                          onChangeText={(v) => {
                            const n = Number(v.replace(/[^0-9]/g, ""));
                            handleRateChange(item.key, n);
                          }}
                          keyboardType="numeric"
                          className="font-extrabold text-base text-bark px-1 text-center min-w-[36px]"
                        />
                        <Text className="text-xs font-semibold text-bark/60">/kg</Text>
                      </View>

                      <Pressable
                        onPress={() => handleRateChange(item.key, currentRate + 5)}
                        className="w-7 h-7 rounded-lg bg-sand items-center justify-center border border-line"
                        hitSlop={8}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color={theme.leaf} />
                      </Pressable>
                    </View>
                  </View>

                  {/* ROW 2: Benchmark & Margin Breakdown Pill */}
                  <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t border-line/40">
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="factory" size={14} color={theme.bark} />
                      <Text className="text-[11px] text-bark/70 font-medium ml-1">
                        Officer/Recycler: <Text className="font-bold text-bark">₹{expectedResale}/kg</Text>
                      </Text>
                    </View>
                    <View
                      className={`px-2 py-0.5 rounded-full flex-row items-center ${
                        marginPerKg >= 0 ? "bg-leafLight border border-leaf/30" : "bg-clay/10 border border-clay/30"
                      }`}
                    >
                      <MaterialCommunityIcons
                        name={marginPerKg >= 0 ? "trending-up" : "trending-down"}
                        size={12}
                        color={marginPerKg >= 0 ? theme.leaf : theme.clay}
                      />
                      <Text
                        className={`text-[11px] font-black ml-1 ${
                          marginPerKg >= 0 ? "text-leaf" : "text-clay"
                        }`}
                      >
                        {marginPerKg >= 0 ? "+" : ""}₹{marginPerKg}/kg margin
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Save & Publish Action */}
          <PrimaryButton
            label={t("kabadiwalaDashboard.saveRatesBtn")}
            onPress={handleSaveRateCard}
            loading={savingRates}
          />

          {/* Customer View Preview */}
          <View className="mt-5 bg-sand/60 border border-line/70 rounded-card p-4">
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="eye-outline" size={18} color={theme.leaf} />
              <Text className="text-xs font-bold text-bark ml-1.5 uppercase tracking-wider">
                Customer View Preview
              </Text>
            </View>
            <Text className="text-xs text-bark/60 mb-3">
              This is how your rate card appears inside the customer app when users check nearest scrap dealers:
            </Text>

            <View className="flex-row flex-wrap gap-1.5">
              {SCRAP_PRICE_CATALOG.map((item) => (
                <View
                  key={item.key}
                  className="bg-paper rounded-full px-2.5 py-1 border border-line flex-row items-center"
                >
                  <Text className="text-xs text-bark/80 capitalize mr-1">{item.nameEn}:</Text>
                  <Text className="text-xs font-bold text-leaf">
                    ₹{editingRates[item.key] ?? item.defaultBuyRate}/kg
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* ========================================================
          TAB 3: ITEM-WISE WASTE LEDGER (हर PRODUCT का अलग RECORD)
         ======================================================== */}
      {activeTab === "ledger" && (
        <ScrollView
          style={{ flex: 1 }}
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        >
          {/* Summary Metric Cards */}
          <View className="flex-row mb-2.5">
            <View className="flex-1 bg-leaf rounded-card p-3.5 mr-1.5">
              <Text className="text-white/80 text-xs">{t("kabadiwalaDashboard.totalInflow")}</Text>
              <Text className="text-white text-lg font-black mt-0.5">
                {Number(ledger?.totalIntakeKg ?? 0).toFixed(1)} kg
              </Text>
              <Text className="text-white/80 text-xs mt-0.5">
                Paid: ₹{Number(ledger?.totalIntakeSpent ?? 0).toFixed(0)}
              </Text>
            </View>
            <View className="flex-1 bg-clay rounded-card p-3.5 ml-1.5">
              <Text className="text-white/80 text-xs">{t("kabadiwalaDashboard.totalOutflow")}</Text>
              <Text className="text-white text-lg font-black mt-0.5">
                {Number(ledger?.totalOutgoingKg ?? 0).toFixed(1)} kg
              </Text>
              <Text className="text-white/80 text-xs mt-0.5">
                Earned: ₹{Number(ledger?.totalOutgoingEarned ?? 0).toFixed(0)}
              </Text>
            </View>
          </View>

          {/* Business Inventory & Net Margin Banner */}
          <View className="bg-sand border-2 border-leaf/30 rounded-card p-4 mb-3.5">
            <View className="flex-row justify-between items-start mb-2">
              <View>
                <Text className="text-xs font-bold text-bark/60 uppercase tracking-wider">
                  {t("kabadiwalaDashboard.stockInHand")}
                </Text>
                <Text className="text-2xl font-black text-bark mt-0.5">
                  {Number(ledger?.stockBalanceKg ?? 0).toFixed(1)} kg held
                </Text>
              </View>
              <View className="items-end bg-leafLight px-3 py-1.5 rounded-xl border border-leaf/30">
                <Text className="text-[11px] font-bold text-leaf uppercase">{t("kabadiwalaDashboard.projectedMargin")}</Text>
                <Text className="text-base font-black text-leaf mt-0.5">
                  +₹{Number(ledger?.totalProjectedProfit ?? 0).toFixed(0)}
                </Text>
              </View>
            </View>

            <View className="pt-2 border-t border-line/60 flex-row justify-between items-center">
              <Text className="text-xs text-bark/70">
                {t("kabadiwalaDashboard.expectedResale")}{" "}
                <Text className="font-bold text-bark">
                  ₹{Number(ledger?.totalExpectedOfficerPayout ?? 0).toFixed(0)}
                </Text>
              </Text>
            </View>
          </View>

          {/* Quick Actions Row */}
          <View className="flex-row gap-2 mb-4">
            <Pressable
              onPress={() => setDirectIntakeOpen(true)}
              className="flex-1 py-3 px-3 bg-leafLight border border-leaf/30 rounded-xl flex-row items-center justify-center"
            >
              <MaterialCommunityIcons name="plus-circle" size={18} color={theme.leaf} />
              <Text className="text-xs font-bold text-leaf ml-1.5">+ Record Intake</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(kabadiwala)/sell-to-officer")}
              className="flex-1 py-3 px-3 bg-clay rounded-xl flex-row items-center justify-center"
            >
              <MaterialCommunityIcons name="truck-fast-outline" size={18} color="#fff" />
              <Text className="text-white font-bold text-xs ml-1.5">Handover to Officer</Text>
            </Pressable>
          </View>

          {/* Ledger Subtabs */}
          <View className="flex-row mb-3 bg-sand rounded-xl p-1 border border-line">
            <Pressable
              onPress={() => setLedgerSubTab("breakdown")}
              className={`flex-1 py-2 rounded-lg items-center ${
                ledgerSubTab === "breakdown" ? "bg-white shadow-sm border border-line/40" : ""
              }`}
            >
              <Text className={`font-bold text-xs ${ledgerSubTab === "breakdown" ? "text-leaf" : "text-bark/60"}`}>
                Item Analysis 📋
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLedgerSubTab("intake")}
              className={`flex-1 py-2 rounded-lg items-center ${
                ledgerSubTab === "intake" ? "bg-white shadow-sm border border-line/40" : ""
              }`}
            >
              <Text className={`font-bold text-xs ${ledgerSubTab === "intake" ? "text-bark" : "text-bark/60"}`}>
                Intake ({ledger?.intakeRows?.length ?? 0})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLedgerSubTab("outgoing")}
              className={`flex-1 py-2 rounded-lg items-center ${
                ledgerSubTab === "outgoing" ? "bg-white shadow-sm border border-line/40" : ""
              }`}
            >
              <Text className={`font-bold text-xs ${ledgerSubTab === "outgoing" ? "text-bark" : "text-bark/60"}`}>
                Handovers ({ledger?.outgoingRows?.length ?? 0})
              </Text>
            </Pressable>
          </View>

          {/* SUB-VIEW 1: DETAILED PRODUCT BREAKDOWN (हर PRODUCT का अलग RECORD) */}
          {ledgerSubTab === "breakdown" && (
            <View className="gap-2.5">
              <Text className="text-xs font-bold text-bark/60 uppercase tracking-wider mb-1">
                Item-by-Item Garbage Inventory & Expected Payout:
              </Text>

              {(!ledger?.categoryBreakdown || ledger.categoryBreakdown.length === 0) ? (
                <View className="bg-sand rounded-card p-6 items-center border border-line">
                  <Text className="text-xs text-bark/60">No scrap inventory recorded yet.</Text>
                </View>
              ) : (
                ledger.categoryBreakdown.map((cat: any) => (
                  <View
                    key={cat.key}
                    className="bg-sand border border-line rounded-card p-3.5"
                  >
                    <View className="flex-row items-center justify-between mb-2 pb-2 border-b border-line/40">
                      <View className="flex-row items-center flex-1">
                        <View className="w-8 h-8 rounded-full bg-leafLight items-center justify-center mr-2.5 border border-leaf/20">
                          <MaterialCommunityIcons name={cat.icon as any} size={18} color={theme.leaf} />
                        </View>
                        <View>
                          <Text className="font-extrabold text-bark text-sm">
                            {cat.nameEn} ({cat.nameHi})
                          </Text>
                          <Text className="text-[11px] text-bark/60">
                            Current Stock:{" "}
                            <Text className="font-bold text-bark">{Number(cat.stockKg).toFixed(1)} kg</Text>
                          </Text>
                        </View>
                      </View>

                      <View className="items-end">
                        <View className="px-2 py-0.5 rounded-md bg-leafLight border border-leaf/30">
                          <Text className="text-[11px] font-bold text-leaf">
                            +₹{Number(cat.expectedProfit).toFixed(0)} margin
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Numerical Breakdown Columns */}
                    <View className="flex-row justify-between bg-paper/80 rounded-xl p-2.5 border border-line/50">
                      <View className="flex-1">
                        <Text className="text-[10px] text-bark/50 uppercase font-semibold">
                          Paid to Customer
                        </Text>
                        <Text className="text-xs font-bold text-bark mt-0.5">
                          ₹{Number(cat.spent).toFixed(0)}
                        </Text>
                        <Text className="text-[10px] text-bark/60">
                          (₹{Number(cat.avgBuyRate).toFixed(0)}/kg avg)
                        </Text>
                      </View>

                      <View className="flex-1 items-center">
                        <Text className="text-[10px] text-bark/50 uppercase font-semibold">
                          Officer Resale
                        </Text>
                        <Text className="text-xs font-bold text-leaf mt-0.5">
                          ₹{Number(cat.expectedOfficerRate).toFixed(0)}/kg
                        </Text>
                        <Text className="text-[10px] text-bark/60">benchmark</Text>
                      </View>

                      <View className="flex-1 items-end">
                        <Text className="text-[10px] text-bark/50 uppercase font-semibold">
                          Expected Payout
                        </Text>
                        <Text className="text-xs font-black text-clay mt-0.5">
                          ₹{Number(cat.expectedOfficerPayout).toFixed(0)}
                        </Text>
                        <Text className="text-[10px] text-bark/60">from officer</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* SUB-VIEW 2: INTAKE TRANSACTIONS */}
          {ledgerSubTab === "intake" && (
            !ledger?.intakeRows || ledger.intakeRows.length === 0 ? (
              <View className="bg-sand rounded-card p-6 items-center border border-line">
                <Text className="text-xs text-bark/60">No customer intake transactions logged yet.</Text>
              </View>
            ) : (
              ledger.intakeRows.map((row: any) => (
                <View key={row.id} className="bg-sand border border-line rounded-card p-3.5 mb-2.5">
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="font-bold text-bark capitalize">{row.material_category ?? "Scrap"}</Text>
                      <Text className="text-xs text-bark/60 mt-0.5">
                        From: {row.counterpart?.name ?? (row.notes?.includes("Walk-in") ? row.notes : "Customer")} • {new Date(row.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="font-bold text-leaf">₹{Number(row.price ?? 0).toFixed(0)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-line/40">
                    <Text className="text-xs font-semibold text-bark">{Number(row.quantity ?? 0)} kg</Text>
                    <View className="px-2 py-0.5 bg-paper rounded border border-line">
                      <Text className="text-xs text-bark/70">{row.quality ?? "Grade A"}</Text>
                    </View>
                  </View>
                </View>
              ))
            )
          )}

          {/* SUB-VIEW 3: OUTGOING HANDOVERS TO OFFICERS */}
          {ledgerSubTab === "outgoing" && (
            !ledger?.outgoingRows || ledger.outgoingRows.length === 0 ? (
              <View className="bg-sand rounded-card p-6 items-center border border-line">
                <Text className="text-xs text-bark/60">No handovers to officers recorded yet.</Text>
              </View>
            ) : (
              ledger.outgoingRows.map((row: any) => (
                <View key={row.id} className="bg-sand border border-line rounded-card p-3.5 mb-2.5">
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="font-bold text-bark capitalize">{row.material_category ?? "Scrap"}</Text>
                      <Text className="text-xs text-bark/60 mt-0.5">
                        To: {row.counterpart?.name ?? "Municipal Officer"} • {new Date(row.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="font-bold text-clay">₹{Number(row.price ?? 0).toFixed(0)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-line/40">
                    <Text className="text-xs font-semibold text-bark">{Number(row.quantity ?? 0)} kg</Text>
                    <View className="px-2 py-0.5 bg-paper rounded border border-line">
                      <Text className="text-xs text-bark/70">{row.quality ?? "Grade A"}</Text>
                    </View>
                  </View>
                </View>
              ))
            )
          )}
        </ScrollView>
      )}

      {/* MARK COLLECTED & QUALITY MODAL */}
      <Modal visible={!!collectingBooking} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-paper rounded-t-3xl p-5">
            <View className="flex-row justify-between items-center pb-3 border-b border-line mb-4">
              <Text className="text-lg font-bold text-bark">Record Scrap Intake</Text>
              <Pressable onPress={() => setCollectingBooking(null)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.bark} />
              </Pressable>
            </View>

            <Text className="text-xs font-semibold text-bark mb-1.5">Measured Weight / Quantity (kg)</Text>
            <TextInput
              value={collectWeight}
              onChangeText={(v) => setCollectWeight(v.replace(/[^0-9.]/g, ""))}
              placeholder="0.0 kg"
              keyboardType="decimal-pad"
              className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            />

            <Text className="text-xs font-semibold text-bark mb-1.5">Agreed Price Paid (₹)</Text>
            <TextInput
              value={collectPrice}
              onChangeText={(v) => setCollectPrice(v.replace(/[^0-9.]/g, ""))}
              placeholder="₹ 0"
              keyboardType="decimal-pad"
              className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            />

            <Text className="text-xs font-semibold text-bark mb-2">Scrap Quality Inspection</Text>
            <View className="gap-2 mb-5">
              {QUALITY_GRADES.map((q) => {
                const label = q.id === "grade_a" ? "Grade A (Clean & Segregated)" : q.id === "grade_b" ? "Grade B (Semi-sorted)" : "Grade C (Mixed / Wet)";
                const isSelected = collectQuality.startsWith(q.id === "grade_a" ? "Grade A" : q.id === "grade_b" ? "Grade B" : "Grade C");
                return (
                  <Pressable
                    key={q.id}
                    onPress={() => setCollectQuality(label)}
                    className={`p-3 rounded-card border flex-row items-center justify-between ${
                      isSelected ? "bg-leafLight border-leaf" : "bg-sand border-line"
                    }`}
                  >
                    <Text className={`font-semibold text-xs ${isSelected ? "text-leaf" : "text-bark"}`}>
                      {label}
                    </Text>
                    <MaterialCommunityIcons
                      name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                      size={20}
                      color={isSelected ? theme.leaf : theme.line}
                    />
                  </Pressable>
                );
              })}
            </View>

            <PrimaryButton
              label="Save to Waste Ledger"
              onPress={submitCollection}
              loading={submittingCollection}
            />
          </View>
        </View>
      </Modal>

      {/* ========================================================
          MODAL: DIRECT SCRAP INTAKE / PURCHASE (डायरेक्ट खरीद)
         ======================================================== */}
      <Modal visible={directIntakeOpen} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-paper rounded-t-3xl max-h-[90%] p-5">
            <View className="flex-row justify-between items-center pb-3 border-b border-line mb-3">
              <View>
                <Text className="text-lg font-black text-bark">Record Direct Scrap Intake</Text>
                <Text className="text-xs text-bark/60">Log direct scrap bought from customers</Text>
              </View>
              <Pressable onPress={() => setDirectIntakeOpen(false)} className="p-1">
                <MaterialCommunityIcons name="close" size={24} color={theme.bark} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-2">
              {/* Material Type Selector */}
              <Text className="text-xs font-bold text-bark mb-1.5 uppercase tracking-wider">
                Select Scrap Material *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
                {SCRAP_PRICE_CATALOG.map((item) => {
                  const isSelected = directCategory === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => handleDirectCategoryChange(item.key)}
                      className={`px-3 py-2 rounded-xl mr-2 border flex-row items-center ${
                        isSelected ? "bg-leafLight border-leaf" : "bg-sand border-line"
                      }`}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={16}
                        color={isSelected ? theme.leaf : theme.bark}
                      />
                      <Text
                        className={`text-xs font-bold ml-1.5 ${
                          isSelected ? "text-leaf" : "text-bark"
                        }`}
                      >
                        {item.nameEn}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Measured Weight */}
              <Text className="text-xs font-semibold text-bark mb-1">Measured Weight / Quantity (kg) *</Text>
              <TextInput
                value={directWeight}
                onChangeText={handleDirectWeightChange}
                placeholder="e.g. 15.5 kg"
                keyboardType="decimal-pad"
                className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark font-bold"
                placeholderTextColor="#8a7d68"
              />

              {/* Price Paid to Customer */}
              <Text className="text-xs font-semibold text-bark mb-1">
                Total Price Paid to Customer (₹) *
              </Text>
              <TextInput
                value={directPrice}
                onChangeText={(v) => setDirectPrice(v.replace(/[^0-9.]/g, ""))}
                placeholder="₹ 0"
                keyboardType="decimal-pad"
                className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark font-bold"
                placeholderTextColor="#8a7d68"
              />

              {/* Expected Officer Resale Rate */}
              <Text className="text-xs font-semibold text-bark mb-1">
                Expected Selling Rate to Officer / Recycler (₹/kg)
              </Text>
              <TextInput
                value={directExpectedRate}
                onChangeText={(v) => setDirectExpectedRate(v.replace(/[^0-9.]/g, ""))}
                placeholder="e.g. 750"
                keyboardType="decimal-pad"
                className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
                placeholderTextColor="#8a7d68"
              />

              {/* Live Profit Preview Box */}
              {Number(directWeight) > 0 && Number(directPrice) > 0 && (
                <View className="bg-leafLight/80 border border-leaf/40 rounded-card p-3 mb-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs font-semibold text-bark/70">Expected Officer Payout:</Text>
                    <Text className="text-xs font-bold text-bark">
                      ₹{Math.round(Number(directWeight) * Number(directExpectedRate))}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-1 pt-1 border-t border-leaf/20">
                    <Text className="text-xs font-bold text-leaf">Projected Net Margin / Profit:</Text>
                    <Text className="text-sm font-black text-leaf">
                      +₹{Math.round(Number(directWeight) * Number(directExpectedRate) - Number(directPrice))}
                    </Text>
                  </View>
                </View>
              )}

              {/* Customer Name / Walk-in */}
              <Text className="text-xs font-semibold text-bark mb-1">Customer / Source Note (Optional)</Text>
              <TextInput
                value={directCustomerName}
                onChangeText={setDirectCustomerName}
                placeholder="e.g. Walk-in customer / Sector 4 shop"
                className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
                placeholderTextColor="#8a7d68"
              />

              {/* Scrap Quality Inspection */}
              <Text className="text-xs font-semibold text-bark mb-2">Scrap Quality Inspection</Text>
              <View className="gap-2 mb-4">
                {QUALITY_GRADES.map((q) => {
                  const label =
                    q.id === "grade_a"
                      ? "Grade A (Clean & Segregated)"
                      : q.id === "grade_b"
                      ? "Grade B (Semi-sorted)"
                      : "Grade C (Mixed / Wet)";
                  const isSelected = directQuality.startsWith(
                    q.id === "grade_a" ? "Grade A" : q.id === "grade_b" ? "Grade B" : "Grade C"
                  );
                  return (
                    <Pressable
                      key={q.id}
                      onPress={() => setDirectQuality(label)}
                      className={`p-3 rounded-card border flex-row items-center justify-between ${
                        isSelected ? "bg-leafLight border-leaf" : "bg-sand border-line"
                      }`}
                    >
                      <Text className={`font-semibold text-xs ${isSelected ? "text-leaf" : "text-bark"}`}>
                        {label}
                      </Text>
                      <MaterialCommunityIcons
                        name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                        size={20}
                        color={isSelected ? theme.leaf : theme.line}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <PrimaryButton
              label="Save to Waste Ledger"
              onPress={submitDirectIntake}
              loading={submittingDirect}
            />
          </View>
        </View>
      </Modal>

      {/* ================= MUNICIPAL NOTICE DETAIL & ACKNOWLEDGE MODAL ================= */}
      <Modal
        visible={!!selectedNoticeForModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedNoticeForModal(null)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-sand rounded-t-3xl p-5 max-h-[85%] border-t border-line">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="gavel" size={24} color={theme.clay} />
                <Text className="text-base font-black text-bark ml-2">
                  Municipal Legal Notice
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedNoticeForModal(null)}
                className="w-8 h-8 rounded-full bg-white items-center justify-center border border-line"
              >
                <MaterialCommunityIcons name="close" size={18} color={theme.bark} />
              </Pressable>
            </View>

            {selectedNoticeForModal && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="bg-white border-2 border-clay/40 rounded-card p-4 mb-4">
                  <View className="flex-row items-center justify-between pb-2 mb-2 border-b border-line/50">
                    <Text className="text-xs font-bold text-clay uppercase tracking-wider">
                      OFFICIAL SWM COMPLIANCE ORDER
                    </Text>
                    <Text className="text-[11px] text-bark/60">
                      {new Date(selectedNoticeForModal.issued_at).toLocaleDateString()}
                    </Text>
                  </View>

                  <Text className="text-sm font-bold text-bark mb-1">
                    {selectedNoticeForModal.subject}
                  </Text>
                  <Text className="text-xs text-bark/70 mb-3">
                    Issued by: {selectedNoticeForModal.officer_name} • {selectedNoticeForModal.officer_department}
                  </Text>

                  <View className="bg-sand/70 p-3 rounded-xl border border-line/60 mb-3">
                    <Text className="text-xs text-bark font-medium leading-5">
                      {selectedNoticeForModal.message}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center py-2 border-t border-line/40">
                    <Text className="text-xs text-bark/70">Required Stock Handover:</Text>
                    <Text className="text-sm font-black text-clay">
                      {selectedNoticeForModal.stock_held_kg} kg
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center py-1">
                    <Text className="text-xs text-bark/70">Days Overdue:</Text>
                    <Text className="text-xs font-bold text-clay">
                      {selectedNoticeForModal.days_overdue} days
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="gap-2.5 mb-2">
                  <Pressable
                    onPress={() => {
                      setSelectedNoticeForModal(null);
                      router.push("/(kabadiwala)/sell-to-officer");
                    }}
                    className="py-3 bg-leaf rounded-xl items-center justify-center shadow-sm"
                  >
                    <Text className="text-white font-black text-sm">
                      🚚 Handover Stock to Officer Now
                    </Text>
                  </Pressable>

                  {selectedNoticeForModal.status === "pending" && (
                    <Pressable
                      onPress={() => handleAcknowledgeNotice(selectedNoticeForModal.id)}
                      className="py-3 bg-sand border border-line rounded-xl items-center justify-center"
                    >
                      <Text className="text-bark font-bold text-xs">
                        ✍️ Acknowledge Order (आदेश स्वीकार करें)
                      </Text>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= SHOP & CONTACT PROFILE EDIT MODAL ================= */}
      <Modal
        visible={shopModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShopModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-sand rounded-t-3xl p-5 max-h-[85%] border-t border-line">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="storefront" size={24} color={theme.leaf} />
                <Text className="text-base font-black text-bark ml-2">
                  Edit Scrap Shop & Contact
                </Text>
              </View>
              <Pressable
                onPress={() => setShopModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white items-center justify-center border border-line"
              >
                <MaterialCommunityIcons name="close" size={18} color={theme.bark} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1">
                Shop / Scrap Center Name *
              </Text>
              <TextInput
                value={editShopName}
                onChangeText={setEditShopName}
                placeholder="e.g. Ramesh Scrap Yard"
                className="bg-white border border-line rounded-xl px-4 py-3 mb-3 text-sm text-bark font-semibold"
                placeholderTextColor="#8a7d68"
              />

              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1">
                Primary Contact Phone *
              </Text>
              <TextInput
                value={editShopPhone}
                onChangeText={setEditShopPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit phone number"
                className="bg-white border border-line rounded-xl px-4 py-3 mb-3 text-sm text-bark"
                placeholderTextColor="#8a7d68"
              />

              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1">
                WhatsApp Business Number
              </Text>
              <TextInput
                value={editShopWhatsapp}
                onChangeText={setEditShopWhatsapp}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit WhatsApp number"
                className="bg-white border border-line rounded-xl px-4 py-3 mb-3 text-sm text-bark"
                placeholderTextColor="#8a7d68"
              />

              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1">
                Shop / Yard Physical Address
              </Text>
              <TextInput
                value={editShopAddress}
                onChangeText={setEditShopAddress}
                placeholder="Plot / Shop number, Mandi road, Zone"
                className="bg-white border border-line rounded-xl px-4 py-3 mb-4 text-sm text-bark"
                placeholderTextColor="#8a7d68"
              />

              <PrimaryButton
                label="Save Shop & Contact Details"
                onPress={handleSaveShopProfile}
                loading={savingShopProfile}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= SHOP PHOTO SELECTION MODAL ================= */}
      <Modal
        visible={photoModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPhotoModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-sand rounded-t-3xl p-5 max-h-[85%] border-t border-line">
            <View className="flex-row items-center justify-between pb-3 border-b border-line mb-3">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="camera-enhance" size={24} color={theme.leaf} />
                <View className="ml-2">
                  <Text className="text-base font-black text-bark">
                    Scrap Shop Photo (दुकान की फोटो)
                  </Text>
                  <Text className="text-xs text-bark/60">
                    Add or update your scrap center photo
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => setPhotoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white items-center justify-center border border-line"
              >
                <MaterialCommunityIcons name="close" size={18} color={theme.bark} />
              </Pressable>
            </View>

            {/* Current photo preview */}
            <View className="items-center mb-4">
              {profile?.shop_photo_url ? (
                <View className="w-full h-40 rounded-2xl overflow-hidden border border-line shadow-xs mb-2">
                  <Image
                    source={{ uri: profile.shop_photo_url }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              ) : (
                <View className="w-full h-32 rounded-2xl bg-leaf/10 border-2 border-dashed border-leaf/30 items-center justify-center mb-2">
                  <MaterialCommunityIcons name="storefront" size={38} color={theme.leaf} />
                  <Text className="text-xs font-bold text-bark mt-2">
                    No Shop Photo Uploaded Yet
                  </Text>
                  <Text className="text-[11px] text-bark/60">
                    Add a photo so customers can recognize your scrap shop
                  </Text>
                </View>
              )}
            </View>

            {/* Action options */}
            <View className="gap-2.5 mb-3">
              <Pressable
                onPress={handleTakeShopPhoto}
                className="bg-leaf rounded-2xl p-3.5 flex-row items-center shadow-xs"
              >
                <View className="w-9 h-9 rounded-full bg-white/20 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-black text-sm">
                    Take Photo with Camera
                  </Text>
                  <Text className="text-white/80 text-xs">कैमरा से दुकान की फोटो खींचें</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#FFF" />
              </Pressable>

              <Pressable
                onPress={handlePickShopPhoto}
                className="bg-white border border-line rounded-2xl p-3.5 flex-row items-center shadow-xs"
              >
                <View className="w-9 h-9 rounded-full bg-sand items-center justify-center mr-3 border border-line">
                  <MaterialCommunityIcons name="image-multiple" size={20} color={theme.leaf} />
                </View>
                <View className="flex-1">
                  <Text className="text-bark font-black text-sm">
                    Choose from Gallery
                  </Text>
                  <Text className="text-bark/60 text-xs">फोन की गैलरी से फोटो अपलोड करें</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.bark} />
              </Pressable>

              <Pressable
                onPress={handleUseSamplePhoto}
                className="bg-sand border border-line rounded-2xl p-3 flex-row items-center"
              >
                <View className="w-8 h-8 rounded-full bg-paper items-center justify-center mr-3 border border-line">
                  <MaterialCommunityIcons name="store-check" size={18} color={theme.bark} />
                </View>
                <View className="flex-1">
                  <Text className="text-bark font-bold text-xs">
                    Use Sample Scrap Center Photo
                  </Text>
                  <Text className="text-bark/60 text-[10px]">नमूना दुकान फोटो इस्तेमाल करें</Text>
                </View>
              </Pressable>

              {profile?.shop_photo_url && (
                <Pressable
                  onPress={handleRemoveShopPhoto}
                  className="bg-danger/10 border border-danger/30 rounded-2xl p-2.5 flex-row items-center justify-center"
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.danger} />
                  <Text className="text-danger font-bold text-xs ml-1.5">
                    Remove Shop Photo (फोटो हटाएं)
                  </Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={() => setPhotoModalOpen(false)}
              className="py-3 bg-paper border border-line rounded-xl items-center"
            >
              <Text className="text-bark font-bold text-xs">Cancel (रद्द करें)</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Universal Settings & Permissions Modal */}
      <AppSettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ScreenContainer>
  );
}
