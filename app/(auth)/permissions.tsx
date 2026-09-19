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
      {/* Step Indicator Header */}
      <View className="mt-6 mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-xs font-bold uppercase tracking-wider text-bark/50">
            {currentStep < 3 ? `Step ${currentStep + 1} of 3` : "Permissions Overview"}
          </Text>
          <Text className="text-xs font-bold text-leaf">
            {currentStep < 3 ? `${Math.round(((currentStep) / 3) * 100)}% Complete` : "Ready"}
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
          <Text className="text-2xl font-black text-bark">1. GPS Location Access</Text>
          <Text className="text-sm text-bark/70 mt-2 mb-6 leading-5">
            KAWA uses your real-time location to find nearby verified scrap collectors (Kabadiwalas), calculate distances, and set your pickup point on the map.
          </Text>

          <View className="bg-sand border border-line rounded-card p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="shield-check" size={18} color={theme.leaf} />
              <Text className="text-xs font-bold text-bark ml-2">Privacy Protected</Text>
            </View>
            <Text className="text-xs text-bark/70 leading-4">
              Your exact address is only shared with your assigned collector after you confirm a pickup booking.
            </Text>
          </View>

          <PrimaryButton
            label="✓ Allow Location Permission"
            onPress={handleAllowLocation}
            loading={loading}
          />
          <View className="mt-3">
            <PrimaryButton
              label="✕ Skip / Deny for Now"
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
          <Text className="text-2xl font-black text-bark">2. Camera & Photos Access</Text>
          <Text className="text-sm text-bark/70 mt-2 mb-6 leading-5">
            Take photos of your scrap items (paper, metal, e-waste, plastics) so collectors can inspect materials before pickup. Also used by Officers for document verification.
          </Text>

          <View className="bg-sand border border-line rounded-card p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="image-multiple-outline" size={18} color={theme.leaf} />
              <Text className="text-xs font-bold text-bark ml-2">Better Scrap Valuation</Text>
            </View>
            <Text className="text-xs text-bark/70 leading-4">
              Adding photos allows collectors to give you an accurate price estimate before coming to your doorstep.
            </Text>
          </View>

          <PrimaryButton
            label="✓ Allow Camera & Photos"
            onPress={handleAllowCamera}
            loading={loading}
          />
          <View className="mt-3">
            <PrimaryButton
              label="✕ Skip / Deny for Now"
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
          <Text className="text-2xl font-black text-bark">3. Push Notifications</Text>
          <Text className="text-sm text-bark/70 mt-2 mb-6 leading-5">
            Stay updated when a Kabadiwala accepts your pickup, begins navigating to your location, or when your recycling collection is recorded.
          </Text>

          <View className="bg-sand border border-line rounded-card p-4 mb-6">
            <View className="flex-row items-center mb-2">
              <MaterialCommunityIcons name="bell-check-outline" size={18} color={theme.leaf} />
              <Text className="text-xs font-bold text-bark ml-2">Real-Time Alerts</Text>
            </View>
            <Text className="text-xs text-bark/70 leading-4">
              Get notified immediately so you never miss a collector at your door.
            </Text>
          </View>

          <PrimaryButton
            label="✓ Allow Notifications"
            onPress={handleAllowNotifications}
          />
          <View className="mt-3">
            <PrimaryButton
              label="✕ Skip / Deny for Now"
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
          <Text className="text-2xl font-black text-bark">Permissions Configured!</Text>
          <Text className="text-xs text-bark/70 mt-1 mb-5">
            Here is your chosen device access status:
          </Text>

          {/* STATUS CARDS */}
          <View className="bg-sand border border-line rounded-card p-4 mb-4">
            {/* Location Status */}
            <View className="flex-row items-center justify-between py-2 border-b border-line/60">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="map-marker" size={18} color={theme.bark} />
                <Text className="text-sm font-bold text-bark ml-2">GPS Location</Text>
              </View>
              <Text className={`text-xs font-bold ${locationStatus === "granted" ? "text-ok" : "text-clay"}`}>
                {locationStatus === "granted" ? "✓ Allowed" : "✕ Skipped"}
              </Text>
            </View>

            {/* Camera Status */}
            <View className="flex-row items-center justify-between py-2 border-b border-line/60">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="camera" size={18} color={theme.bark} />
                <Text className="text-sm font-bold text-bark ml-2">Camera & Photos</Text>
              </View>
              <Text className={`text-xs font-bold ${cameraStatus === "granted" ? "text-ok" : "text-clay"}`}>
                {cameraStatus === "granted" ? "✓ Allowed" : "✕ Skipped"}
              </Text>
            </View>

            {/* Notification Status */}
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="bell" size={18} color={theme.bark} />
                <Text className="text-sm font-bold text-bark ml-2">Notifications</Text>
              </View>
              <Text className={`text-xs font-bold ${notifStatus === "granted" ? "text-ok" : "text-clay"}`}>
                {notifStatus === "granted" ? "✓ Allowed" : "✕ Skipped"}
              </Text>
            </View>
          </View>

          <View className="bg-leafLight/60 border border-leaf/30 rounded-xl p-3 mb-6 flex-row items-start">
            <MaterialCommunityIcons name="information-outline" size={18} color={theme.leaf} />
            <Text className="text-[11px] text-bark/80 ml-2 flex-1 leading-4">
              Tip: You can modify, grant, or revoke any of these permissions at any time from the <Text className="font-bold">⚙️ Settings</Text> menu on your dashboard.
            </Text>
          </View>

          <PrimaryButton label="Continue to App ➔" onPress={finish} />
        </View>
      )}
    </ScreenContainer>
  );
}

