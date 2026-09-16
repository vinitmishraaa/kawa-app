import { useCallback, useState } from "react";
import { Alert, Text, View, TextInput, Pressable } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../../components/ScreenContainer";
import { LoadingView } from "../../../components/LoadingView";
import { PrimaryButton } from "../../../components/PrimaryButton";
import { theme } from "../../../constants/theme";
import { SCRAP_CATEGORIES } from "../../../constants/scrapCategories";
import { getBookingByListingId } from "../../../services/queries/bookings";
import { markBookingCollected } from "../../../services/queries/transactions";
import { getCurrentCoords } from "../../../services/location";
import { getProfileById } from "../../../services/queries/profiles";

export default function KabadiwalaBookingDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [booking, setBooking] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getBookingByListingId(id);
      setBooking(data);
      if (data?.customer_id) setCustomer(await getProfileById(data.customer_id));
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleMarkCollected() {
    if (!booking || !price || Number(price) <= 0) return;
    setSubmitting(true);
    try {
      const coords = await getCurrentCoords().catch(() => null);
      await markBookingCollected({
        bookingId: booking.id,
        price: Number(price),
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      Alert.alert(t("booking.collectedSuccess"));
      await load();
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingView />;
  if (!booking) return <ScreenContainer><Text className="text-bark/70 mt-10 text-center">{t("kabadiwalaDashboard.empty")}</Text></ScreenContainer>;

  const listing = booking.scrap_listings;
  const category = SCRAP_CATEGORIES.find((c) => c.id === listing?.category);

  return (
    <ScreenContainer scroll>
      <View className="flex-row items-center mt-4 mb-5">
        <Pressable onPress={() => router.back()} className="mr-3">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.bark} />
        </Pressable>
        <Text className="text-2xl font-bold text-bark">{t("booking.title")}</Text>
      </View>

      <View className="bg-sand rounded-card p-5 border border-line mb-5">
        <View className="flex-row items-center mb-4">
          <View className="w-14 h-14 rounded-full bg-leafLight items-center justify-center mr-3">
            <MaterialCommunityIcons name={(category?.icon as any) ?? "recycle-variant"} size={26} color={theme.leaf} />
          </View>
          <View>
            <Text className="text-lg font-semibold text-bark">{category ? t(category.labelKey) : listing?.category}</Text>
            <Text className="text-bark/70">{listing?.quantity} {listing?.unit}</Text>
          </View>
        </View>
        <View className="flex-row justify-between py-2 border-t border-line">
          <Text className="text-bark/70">{t("booking.status")}</Text>
          <Text className="text-bark font-semibold">{booking.status}</Text>
        </View>
      </View>

      {customer && (
        <View className="bg-sand rounded-card p-5 border border-line mb-5">
          <Text className="text-lg font-bold text-bark">{t("booking.matchedCustomer")}</Text>
          <View className="flex-row items-center mt-4">
            <View className="w-12 h-12 rounded-full bg-leafLight items-center justify-center mr-3">
              <MaterialCommunityIcons name="account-outline" size={25} color={theme.leaf} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-bark">{customer.name ?? t("booking.customer")}</Text>
              <Text className="text-sm text-bark/60 mt-1">{t("booking.contactRevealed")}</Text>
            </View>
            <Text className="font-semibold text-leaf">{customer.phone ?? t("booking.notAvailable")}</Text>
          </View>
        </View>
      )}

      {booking.status === "accepted" && (
        <View>
          <Text className="text-base font-semibold text-bark mb-2">{t("booking.enterPrice")}</Text>
          <TextInput value={price} onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#8a7d68"
            className="bg-sand border border-line rounded-card px-4 py-3 mb-4 text-base text-bark" />
          <PrimaryButton label={t("booking.markCollected")} onPress={handleMarkCollected} loading={submitting} />
        </View>
      )}
    </ScreenContainer>
  );
}
