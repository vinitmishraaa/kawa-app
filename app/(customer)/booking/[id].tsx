import { useCallback, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
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
import { getCustomerRatingForBooking, getKabadiwalaRating, submitKabadiwalaRating } from "../../../services/queries/ratings";
import { useAuthStore } from "../../../store/authStore";

export default function CustomerBookingStatus() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const [booking, setBooking] = useState<any>(null);
  const [kabadiwala, setKabadiwala] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [savedRating, setSavedRating] = useState<any>(null);
  const [ratingSummary, setRatingSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [savingRating, setSavingRating] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getBookingByListingId(id);
      setBooking(data);
      if (data?.kabadiwala_id) {
        setKabadiwala(await getProfileById(data.kabadiwala_id));
        setRatingSummary(await getKabadiwalaRating(data.kabadiwala_id));
        if (profile) setSavedRating(await getCustomerRatingForBooking({ customerId: profile.id, kabadiwalaId: data.kabadiwala_id }));
      }
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setLoading(false);
    }
  }, [id, profile, t]);

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

  async function saveRating() {
    if (!profile || !kabadiwala || rating < 1) return;
    setSavingRating(true);
    try {
      await submitKabadiwalaRating({
        customerId: profile.id,
        kabadiwalaId: kabadiwala.id,
        rating,
        comment: comment.trim(),
      });
      setSavedRating({ rating, comment });
      setRatingSummary(await getKabadiwalaRating(kabadiwala.id));
      Alert.alert(t("rating.saved"));
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setSavingRating(false);
    }
  }

  if (loading) return <LoadingView />;
  if (!booking) {
    return <ScreenContainer><Text className="text-bark/70 mt-10 text-center">{t("customerDashboard.noListings")}</Text></ScreenContainer>;
  }

  const listing = booking.scrap_listings;
  const category = SCRAP_CATEGORIES.find((c) => c.id === listing?.category);

  return (
    <ScreenContainer scroll>
      <View className="flex-row items-center mt-4 mb-4">
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
          <View className="flex-1">
            <Text className="text-lg font-semibold text-bark">{category ? t(category.labelKey) : listing?.category}</Text>
            <Text className="text-bark/70">{listing?.quantity} {listing?.unit}</Text>
          </View>
        </View>
        <View className="flex-row justify-between py-2 border-t border-line">
          <Text className="text-bark/70">{t("booking.status")}</Text>
          <Text className="text-bark font-semibold uppercase">{booking.status}</Text>
        </View>
        {booking.time_slot && (
          <View className="flex-row justify-between py-2 border-t border-line">
            <Text className="text-bark/70">Scheduled Slot</Text>
            <Text className="text-bark font-semibold">{booking.time_slot}</Text>
          </View>
        )}
        {booking.pickup_address && (
          <View className="py-2 border-t border-line">
            <Text className="text-bark/70 text-xs">Pickup Address</Text>
            <Text className="text-bark font-medium text-sm mt-0.5">{booking.pickup_address}</Text>
          </View>
        )}
        {booking.price_agreed != null && (
          <View className="flex-row justify-between py-2 border-t border-line">
            <Text className="text-bark/70">{t("booking.priceAgreed")}</Text>
            <Text className="text-bark font-semibold">₹{booking.price_agreed}</Text>
          </View>
        )}
      </View>

      {kabadiwala && (
        <View className="bg-sand rounded-card p-5 border border-line mb-5">
          <Text className="text-lg font-bold text-bark">{t("booking.matchedKabadiwala")}</Text>
          <View className="flex-row items-center mt-4">
            <View className="w-12 h-12 rounded-full bg-leafLight items-center justify-center mr-3">
              <MaterialCommunityIcons name="account-hard-hat-outline" size={25} color={theme.leaf} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-bark">{kabadiwala.name ?? t("booking.kabadiwala")}</Text>
              <Text className="text-sm text-bark/60 mt-1">★ {Number(ratingSummary?.average ?? kabadiwala.rating ?? 0).toFixed(1)} ({ratingSummary?.count ?? 0})</Text>
            </View>
            <View>
              <Text className="text-sm text-bark/60">{t("booking.phone")}</Text>
              <Text className="font-semibold text-leaf">{kabadiwala.phone ?? t("booking.notAvailable")}</Text>
            </View>
          </View>
        </View>
      )}

      {booking.status === "accepted" && (
        <View className="mb-5">
          <Text className="text-base font-semibold text-bark mb-2">{t("booking.enterPrice")}</Text>
          <TextInput value={price} onChangeText={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
            keyboardType="decimal-pad" placeholder="0" placeholderTextColor="#8a7d68"
            className="bg-sand border border-line rounded-card px-4 py-3 mb-4 text-base text-bark" />
          <PrimaryButton label={t("booking.markCollected")} onPress={handleMarkCollected} loading={submitting} />
        </View>
      )}

      {kabadiwala && booking.status === "collected" && (
        <View className="bg-sand rounded-card p-5 border border-line">
          <Text className="text-lg font-bold text-bark">{t("rating.title")}</Text>
          <Text className="text-sm text-bark/60 mt-1">{t("rating.subtitle")}</Text>

          <View className="flex-row mt-4 mb-3">
            {[1,2,3,4,5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)} className="mr-2">
                <MaterialCommunityIcons name={value <= (rating || savedRating?.rating || 0) ? "star" : "star-outline"} size={34}
                  color={value <= (rating || savedRating?.rating || 0) ? theme.clay : theme.line} />
              </Pressable>
            ))}
          </View>

          <TextInput value={comment} onChangeText={setComment}
            placeholder={t("rating.comment")} placeholderTextColor="#8a7d68" multiline
            className="bg-white/60 border border-line rounded-card px-4 py-3 mb-4 text-base text-bark min-h-[80px]" />

          <PrimaryButton label={savedRating ? t("rating.update") : t("rating.submit")} onPress={saveRating} loading={savingRating} />
        </View>
      )}
    </ScreenContainer>
  );
}
