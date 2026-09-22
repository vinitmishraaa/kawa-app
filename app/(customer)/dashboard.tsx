import { useCallback, useState, useEffect, useRef } from "react";
import {
  FlatList,
  Text,
  View,
  Pressable,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  Linking,
  ScrollView,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ListingCard } from "../../components/ListingCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuthStore } from "../../store/authStore";
import { getMyListings, type ScrapListing } from "../../services/queries/listings";
import { getBookingsForCustomer, type Booking } from "../../services/queries/bookings";
import { signOut } from "../../services/auth";
import { supabase } from "../../services/supabase";
import { AppSettingsModal } from "../../components/AppSettingsModal";
import { theme } from "../../constants/theme";

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [activeTab, setActiveTab] = useState<"bookings" | "listings">("bookings");
  const [listings, setListings] = useState<ScrapListing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Customer Contact Profile Edit State
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editName, setEditName] = useState(profile?.name ?? "");
  const [editPhone, setEditPhone] = useState(profile?.phone ?? "");
  const [editWhatsapp, setEditWhatsapp] = useState(profile?.whatsapp ?? profile?.phone ?? "");
  const [editAddress, setEditAddress] = useState(profile?.address ?? "");
  const [savingContact, setSavingContact] = useState(false);

  // Keep local inputs in sync when profile updates
  useEffect(() => {
    if (profile) {
      setEditName(profile.name ?? "");
      setEditPhone(profile.phone ?? "");
      setEditWhatsapp(profile.whatsapp ?? profile.phone ?? "");
      setEditAddress(profile.address ?? "");
    }
  }, [profile]);

  const loadRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const load = useCallback(async () => {
    if (!profile?.id) return;
    try {
      const [listingsData, bookingsData] = await Promise.all([
        getMyListings(profile.id).catch(() => []),
        getBookingsForCustomer(profile.id).catch(() => []),
      ]);
      setListings(listingsData ?? []);
      setBookings((bookingsData as any) ?? []);
    } catch {
      // Keep existing states on transient errors
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
      .channel(`customer_${profile.id}_realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          loadRef.current();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scrap_listings" },
        () => {
          loadRef.current();
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
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await signOut();
    reset();
    router.replace("/(auth)/role-select");
  }

  async function handleSaveContact() {
    if (!editPhone.trim()) {
      Alert.alert("Phone Required", "Please enter a valid phone number for pickup coordination.");
      return;
    }
    setSavingContact(true);
    try {
      await updateProfile({
        name: editName.trim() || undefined,
        phone: editPhone.trim(),
        whatsapp: editWhatsapp.trim() || editPhone.trim(),
        address: editAddress.trim() || undefined,
      });
      Alert.alert("Contact Details Updated! ✅", "Your phone number and pickup address have been saved.");
      setContactModalOpen(false);
    } catch (err: any) {
      Alert.alert("Update Error", err?.message ?? "Could not update contact details.");
    } finally {
      setSavingContact(false);
    }
  }

  function handleCallKabadiwala(phone?: string) {
    if (!phone) {
      Alert.alert("Phone Unavailable", "Collector's phone number is not available yet.");
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert("Call Unavailable", `Phone dialer could not be launched for ${phone}`);
    });
  }

  function handleWhatsAppKabadiwala(phone?: string, name?: string) {
    if (!phone) {
      Alert.alert("WhatsApp Unavailable", "Collector contact number is not available yet.");
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const formatted = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(
      `Namaste ${name || "Scrap Collector"}, I have a scheduled scrap pickup request on KAWA app.`
    )}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp Unavailable", "Could not launch WhatsApp.");
    });
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "requested":
        return { label: t("customerDashboard.statusRequested"), bg: "bg-warn/20", text: "text-warn" };
      case "accepted":
        return { label: t("customerDashboard.statusAccepted"), bg: "bg-leaf/20", text: "text-leaf" };
      case "in_progress":
        return { label: t("customerDashboard.statusOnTheWay"), bg: "bg-clay/20", text: "text-clay" };
      case "collected":
        return { label: t("customerDashboard.statusCollected"), bg: "bg-ok/20", text: "text-ok" };
      default:
        return { label: status, bg: "bg-sand", text: "text-bark" };
    }
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-3 mb-2">
        <View>
          <Text className="text-2xl font-bold text-bark">{t("customerDashboard.welcomeBack")}</Text>
          <Text className="text-sm font-semibold text-leaf">{profile?.name ?? t("roleSelect.customer")}</Text>
        </View>
        <View className="flex-row items-center">
          <Pressable onPress={() => setSettingsOpen(true)} className="mr-2 p-2 bg-sand rounded-full border border-line">
            <MaterialCommunityIcons name="cog" size={20} color={theme.bark} />
          </Pressable>
          <Pressable onPress={handleLogout} className="p-2 bg-sand rounded-full border border-line">
            <MaterialCommunityIcons name="logout" size={20} color={theme.bark} />
          </Pressable>
        </View>
      </View>

      {/* Customer Contact & Pickup Address Quick Banner */}
      <View className="bg-sand border border-line rounded-card p-3 mb-3 flex-row items-center justify-between">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="phone-outline" size={14} color={theme.leaf} />
            <Text className="text-xs font-bold text-bark ml-1" numberOfLines={1}>
              {profile?.phone ? `📞 ${profile.phone}` : "No phone number saved"}
              {profile?.whatsapp ? ` • 💬 WhatsApp` : ""}
            </Text>
          </View>
          <View className="flex-row items-center mt-0.5">
            <MaterialCommunityIcons name="map-marker-outline" size={14} color={theme.clay} />
            <Text className="text-[11px] text-bark/70 ml-1" numberOfLines={1}>
              {profile?.address ? profile.address : "Set your default pickup address"}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={() => setContactModalOpen(true)}
          className="py-1.5 px-3 bg-white border border-line rounded-xl flex-row items-center shadow-xs"
        >
          <MaterialCommunityIcons name="pencil-outline" size={13} color={theme.bark} />
          <Text className="text-xs font-bold text-bark ml-1">Edit</Text>
        </Pressable>
      </View>

      {/* Hero Action Card: Book Nearest Kabadiwala */}
      <View className="bg-leaf rounded-card p-4 mb-3 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-white font-extrabold text-lg">{t("customerDashboard.sellScrapHeroTitle")}</Text>
            <Text className="text-white/80 text-xs mt-0.5">
              {t("customerDashboard.sellScrapHeroSubtitle")}
            </Text>
          </View>
          <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center">
            <MaterialCommunityIcons name="truck-fast-outline" size={24} color="#fff" />
          </View>
        </View>
        <View className="flex-row mt-3 gap-2">
          <Pressable
            onPress={() => router.push("/(customer)/book-pickup")}
            className="flex-1 py-2 px-3 bg-white rounded-xl items-center shadow-xs"
          >
            <Text className="text-leaf font-bold text-xs">{t("customerDashboard.bookNearestBtn")}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(customer)/add-scrap")}
            className="py-2 px-3 bg-white/20 rounded-xl items-center"
          >
            <Text className="text-white font-bold text-xs">{t("customerDashboard.addListingBtn")}</Text>
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row mb-3 bg-sand rounded-xl p-1 border border-line">
        <Pressable
          onPress={() => setActiveTab("bookings")}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === "bookings" ? "bg-white shadow-sm" : ""
          }`}
        >
          <Text className={`font-bold text-xs ${activeTab === "bookings" ? "text-bark" : "text-bark/60"}`}>
            {t("customerDashboard.myBookingsTab")} ({bookings?.length ?? 0})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("listings")}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === "listings" ? "bg-white shadow-sm" : ""
          }`}
        >
          <Text className={`font-bold text-xs ${activeTab === "listings" ? "text-bark" : "text-bark/60"}`}>
            {t("customerDashboard.myScrapTab")} ({listings?.length ?? 0})
          </Text>
        </Pressable>
      </View>

      {/* TAB CONTENT */}
      {activeTab === "bookings" ? (
        bookings.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <MaterialCommunityIcons name="calendar-clock-outline" size={48} color={theme.line} />
            <Text className="text-bark/70 font-bold text-center mt-3">{t("customerDashboard.noBookings")}</Text>
            <Text className="text-bark/50 text-xs text-center mt-1 mb-4">{t("customerDashboard.noBookingsSub")}</Text>
            <PrimaryButton
              label={t("customerDashboard.bookNearestBtn")}
              onPress={() => router.push("/(customer)/book-pickup")}
            />
          </View>
        ) : (
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            renderItem={({ item }) => {
              const badge = getStatusBadge(item.status);
              const itemsList = item.items ?? [];
              const kabadiwala = item.kabadiwala;

              return (
                <Pressable
                  onPress={() => {
                    if (item.listing_id) {
                      router.push(`/(customer)/booking/${item.listing_id}`);
                    }
                  }}
                  className="bg-sand border border-line rounded-card p-4 mb-3"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="clock-outline" size={16} color={theme.leaf} />
                      <Text className="text-xs font-semibold text-bark ml-1.5">
                        {item.time_slot ?? "Flexible Time Slot"}
                      </Text>
                    </View>
                    <View className={`px-2.5 py-0.5 rounded-full ${badge.bg}`}>
                      <Text className={`text-xs font-bold uppercase ${badge.text}`}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  <View className="py-2 border-t border-b border-line/40 my-1">
                    {itemsList.length > 0 ? (
                      <Text className="font-semibold text-bark text-sm">
                        {itemsList.map((it) => `${it.category} (${it.quantity}${it.unit || "kg"})`).join(", ")}
                      </Text>
                    ) : item.scrap_listings ? (
                      <Text className="font-semibold text-bark text-sm">
                        {item.scrap_listings.category} ({item.scrap_listings.quantity} {item.scrap_listings.unit})
                      </Text>
                    ) : (
                      <Text className="font-semibold text-bark text-sm">Scrap Pickup</Text>
                    )}

                    {item.pickup_address && (
                      <Text className="text-xs text-bark/60 mt-1" numberOfLines={1}>
                        📍 {item.pickup_address}
                      </Text>
                    )}
                  </View>

                  {/* Assigned Collector Details & 1-Tap Direct Call / WhatsApp */}
                  {kabadiwala && (
                    <View className="bg-white rounded-xl p-2.5 my-1.5 border border-line/50 flex-row items-center justify-between">
                      <View className="flex-1 mr-2">
                        <Text className="text-xs font-bold text-bark" numberOfLines={1}>
                          🚚 {kabadiwala.name || kabadiwala.shop_name || "Scrap Collector"}
                        </Text>
                        <Text className="text-[10px] text-bark/60">
                          {kabadiwala.phone ? `📞 ${kabadiwala.phone}` : "Collector on route"}
                        </Text>
                      </View>
                      <View className="flex-row gap-1.5">
                        <Pressable
                          onPress={() => handleCallKabadiwala(kabadiwala.phone)}
                          className="px-2.5 py-1.5 bg-sand border border-line rounded-lg flex-row items-center"
                          accessibilityLabel="Call Collector"
                        >
                          <MaterialCommunityIcons name="phone" size={13} color={theme.bark} />
                          <Text className="text-xs font-bold text-bark ml-1">Call</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleWhatsAppKabadiwala(kabadiwala.whatsapp || kabadiwala.phone, kabadiwala.name)}
                          className="px-2.5 py-1.5 bg-leafLight border border-leaf/40 rounded-lg flex-row items-center"
                          accessibilityLabel="WhatsApp Collector"
                        >
                          <MaterialCommunityIcons name="whatsapp" size={13} color={theme.leaf} />
                          <Text className="text-xs font-bold text-leaf ml-1">WhatsApp</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-xs text-bark/60">
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                    {item.price_agreed != null ? (
                      <Text className="font-bold text-leaf text-sm">₹{item.price_agreed}</Text>
                    ) : (
                      <Text className="text-xs text-bark/50">Price upon collection</Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        )
      ) : listings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons name="package-variant" size={48} color={theme.line} />
          <Text className="text-bark/60 text-center mt-3 mb-4">{t("customerDashboard.noListings")}</Text>
          <PrimaryButton label={t("customerDashboard.addScrap")} onPress={() => router.push("/(customer)/add-scrap")} />
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          renderItem={({ item }) => (
            <ListingCard
              photoUrl={item.photos?.[0]}
              categoryId={item.category}
              quantity={item.quantity}
              unit={item.unit ?? undefined}
              status={item.status}
              onPress={() => {
                if (item.status !== "available") {
                  router.push(`/(customer)/booking/${item.id}`);
                }
              }}
            />
          )}
        />
      )}

      {/* ================= CUSTOMER CONTACT & ADDRESS MODAL ================= */}
      <Modal
        visible={contactModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setContactModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-sand rounded-t-3xl p-5 max-h-[85%] border-t border-line">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="account-circle" size={24} color={theme.leaf} />
                <Text className="text-base font-black text-bark ml-2">
                  My Contact & Pickup Address
                </Text>
              </View>
              <Pressable
                onPress={() => setContactModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white items-center justify-center border border-line"
              >
                <MaterialCommunityIcons name="close" size={18} color={theme.bark} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1">
                Full Name
              </Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Your full name"
                className="bg-white border border-line rounded-xl px-4 py-3 mb-3 text-sm text-bark"
                placeholderTextColor="#8a7d68"
              />

              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1">
                Primary Contact Phone *
              </Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit mobile number"
                className="bg-white border border-line rounded-xl px-4 py-3 mb-3 text-sm text-bark font-semibold"
                placeholderTextColor="#8a7d68"
              />

              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1">
                WhatsApp Number
              </Text>
              <TextInput
                value={editWhatsapp}
                onChangeText={setEditWhatsapp}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit WhatsApp number"
                className="bg-white border border-line rounded-xl px-4 py-3 mb-3 text-sm text-bark"
                placeholderTextColor="#8a7d68"
              />

              <Text className="text-xs font-bold text-bark uppercase tracking-wider mb-1">
                Default Pickup Address
              </Text>
              <TextInput
                value={editAddress}
                onChangeText={setEditAddress}
                multiline
                numberOfLines={3}
                placeholder="House / Flat No., Street, Colony, Landmark"
                className="bg-white border border-line rounded-xl px-4 py-3 mb-4 text-sm text-bark min-h-[80px]"
                placeholderTextColor="#8a7d68"
              />

              <PrimaryButton
                label="Save Contact Details"
                onPress={handleSaveContact}
                loading={savingContact}
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
