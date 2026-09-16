import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PrimaryButton } from "./PrimaryButton";
import { theme } from "../constants/theme";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.warn} />
      <Text className="text-bark/70 text-center mt-3 mb-5">{message}</Text>
      <PrimaryButton label="Try again" onPress={onRetry} />
    </View>
  );
}
