import { View, Text } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../constants/theme";

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  hint: string;
}

export function PermissionRow({ icon, title, hint }: Props) {
  return (
    <View className="flex-row items-center bg-sand rounded-card p-4 mb-3 border border-line">
      <View className="w-12 h-12 rounded-full bg-leafLight items-center justify-center mr-3">
        <MaterialCommunityIcons name={icon} size={24} color={theme.leaf} />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-bark">{title}</Text>
        <Text className="text-sm text-bark/70 mt-0.5">{hint}</Text>
      </View>
    </View>
  );
}
