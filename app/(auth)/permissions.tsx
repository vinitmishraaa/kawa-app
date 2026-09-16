import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PermissionRow } from "../../components/PermissionRow";
import { PrimaryButton } from "../../components/PrimaryButton";
import { requestLocationPermission } from "../../services/location";
import { useOnboardingStore } from "../../store/onboardingStore";

export default function Permissions() {
  const { t } = useTranslation();
  const markPermissionsDone = useOnboardingStore((s) => s.markPermissionsDone);
  const [loading, setLoading] = useState(false);

  const [, requestCameraPermission] = useCameraPermissions();
  const [, requestMicPermission] = useMicrophonePermissions();

  async function finish() {
    await markPermissionsDone();
    router.replace("/");
  }

  async function handleAllow() {
    setLoading(true);
    try {
      await requestCameraPermission();
      await requestMicPermission();
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await requestLocationPermission();
    } catch {
      // Permission dialogs can be dismissed/denied — that's the
      // user's choice, not an error state. Continue either way; the
      // relevant screens re-request when a feature is actually used.
    } finally {
      setLoading(false);
      await finish();
    }
  }

  return (
    <ScreenContainer scroll>
      <View className="mt-8 mb-6">
        <Text className="text-3xl font-bold text-bark">{t("permissions.title")}</Text>
        <Text className="text-base text-bark/70 mt-2">{t("permissions.subtitle")}</Text>
      </View>

      <PermissionRow
        icon="camera-outline"
        title={t("permissions.camera")}
        hint={t("permissions.cameraHint")}
      />
      <PermissionRow
        icon="microphone-outline"
        title={t("permissions.microphone")}
        hint={t("permissions.microphoneHint")}
      />
      <PermissionRow
        icon="image-outline"
        title={t("permissions.photos")}
        hint={t("permissions.photosHint")}
      />
      <PermissionRow
        icon="map-marker-outline"
        title={t("permissions.location")}
        hint={t("permissions.locationHint")}
      />

      <View className="mt-4">
        <PrimaryButton label={t("permissions.allow")} onPress={handleAllow} loading={loading} />
      </View>
      <View className="mt-3">
        <PrimaryButton label={t("permissions.skip")} onPress={finish} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}
