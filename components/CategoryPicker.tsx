import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { SCRAP_CATEGORIES } from "../constants/scrapCategories";
import { theme } from "../constants/theme";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryPicker({ selectedId, onSelect }: Props) {
  const { t } = useTranslation();

  return (
    <View className="flex-row flex-wrap justify-between">
      {SCRAP_CATEGORIES.map((cat) => {
        const isSelected = selectedId === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat.id)}
            className={`w-[31%] aspect-square rounded-card items-center justify-center mb-3 border-2 ${
              isSelected ? "bg-leafLight border-leaf" : "bg-sand border-line"
            }`}
          >
            <MaterialCommunityIcons
              name={cat.icon as any}
              size={32}
              color={isSelected ? theme.leaf : theme.bark}
            />
            <Text
              className={`text-xs mt-2 text-center px-1 ${
                isSelected ? "text-leaf font-semibold" : "text-bark"
              }`}
              numberOfLines={1}
            >
              {t(cat.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
