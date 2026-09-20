import { useState } from "react";
import { Text, Pressable, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { LANGUAGES } from "../../constants/languages";
import { useOnboardingStore } from "../../store/onboardingStore";
import { theme } from "../../constants/theme";

export default function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const setLanguage = useOnboardingStore((s) => s.setLanguage);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);

  async function choose(code: string) {
    setSelectedLang(code);
    await setLanguage(code);
    i18n.changeLanguage(code);
    router.push("/(auth)/permissions");
  }

  return (
    <ScreenContainer>
      <View className="mt-8 mb-8">
        <Text className="text-3xl font-bold text-bark">{t("languageSelect.title")}</Text>
        <Text className="text-base text-bark/70 mt-2">{t("languageSelect.subtitle")}</Text>
      </View>

      {LANGUAGES.map((lang) => {
        const isSelected = selectedLang === lang.code;
        return (
          <Pressable
            key={lang.code}
            onPress={() => choose(lang.code)}
            className={`flex-row items-center justify-between rounded-card px-6 py-5 mb-3 border ${
              isSelected ? "bg-leafLight border-leaf" : "bg-sand border-line"
            }`}
          >
            <View>
              <Text className="text-xl font-semibold text-bark">{lang.label}</Text>
              {lang.subLabel && (
                <Text className="text-xs text-bark/60 mt-0.5">{lang.subLabel}</Text>
              )}
            </View>
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                isSelected ? "border-leaf bg-leaf" : "border-bark/30 bg-transparent"
              }`}
            >
              {isSelected ? (
                <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </ScreenContainer>
  );
}
