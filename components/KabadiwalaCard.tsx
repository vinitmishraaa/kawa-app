import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../constants/theme";
import type { NearbyKabadiwala } from "../services/queries/profiles";

interface Props {
  kabadiwala: NearbyKabadiwala;
  isSelected?: boolean;
  onSelect: (kabadiwala: NearbyKabadiwala) => void;
  onViewDetails?: (kabadiwala: NearbyKabadiwala) => void;
}

export function KabadiwalaCard({
  kabadiwala,
  isSelected,
  onSelect,
  onViewDetails,
}: Props) {
  const distanceKm = (kabadiwala.distance_m / 1000).toFixed(1);
  const rates = kabadiwala.price_rates ?? {};

  return (
    <View
      className={`rounded-card p-4 mb-3 border ${
        isSelected ? "bg-leafLight border-leaf" : "bg-sand border-line"
      }`}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1">
          {kabadiwala.shop_photo_url ? (
            <Image
              source={{ uri: kabadiwala.shop_photo_url }}
              className="w-14 h-14 rounded-xl mr-3 border border-line"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-leaf/10 items-center justify-center mr-3">
              <MaterialCommunityIcons name="account-hard-hat-outline" size={26} color={theme.leaf} />
            </View>
          )}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-bold text-bark text-base mr-1.5" numberOfLines={1}>
                {kabadiwala.shop_name || kabadiwala.name || "Local Kabadiwala"}
              </Text>
              <MaterialCommunityIcons name="check-decagram" size={16} color={theme.leaf} />
            </View>
            {kabadiwala.shop_name && kabadiwala.name && (
              <Text className="text-[11px] text-bark/70 font-medium">Owner: {kabadiwala.name}</Text>
            )}
            <View className="flex-row items-center mt-0.5">
              <MaterialCommunityIcons name="star" size={15} color={theme.clay} />
              <Text className="text-xs font-semibold text-bark ml-1">
                {Number(kabadiwala.rating ?? 0).toFixed(1)}
              </Text>
              <Text className="text-xs text-bark/60 ml-1">
                ({kabadiwala.review_count ?? 0} reviews)
              </Text>
              <Text className="text-xs text-bark/40 mx-1.5">•</Text>
              <MaterialCommunityIcons name="map-marker-distance" size={14} color={theme.leaf} />
              <Text className="text-xs font-medium text-leaf ml-0.5">{distanceKm} km away</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Price Space Preview */}
      <View className="bg-paper/70 rounded-xl p-2.5 mb-3 border border-line/50">
        <Text className="text-xs font-semibold text-bark/70 mb-1.5">Price Space (Rates / kg)</Text>
        <View className="flex-row flex-wrap gap-1.5">
          {Object.entries(rates).slice(0, 4).map(([category, price]) => (
            <View
              key={category}
              className="bg-sand rounded-full px-2.5 py-1 border border-line/80 flex-row items-center"
            >
              <Text className="text-xs text-bark/80 capitalize mr-1">{category}:</Text>
              <Text className="text-xs font-bold text-leaf">₹{price}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center gap-2">
        {onViewDetails && (
          <Pressable
            onPress={() => onViewDetails(kabadiwala)}
            className="flex-1 py-2.5 px-3 rounded-card bg-paper border border-line items-center"
          >
            <Text className="text-xs font-semibold text-bark">Rates & Feedback</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => onSelect(kabadiwala)}
          className={`flex-1 py-2.5 px-3 rounded-card items-center ${
            isSelected ? "bg-leaf" : "bg-bark"
          }`}
        >
          <Text className="text-xs font-bold text-white">
            {isSelected ? "Selected ✓" : "Book Pickup"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
