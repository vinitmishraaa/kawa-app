import { useState } from "react";
import { Text, View, Pressable } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { requestLocationPermission } from "../../services/location";
import { useOnboardingStore } from "../../store/onboardingStore";
import { theme } from "../../constants/theme";

export default function Permissions() {
  const { t } = useTranslation();
  const markPermissionsDone = useOnboardingStore((s) => s.markPermissionsDone);

  // Steps: 0 = Location, 1 = Camera, 2 = Notifications, 3 = Summary
  const [currentStep, setCurrentStep] = useState(0);
  const [locationStatus, setLocationStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [cameraStatus, setCameraStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [notifStatus, setNotifStatus] = useState<"pending" | "granted" | "denied">("pending");
  const [loading, setLoading] = useState(false);

  const [, requestCameraPermission] = useCameraPermissions();

  async function handleAllowLocation() {
    setLoading(true);
    try {
      const granted = await requestLocationPermission();
      setLocationStatus(granted ? "granted" : "denied");
    } catch {
      setLocationStatus("denied");
    } finally {
      setLoading(false);
      setCurrentStep(1);
    }
  }

  function handleSkipLocation() {
    setLocationStatus("denied");
    setCurrentStep(1);
  }

  async function handleAllowCamera() {
    setLoading(true);
    try {
      const res = await requestCameraPermission();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      setCameraStatus(res.status === "granted" ? "granted" : "denied");
    } catch {
      setCameraStatus("denied");
    } finally {
      setLoading(false);
      setCurrentStep(2);
    }
  }

  function handleSkipCamera() {
    setCameraStatus("denied");
    setCurrentStep(2);
  }

  function handleAllowNotifications() {
    setNotifStatus("granted");
    setCurrentStep(3);
  }

  function handleSkipNotifications() {
    setNotifStatus("denied");
    setCurrentStep(3);
  }

  async function finish() {
    await markPermissionsDone();
    router.replace("/(auth)/role-select");
  }

  return (
    <ScreenContainer scroll>
      {/* Top Back Navigation Bar */}
      <View className="flex-row items-center mt-2 mb-2">
        <Pressable
          onPress={() => {
            if (currentStep > 0) {
              setCurrentStep((s) => s - 1);
            } else {
              router.replace("/(auth)/language-select");
            }
          }}
          className="w-10 h-10 rounded-full bg-sand border border-line items-center justify-center mr-3"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.bark} />
        </Pressable>
        <Text className="text-xs font-semibold text-bark/60 uppercase tracking-wider">
          {currentStep > 0 ? t("common.previous", "Previous Step") : t("common.back", "Back")}
        </Text>
      </View>

      {/* Step Indicator Header */}
      <View className="mt-2 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-bark/50">
            {currentStep < 3 ? t("permissions.stepCount", { step: currentStep + 1 }) : t("permissions.overview")}
          </Text>
          <Text className="text-xs font-bold text-leaf">
            {currentStep < 3 ? t("permissions.percentComplete", { percent: Math.round(((currentStep) / 3) * 100) }) : t("permissions.ready")}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="h-2 bg-sand rounded-full overflow-hidden border border-line">
          <View
            style={{ width: `${currentStep === 0 ? 33 : currentStep === 1 ? 66 : 100}%` }}
            className="h-full bg-leaf rounded-full"
          />
        </View>
      </View>

      {/* STEP 1: LOCATION */}
      {currentStep === 0 && (
        <View className="mt-2">
          <View className="w-16 h-16 rounded-full bg-leafLight items-center justify-center mb-4">
            <MaterialCommunityIcons name="map-marker-radius" size={36} color={theme.leaf} />
          </View>
          <Text className="text-2xl font-black text-bark">{t("permissions.locationTitle")}</Text>
          <Text className="text-sm text-bark/70 mt-2 mb-6 leading-5">
            {t("permissions.locationDesc")}
          </Text>

          <View className="bg-sand border border-line rounded-card p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="shield-check" size={18} color={theme.leaf} />
              <Text className="text-xs font-bold text-bark ml-2">{t("common.privacyProtected")}</Text>
            </View>
            <Text className="text-xs text-bark/70 leading-4">
              {t("common.privacyProtectedDesc")}
            </Text>
          </View>

          <PrimaryButton
            label={t("permissions.allowLocation")}
            onPress={handleAllowLocation}
            loading={loading}
          />
          <View className="mt-3">
            <PrimaryButton
              label={t("permissions.skipLocation")}
              onPress={handleSkipLocation}
              variant="secondary"
            />
          </View>
        </View>
      )}

      {/* STEP 2: CAMERA & PHOTOS */}
      {currentStep === 1 && (
        <View className="mt-2">
          <View className="w-16 h-16 rounded-full bg-leafLight items-center justify-center mb-4">
            <MaterialCommunityIcons name="camera-iris" size={36} color={theme.leaf} />
          </View>
          <Text className="text-2xl font-black text-bark">{t("permissions.cameraTitle")}</Text>
          <Text className="text-sm text-bark/70 mt-2 mb-6 leading-5">
            {t("permissions.cameraDesc")}
          </Text>

          <View className="bg-sand border border-line rounded-card p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="image-multiple-outline" size={18} color={theme.leaf} />
              <Text className="text-xs font-bold text-bark ml-2">{t("appSettings.cameraPhotos")}</Text>
            </View>
            <Text className="text-xs text-bark/70 leading-4">
              {t("appSettings.cameraPhotosSub")}
            </Text>
          </View>

          <PrimaryButton
            label={t("permissions.allowCamera")}
            onPress={handleAllowCamera}
            loading={loading}
          />
          <View className="mt-3">
            <PrimaryButton
              label={t("permissions.skipCamera")}
              onPress={handleSkipCamera}
              variant="secondary"
            />
          </View>
        </View>
      )}

      {/* STEP 3: NOTIFICATIONS */}
      {currentStep === 2 && (
        <View className="mt-2">
          <View className="w-16 h-16 rounded-full bg-leafLight items-center justify-center mb-4">
            <MaterialCommunityIcons name="bell-ring-outline" size={36} color={theme.leaf} />
          </View>
          <Text className="text-2xl font-black text-bark">{t("permissions.notifTitle")}</Text>
          <Text className="text-sm text-bark/70 mt-2 mb-6 leading-5">
            {t("permissions.notifDesc")}
          </Text>

          <View className="bg-sand border border-line rounded-card p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="bell-check-outline" size={18} color={theme.leaf} />
              <Text className="text-xs font-bold text-bark ml-2">{t("appSettings.notifications")}</Text>
            </View>
            <Text className="text-xs text-bark/70 leading-4">
              {t("appSettings.notificationsSub")}
            </Text>
          </View>

          <PrimaryButton
            label={t("permissions.allowNotif")}
            onPress={handleAllowNotifications}
          />
          <View className="mt-3">
            <PrimaryButton
              label={t("permissions.skipNotif")}
              onPress={handleSkipNotifications}
              variant="secondary"
            />
          </View>
        </View>
      )}

      {/* STEP 4: SUMMARY & CONFIRMATION */}
      {currentStep === 3 && (
        <View className="mt-2">
          <View className="w-16 h-16 rounded-full bg-ok/20 items-center justify-center mb-4">
            <MaterialCommunityIcons name="check-decagram" size={36} color={theme.ok} />
          </View>
          <Text className="text-2xl font-black text-bark">{t("permissions.summaryTitle")}</Text>
          <Text className="text-xs text-bark/70 mt-1 mb-5">
            {t("permissions.summaryDesc")}
          </Text>

          {/* STATUS CARDS */}
          <View className="bg-sand border border-line rounded-card p-4 mb-4">
            {/* Location Status */}
            <View className="flex-row items-center justify-between py-2 border-b border-line/60">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="map-marker" size={18} color={theme.bark} />
                <Text className="text-sm font-bold text-bark ml-2">{t("appSettings.locationGps")}</Text>
              </View>
              <Text className={`text-xs font-bold ${locationStatus === "granted" ? "text-ok" : "text-clay"}`}>
                {locationStatus === "granted" ? "✓ Allowed" : "✕ Skipped"}
              </Text>
            </View>

            {/* Camera Status */}
            <View className="flex-row items-center justify-between py-2 border-b border-line/60">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="camera" size={18} color={theme.bark} />
                <Text className="text-sm font-bold text-bark ml-2">{t("appSettings.cameraPhotos")}</Text>
              </View>
              <Text className={`text-xs font-bold ${cameraStatus === "granted" ? "text-ok" : "text-clay"}`}>
                {cameraStatus === "granted" ? "✓ Allowed" : "✕ Skipped"}
              </Text>
            </View>

            {/* Notification Status */}
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="bell" size={18} color={theme.bark} />
                <Text className="text-sm font-bold text-bark ml-2">{t("appSettings.notifications")}</Text>
              </View>
              <Text className={`text-xs font-bold ${notifStatus === "granted" ? "text-ok" : "text-clay"}`}>
                {notifStatus === "granted" ? "✓ Allowed" : "✕ Skipped"}
              </Text>
            </View>
          </View>

          <PrimaryButton label={t("permissions.continueToApp")} onPress={finish} />
        </View>
      )}
    </ScreenContainer>
  );
}

