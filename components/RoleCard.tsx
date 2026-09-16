import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../constants/theme";

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  hint: string;
  onPress: () => void;
}

export function RoleCard({ icon, title, hint, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-sand rounded-card px-6 py-6 flex-row items-center mb-4 min-h-[96px] border border-line"
      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
    >
      <View className="w-16 h-16 rounded-full bg-leafLight items-center justify-center mr-4">
        <MaterialCommunityIcons name={icon} size={34} color={theme.leaf} />
      </View>
      <View className="flex-1">
        <Text className="text-xl font-bold text-bark">{title}</Text>
        <Text className="text-base text-bark/70 mt-1">{hint}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={28} color={theme.line} />
    </Pressable>
  );
}
