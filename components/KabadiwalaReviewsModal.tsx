import React, { useEffect, useState } from "react";
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import { getKabadiwalaRating } from "../services/queries/ratings";
import type { NearbyKabadiwala } from "../services/queries/profiles";

interface Props {
  visible: boolean;
  kabadiwala: NearbyKabadiwala | null;
  onClose: () => void;
  onBook: (kabadiwala: NearbyKabadiwala) => void;
}

export function KabadiwalaReviewsModal({
  visible,
  kabadiwala,
  onClose,
  onBook,
}: Props) {
  const [reviewsData, setReviewsData] = useState<{ average: number; count: number; rows: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && kabadiwala) {
      setLoading(true);
      getKabadiwalaRating(kabadiwala.id)
        .then(setReviewsData)
        .catch(() => setReviewsData({ average: kabadiwala.rating, count: 0, rows: [] }))
        .finally(() => setLoading(false));
    }
  }, [visible, kabadiwala]);

  if (!kabadiwala) return null;

  const rates = kabadiwala.price_rates ?? {};

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-paper rounded-t-3xl max-h-[85%] p-5">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-line">
            <View className="flex-row items-center flex-1 mr-3">
              <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mr-3">
                <MaterialCommunityIcons name="account-hard-hat-outline" size={26} color={theme.leaf} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-bark text-lg">{kabadiwala.name ?? "Kabadiwala"}</Text>
                <Text className="text-xs text-bark/60">Verified Scrap Collector • {(kabadiwala.distance_m / 1000).toFixed(1)} km away</Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="p-2">
              <MaterialCommunityIcons name="close" size={24} color={theme.bark} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="py-4">
            {/* Rating Summary */}
            <View className="bg-sand rounded-card p-4 mb-4 flex-row items-center justify-between border border-line">
              <View>
                <View className="flex-row items-center">
                  <Text className="text-3xl font-extrabold text-bark mr-2">
                    {Number(reviewsData?.average ?? kabadiwala.rating ?? 0).toFixed(1)}
                  </Text>
                  <View>
                    <View className="flex-row">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <MaterialCommunityIcons
                          key={s}
                          name={s <= Math.round(reviewsData?.average ?? kabadiwala.rating ?? 0) ? "star" : "star-outline"}
                          size={18}
                          color={theme.clay}
                        />
                      ))}
                    </View>
                    <Text className="text-xs text-bark/60 mt-0.5">
                      {reviewsData?.count ?? kabadiwala.review_count ?? 0} customer ratings
                    </Text>
                  </View>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-xs text-bark/60">Contact Available</Text>
                <Text className="text-xs font-bold text-leaf mt-0.5">After Booking</Text>
              </View>
            </View>

            {/* Price Space / Rate Card */}
            <View className="mb-4">
              <Text className="text-base font-bold text-bark mb-2">Price Space (Rates per kg)</Text>
              <View className="bg-sand rounded-card p-3 border border-line">
                {Object.entries(rates).map(([material, price]) => (
                  <View
                    key={material}
                    className="flex-row justify-between py-2 border-b border-line/40 last:border-b-0"
                  >
                    <Text className="capitalize text-bark font-medium">{material}</Text>
                    <Text className="font-bold text-leaf">₹{price} / kg</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Customer Reviews List */}
            <View className="mb-6">
              <Text className="text-base font-bold text-bark mb-2">Customer Feedback</Text>
              {loading ? (
                <ActivityIndicator color={theme.leaf} className="py-4" />
              ) : !reviewsData?.rows || reviewsData.rows.length === 0 ? (
                <View className="bg-sand rounded-card p-4 items-center border border-line">
                  <MaterialCommunityIcons name="comment-text-outline" size={32} color={theme.line} />
                  <Text className="text-sm text-bark/60 mt-2">No reviews yet for this Kabadiwala.</Text>
                </View>
              ) : (
                reviewsData.rows.map((rev, idx) => (
                  <View key={idx} className="bg-sand rounded-card p-3 mb-2 border border-line">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <MaterialCommunityIcons
                            key={s}
                            name={s <= Number(rev.rating) ? "star" : "star-outline"}
                            size={14}
                            color={theme.clay}
                          />
                        ))}
                      </View>
                      <Text className="text-xs text-bark/40">
                        {new Date(rev.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="text-sm text-bark">
                      {rev.comment ? rev.comment : "Verified scrap pickup completed smoothly."}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Bottom Button */}
          <Pressable
            onPress={() => {
              onClose();
              onBook(kabadiwala);
            }}
            className="w-full py-3.5 bg-leaf rounded-card items-center"
          >
            <Text className="text-white font-bold text-base">Select & Book This Kabadiwala</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
