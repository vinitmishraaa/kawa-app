import { useCallback, useState, useEffect } from "react";
import { FlatList, Text, View, Pressable, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ListingCard } from "../../components/ListingCard";
import { LoadingView } from "../../components/LoadingView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuthStore } from "../../store/authStore";
import { getMyListings, type ScrapListing } from "../../services/queries/listings";
import { getBookingsForCustomer, type Booking } from "../../services/queries/bookings";
import { signOut } from "../../services/auth";
import { supabase } from "../../services/supabase";
import { AppSettingsModal } from "../../components/AppSettingsModal";
import { theme } from "../../constants/theme";
import { SCRAP_CATEGORIES } from "../../constants/scrapCategories";

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);

  const [activeTab, setActiveTab] = useState<"bookings" | "listings">("bookings");
  const [listings, setListings] = useState<ScrapListing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const [listingsData, bookingsData] = await Promise.all([
        getMyListings(profile.id),
        getBookingsForCustomer(profile.id),
      ]);
      setListings(listingsData);
      setBookings(bookingsData as any);
    } catch {
      // Keep existing states on transient errors
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel(`customer_${profile.id}_realtime`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          load();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scrap_listings" },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, load]);

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
      <View className="flex-row items-center justify-between mt-4 mb-3">
        <View>
          <Text className="text-2xl font-bold text-bark">{t("customerDashboard.welcomeBack")}</Text>
          <Text className="text-sm font-semibold text-leaf">{profile?.name ?? t("roleSelect.customer")}</Text>
        </View>
        <View className="flex-row items-center">
          <Pressable onPress={() => setSettingsOpen(true)} className="mr-2 p-2 bg-sand rounded-full border border-line">
            <MaterialCommunityIcons name="cog" size={20} color={theme.bark} />
          </Pressable>
          <Pressable onPress={() => router.push("/price-trends")} className="mr-2 p-2 bg-sand rounded-full border border-line">
            <MaterialCommunityIcons name="chart-line" size={20} color={theme.bark} />
          </Pressable>
          <Pressable onPress={handleLogout} className="p-2 bg-sand rounded-full border border-line">
            <MaterialCommunityIcons name="logout" size={20} color={theme.bark} />
          </Pressable>
        </View>
      </View>

      {/* Hero Action Card: Book Nearest Kabadiwala */}
      <View className="bg-leaf rounded-card p-5 mb-4 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-white font-extrabold text-xl">{t("customerDashboard.sellScrapHeroTitle")}</Text>
            <Text className="text-white/80 text-xs mt-1">
              {t("customerDashboard.sellScrapHeroSubtitle")}
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
            <MaterialCommunityIcons name="truck-fast-outline" size={28} color="#fff" />
          </View>
        </View>
        <View className="flex-row mt-4 gap-2">
          <Pressable
            onPress={() => router.push("/(customer)/book-pickup")}
            className="flex-1 py-2.5 px-4 bg-white rounded-xl items-center"
          >
            <Text className="text-leaf font-bold text-sm">{t("customerDashboard.bookNearestBtn")}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/(customer)/add-scrap")}
            className="py-2.5 px-4 bg-white/20 rounded-xl items-center"
          >
            <Text className="text-white font-bold text-sm">{t("customerDashboard.addListingBtn")}</Text>
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

      {/* Universal Settings & Permissions Modal */}
      <AppSettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ScreenContainer>
  );
}
