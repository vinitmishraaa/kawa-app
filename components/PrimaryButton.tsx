import { Pressable, Text, ActivityIndicator } from "react-native";
import { theme } from "../constants/theme";

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = "primary",
}: Props) {
  const bg =
    variant === "primary"
      ? "bg-leaf"
      : variant === "danger"
        ? "bg-danger"
        : "bg-sand";
  const textColor = variant === "secondary" ? "text-bark" : "text-white";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${bg} rounded-card px-6 py-4 items-center justify-center min-h-[56px] ${
        disabled || loading ? "opacity-50" : ""
      }`}
      android_ripple={{ color: "rgba(255,255,255,0.2)" }}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? theme.bark : "#fff"} />
      ) : (
        <Text className={`${textColor} text-lg font-semibold`}>{label}</Text>
      )}
    </Pressable>
  );
}
