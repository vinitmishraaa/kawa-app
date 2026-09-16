import { View, ActivityIndicator, Text } from "react-native";
import { theme } from "../constants/theme";

export function LoadingView({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-paper">
      <ActivityIndicator size="large" color={theme.leaf} />
      {label ? <Text className="text-bark/70 mt-3">{label}</Text> : null}
    </View>
  );
}
