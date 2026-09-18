import React from "react";
import { View, Text, Pressable } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../constants/theme";

export interface TimeSlotOption {
  id: string;
  label: string;
  timeRange: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const TIME_SLOTS: TimeSlotOption[] = [
  {
    id: "morning",
    label: "Morning",
    timeRange: "09:00 AM – 12:00 PM",
    icon: "weather-sunset-up",
  },
  {
    id: "afternoon",
    label: "Afternoon",
    timeRange: "12:00 PM – 03:00 PM",
    icon: "weather-sunny",
  },
  {
    id: "evening",
    label: "Evening",
    timeRange: "03:00 PM – 06:00 PM",
    icon: "weather-sunset-down",
  },
];

interface Props {
  selectedSlot: string;
  onSelectSlot: (slot: string) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function TimeSlotPicker({
  selectedSlot,
  onSelectSlot,
  selectedDate,
  onSelectDate,
}: Props) {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const todayStr = today.toISOString().split("T")[0];
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  return (
    <View className="mb-4">
      <Text className="text-sm font-semibold text-bark mb-2">Select Pickup Date</Text>
      <View className="flex-row mb-3">
        <Pressable
          onPress={() => onSelectDate(todayStr)}
          className={`flex-1 py-3 px-4 rounded-card mr-2 border items-center ${
            selectedDate === todayStr ? "bg-leaf border-leaf" : "bg-sand border-line"
          }`}
        >
          <Text className={`font-semibold ${selectedDate === todayStr ? "text-white" : "text-bark"}`}>
            Today
          </Text>
          <Text className={`text-xs mt-0.5 ${selectedDate === todayStr ? "text-white/80" : "text-bark/60"}`}>
            {today.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onSelectDate(tomorrowStr)}
          className={`flex-1 py-3 px-4 rounded-card ml-2 border items-center ${
            selectedDate === tomorrowStr ? "bg-leaf border-leaf" : "bg-sand border-line"
          }`}
        >
          <Text className={`font-semibold ${selectedDate === tomorrowStr ? "text-white" : "text-bark"}`}>
            Tomorrow
          </Text>
          <Text className={`text-xs mt-0.5 ${selectedDate === tomorrowStr ? "text-white/80" : "text-bark/60"}`}>
            {tomorrow.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </Text>
        </Pressable>
      </View>

      <Text className="text-sm font-semibold text-bark mb-2">Select Time Slot</Text>
      <View className="gap-2">
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.timeRange;
          return (
            <Pressable
              key={slot.id}
              onPress={() => onSelectSlot(slot.timeRange)}
              className={`flex-row items-center p-3.5 rounded-card border ${
                isSelected ? "bg-leafLight border-leaf" : "bg-sand border-line"
              }`}
            >
              <View
                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                  isSelected ? "bg-leaf" : "bg-paper"
                }`}
              >
                <MaterialCommunityIcons
                  name={slot.icon}
                  size={22}
                  color={isSelected ? "#fff" : theme.bark}
                />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-bark text-base">{slot.label}</Text>
                <Text className="text-sm text-bark/70">{slot.timeRange}</Text>
              </View>
              <MaterialCommunityIcons
                name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                size={22}
                color={isSelected ? theme.leaf : theme.line}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
