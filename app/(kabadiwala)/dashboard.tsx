import { useCallback, useState } from "react";
import { FlatList, Text, View, Alert, Pressable, RefreshControl } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ListingCard } from "../../components/ListingCard";
import { LoadingView } from "../../components/LoadingView";
import { LeafletMap } from "../../components/LeafletMap";
import { theme } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { syncProfileLocation } from "../../services/location";
import { getNearbyListings, type NearbyListing } from "../../services/queries/listings";
import { bookListing } from "../../services/queries/bookings";
import { signOut } from "../../services/auth";

export default function KabadiwalaDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [listings, setListings] = useState<NearbyListing[] | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      if (!profile) return;
      const c = await syncProfileLocation(profile.id);
      setCoords(c);
      const data = await getNearbyListings({ latitude: c.latitude, longitude: c.longitude });
      setListings(data);
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
      setListings([]);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }

  async function handleBook(listing: NearbyListing) {
    if (!profile) return;
    setBookingId(listing.id);
    try {
      await bookListing({
        listingId: listing.id,
        customerId: listing.customer_id,
        kabadiwalaId: profile.id,
      });
      router.push(`/(kabadiwala)/listing/${listing.id}`);
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setBookingId(null);
    }
  }

  async function handleLogout() {
    await signOut();
    reset();
    router.replace("/(auth)/role-select");
  }

  return (
    <ScreenContainer>
      <View className="flex-row items-center justify-between mt-4 mb-4">
        <Text className="text-2xl font-bold text-bark">{t("kabadiwalaDashboard.title")}</Text>
        <View className="flex-row items-center">
          <Pressable onPress={() => router.push("/price-trends")} className="mr-4"><MaterialCommunityIcons name="chart-line" size={22} color={theme.bark} /></Pressable>
          <Pressable onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color={theme.bark} />
        </Pressable>
        </View>
      </View>

      <View className="mb-3"><Pressable onPress={() => router.push("/(kabadiwala)/sell-to-officer")} className="bg-clay rounded-card p-4 flex-row items-center"><MaterialCommunityIcons name="truck-fast-outline" size={28} color="#fff" /><Text className="text-white font-bold text-base ml-3">{t("kabadiwalaDashboard.sellToOfficer")}</Text></Pressable></View>

      {listings === null || !coords ? (
        <LoadingView />
      ) : (
        <>
          <View className="mb-4">
            <LeafletMap
              center={coords}
              markers={[
                { id: "self", latitude: coords.latitude, longitude: coords.longitude, isSelf: true },
                ...listings.map((l) => ({ id: l.id, latitude: l.lat, longitude: l.lng, label: l.category })),
              ]}
            />
          </View>

          {listings.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <MaterialCommunityIcons name="map-marker-radius-outline" size={48} color={theme.line} />
              <Text className="text-bark/60 text-center mt-4">{t("kabadiwalaDashboard.empty")}</Text>
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
                  distanceMeters={item.distance_m}
                  actionLabel={bookingId === item.id ? t("common.loading") : t("kabadiwalaDashboard.book")}
                  onAction={() => handleBook(item)}
                />
              )}
            />
          )}
        </>
      )}
    </ScreenContainer>
  );
}
