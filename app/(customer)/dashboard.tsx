import { useCallback, useState } from "react";
import { FlatList, Text, View, Pressable, RefreshControl } from "react-native";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { ListingCard } from "../../components/ListingCard";
import { LoadingView } from "../../components/LoadingView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useAuthStore } from "../../store/authStore";
import { getMyListings, type ScrapListing } from "../../services/queries/listings";
import { signOut } from "../../services/auth";
import { theme } from "../../constants/theme";

export default function CustomerDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);
  const [listings, setListings] = useState<ScrapListing[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const data = await getMyListings(profile.id);
    setListings(data);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() { setRefreshing(true); try { await load(); } finally { setRefreshing(false); } }

  async function handleLogout() {
    await signOut();
    reset();
    router.replace("/(auth)/role-select");
  }

  return (
    <ScreenContainer>
      <View className="flex-row items-center justify-between mt-4 mb-4">
        <Text className="text-2xl font-bold text-bark">{t("customerDashboard.title")}</Text>
        <View className="flex-row items-center">
          <Pressable onPress={() => router.push("/price-trends")} className="mr-3"><MaterialCommunityIcons name="chart-line" size={22} color={theme.bark} /></Pressable>
          <Pressable onPress={handleLogout} className="mr-3">
            <MaterialCommunityIcons name="logout" size={22} color={theme.bark} />
          </Pressable>
          <Pressable onPress={() => router.push("/(customer)/add-scrap")}>
            <View className="w-11 h-11 rounded-full bg-leaf items-center justify-center">
              <MaterialCommunityIcons name="plus" size={26} color="#fff" />
            </View>
          </Pressable>
        </View>
      </View>

      {listings === null ? (
        <LoadingView />
      ) : listings.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons name="package-variant" size={48} color={theme.line} />
          <Text className="text-bark/60 text-center mt-4 mb-6">
            {t("customerDashboard.noListings")}
          </Text>
          <PrimaryButton
            label={t("customerDashboard.addScrap")}
            onPress={() => router.push("/(customer)/add-scrap")}
          />
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
    </ScreenContainer>
  );
}
