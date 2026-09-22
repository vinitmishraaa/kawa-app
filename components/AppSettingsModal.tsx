import { useEffect, useState } from "react";
import { Modal, Text, View, Pressable, ScrollView, Alert, Switch } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Camera } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { theme } from "../constants/theme";
import { LANGUAGES } from "../constants/languages";
import { useAuthStore } from "../store/authStore";
import { useOnboardingStore } from "../store/onboardingStore";
import { signOut } from "../services/auth";
import { requestLocationPermission } from "../services/location";

interface AppSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AppSettingsModal({ visible, onClose }: AppSettingsModalProps) {
  const { t, i18n } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const resetAuth = useAuthStore((s) => s.reset);
  const setPersistedLanguage = useOnboardingStore((s) => s.setLanguage);

  const [locGranted, setLocGranted] = useState(false);
  const [camGranted, setCamGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(true);

  useEffect(() => {
    if (visible) {
      checkPermissions();
    }
  }, [visible]);

  async function checkPermissions() {
    try {
      const locStatus = await Location.getForegroundPermissionsAsync();
      setLocGranted(locStatus.status === "granted");

      const camStatus = await Camera.getCameraPermissionsAsync();
      setCamGranted(camStatus.status === "granted");
    } catch {
      // Ignored
    }
  }

  async function handleToggleLocation() {
    try {
      const granted = await requestLocationPermission();
      setLocGranted(granted);
      if (!granted) {
        Alert.alert("Permission Notice", "Location permission is disabled. You can re-enable it in device settings.");
      }
    } catch (err: any) {
      Alert.alert("Location", err?.message ?? "Could not request location");
    }
  }

  async function handleToggleCamera() {
    try {
      const res = await Camera.requestCameraPermissionsAsync();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      setCamGranted(res.status === "granted");
      if (res.status !== "granted") {
        Alert.alert("Permission Notice", "Camera permission is disabled. You can re-enable it in device settings.");
      }
    } catch (err: any) {
      Alert.alert("Camera", err?.message ?? "Could not request camera");
    }
  }

  async function handleSelectLanguage(lang: string) {
    await i18n.changeLanguage(lang);
    await setPersistedLanguage(lang);
  }

  async function handleSwitchAccount() {
    Alert.alert(
      "Switch Account / Role",
      "To open another account (Customer, Kabadiwala, or Officer), you will be logged out first. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out & Switch",
          style: "destructive",
          onPress: async () => {
            onClose();
            await signOut().catch(() => {});
            resetAuth();
            router.replace("/(auth)/role-select");
          },
        },
      ]
    );
  }

  async function handleLogout() {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            onClose();
            await signOut().catch(() => {});
            resetAuth();
            router.replace("/(auth)/role-select");
          },
        },
      ]
    );
  }

  const roleLabel =
    profile?.role === "customer"
      ? "Customer (ग्राहक)"
      : profile?.role === "kabadiwala"
      ? "Kabadiwala (कबाड़ी वाला)"
      : profile?.role === "officer"
      ? "Municipal Officer (अधिकारी)"
      : "Guest User";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-sand rounded-t-3xl p-5 max-h-[85%] border-t border-line">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-line">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="cog" size={24} color={theme.bark} />
              <Text className="text-xl font-bold text-bark ml-2">{t("appSettings.title")}</Text>
            </View>
            <Pressable onPress={onClose} className="p-1 rounded-full bg-paper">
              <MaterialCommunityIcons name="close" size={20} color={theme.bark} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="py-3">
            {/* CURRENT ACTIVE ACCOUNT */}
            <View className="bg-white rounded-2xl p-4 mb-4 border border-line">
              <Text className="text-[11px] uppercase font-bold text-bark/50 tracking-wider mb-1">
                Active Account
              </Text>
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-base font-bold text-bark">{profile?.name ?? "User"}</Text>
                  <Text className="text-xs text-bark/60">{profile?.phone ?? profile?.gov_id_number ?? "Kawa Account"}</Text>
                </View>
                <View className="px-2.5 py-1 rounded-full bg-leafLight border border-leaf/30">
                  <Text className="text-xs font-bold text-leaf">{roleLabel}</Text>
                </View>
              </View>
            </View>

            {/* PERMISSIONS CONTROL */}
            <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-2">
              {t("appSettings.devicePermissions")}
            </Text>

            <View className="bg-white rounded-2xl p-3 mb-4 border border-line">
              {/* Location */}
              <View className="flex-row items-center justify-between py-2 border-b border-line/50">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="map-marker" size={18} color={theme.leaf} />
                    <Text className="font-bold text-sm text-bark ml-1.5">{t("appSettings.locationGps")}</Text>
                  </View>
                  <Text className="text-[11px] text-bark/60 mt-0.5">
                    {t("appSettings.locationGpsSub")}
                  </Text>
                </View>
                <Pressable
                  onPress={handleToggleLocation}
                  className={`px-3 py-1.5 rounded-lg ${
                    locGranted ? "bg-leafLight border border-leaf/40" : "bg-clay/10 border border-clay/40"
                  }`}
                >
                  <Text className={`text-xs font-bold ${locGranted ? "text-leaf" : "text-clay"}`}>
                    {locGranted ? "✓ Allowed" : "Enable"}
                  </Text>
                </Pressable>
              </View>

              {/* Camera */}
              <View className="flex-row items-center justify-between py-2 border-b border-line/50">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="camera" size={18} color={theme.leaf} />
                    <Text className="font-bold text-sm text-bark ml-1.5">{t("appSettings.cameraPhotos")}</Text>
                  </View>
                  <Text className="text-[11px] text-bark/60 mt-0.5">
                    {t("appSettings.cameraPhotosSub")}
                  </Text>
                </View>
                <Pressable
                  onPress={handleToggleCamera}
                  className={`px-3 py-1.5 rounded-lg ${
                    camGranted ? "bg-leafLight border border-leaf/40" : "bg-clay/10 border border-clay/40"
                  }`}
                >
                  <Text className={`text-xs font-bold ${camGranted ? "text-leaf" : "text-clay"}`}>
                    {camGranted ? "✓ Allowed" : "Enable"}
                  </Text>
                </Pressable>
              </View>

              {/* Notifications */}
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons name="bell-ring" size={18} color={theme.leaf} />
                    <Text className="font-bold text-sm text-bark ml-1.5">{t("appSettings.notifications")}</Text>
                  </View>
                  <Text className="text-[11px] text-bark/60 mt-0.5">
                    {t("appSettings.notificationsSub")}
                  </Text>
                </View>
                <Switch
                  value={notifGranted}
                  onValueChange={setNotifGranted}
                  trackColor={{ false: "#d1d5db", true: "#A3D9B5" }}
                  thumbColor={notifGranted ? theme.leaf : "#f4f3f4"}
                />
              </View>
            </View>

            {/* LANGUAGE SELECTOR */}
            <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-2">
              {t("appSettings.selectLanguage")} (भाषा / भाषा / ভাষা)
            </Text>

            <View className="flex-row flex-wrap gap-1.5 mb-5 bg-white rounded-2xl p-1.5 border border-line">
              {LANGUAGES.map((item) => (
                <Pressable
                  key={item.code}
                  onPress={() => handleSelectLanguage(item.code)}
                  className={`flex-1 min-w-[65px] py-2 rounded-xl items-center ${
                    i18n.language === item.code ? "bg-leafLight border border-leaf/50" : ""
                  }`}
                >
                  <Text
                    className={`font-bold text-xs ${
                      i18n.language === item.code ? "text-leaf" : "text-bark/70"
                    }`}
                  >
                    {item.label}
                  </Text>
                  {item.subLabel ? (
                    <Text className="text-[9px] text-bark/50 mt-0.5">{item.subLabel}</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>

            {/* ACCOUNT SWITCHER & LOGOUT ACTIONS */}
            <Text className="text-xs font-bold uppercase tracking-wider text-bark/70 mb-2">
              {t("appSettings.switchAccount")}
            </Text>

            <Pressable
              onPress={handleSwitchAccount}
              className="bg-white border border-leaf/40 rounded-2xl p-3.5 flex-row items-center justify-between mb-2.5"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-leafLight items-center justify-center mr-3">
                  <MaterialCommunityIcons name="swap-horizontal" size={22} color={theme.leaf} />
                </View>
                <View>
                  <Text className="font-bold text-sm text-bark">{t("appSettings.switchAccount")}</Text>
                  <Text className="text-[11px] text-bark/60">{t("appSettings.switchAccountSub")}</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.bark} />
            </Pressable>
            <Pressable
              onPress={handleLogout}
              className="bg-white border border-danger/40 rounded-2xl p-3.5 flex-row items-center justify-between mb-6"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-danger/10 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="logout" size={20} color={theme.danger} />
                </View>
                <View>
                  <Text className="font-bold text-sm text-danger">{t("appSettings.logout")}</Text>
                  <Text className="text-[11px] text-bark/60">Safely disconnect this device</Text>
                </View>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.danger} />
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
