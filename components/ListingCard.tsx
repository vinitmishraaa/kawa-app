import { Pressable, Text, View, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SCRAP_CATEGORIES } from "../constants/scrapCategories";
import { theme } from "../constants/theme";
import type { ListingStatus } from "../services/queries/listings";

interface Props {
  photoUrl?: string | null;
  categoryId: string;
  quantity?: number | null;
  unit?: string | null;
  distanceMeters?: number;
  status?: ListingStatus;
  onPress?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

function statusStyles(status?: ListingStatus) {
  switch (status) {
    case "booked":
      return { bg: "bg-warn/15", text: "text-warn" };
    case "collected":
      return { bg: "bg-ok/15", text: "text-ok" };
    default:
      return { bg: "bg-leafLight", text: "text-leaf" };
  }
}

export function ListingCard({
  photoUrl,
  categoryId,
  quantity,
  unit,
  distanceMeters,
  status,
  onPress,
  actionLabel,
  onAction,
}: Props) {
  const { t } = useTranslation();
  const category = SCRAP_CATEGORIES.find((c) => c.id === categoryId);
  const badge = statusStyles(status);

  return (
    <Pressable
      onPress={onPress}
      className="bg-sand rounded-card p-4 mb-3 flex-row items-center border border-line"
    >
      <View className="w-16 h-16 rounded-2xl bg-leafLight items-center justify-center mr-3 overflow-hidden">
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} className="w-16 h-16" resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons
            name={(category?.icon as any) ?? "recycle-variant"}
            size={30}
            color={theme.leaf}
          />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-base font-semibold text-bark">
          {category ? t(category.labelKey) : categoryId}
        </Text>
        {quantity != null && (
          <Text className="text-sm text-bark/70 mt-0.5">
            {quantity} {unit ?? ""}
          </Text>
        )}
        {distanceMeters != null && (
          <Text className="text-sm text-bark/60 mt-0.5">
            {(distanceMeters / 1000).toFixed(1)} km
          </Text>
        )}
        {status && (
          <View className={`self-start rounded-full px-2 py-0.5 mt-1 ${badge.bg}`}>
            <Text className={`text-xs font-medium ${badge.text}`}>{status}</Text>
          </View>
        )}
      </View>

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="bg-leaf rounded-full px-4 py-2 ml-2"
        >
          <Text className="text-white text-sm font-semibold">{actionLabel}</Text>
        </Pressable>
      )}
    </Pressable>
  );
}
