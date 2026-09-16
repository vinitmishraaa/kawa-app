import { useEffect, useRef, useState } from "react";
import {
  Text,
  View,
  TextInput,
  Pressable,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { CategoryPicker } from "../../components/CategoryPicker";
import { LoadingView } from "../../components/LoadingView";
import { SCRAP_CATEGORIES, QUANTITY_UNITS } from "../../constants/scrapCategories";
import { theme } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { getCurrentCoords } from "../../services/location";
import { createScrapListing, uploadListingPhoto } from "../../services/queries/listings";

interface DraftItem {
  photoUri: string;
  categoryId: string;
  subCategoryId: string | null;
  quantity: string;
  unit: string;
}

const EMPTY_DRAFT: DraftItem = {
  photoUri: "",
  categoryId: "",
  subCategoryId: null,
  quantity: "",
  unit: "kg",
};

export default function AddScrap() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [draft, setDraft] = useState<DraftItem>(EMPTY_DRAFT);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentCoords()
      .then(setCoords)
      .catch(() => {
        // Fall back to no coordinates — the submit guard below will
        // ask the user to enable location before listing.
      });
  }, []);

  const selectedCategory = SCRAP_CATEGORIES.find((c) => c.id === draft.categoryId);

  async function handleCapture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
    setDraft((d) => ({ ...d, photoUri: photo?.uri ?? "" }));
    setShowCamera(false);
  }

  function validateDraft(d: DraftItem) {
    if (!d.photoUri) return t("addScrap.needPhoto");
    if (!d.categoryId) return t("addScrap.needCategory");
    if (!d.quantity || Number(d.quantity) <= 0) return t("addScrap.needQuantity");
    return null;
  }

  function handleAddAnother() {
    const error = validateDraft(draft);
    if (error) {
      Alert.alert(error);
      return;
    }
    setItems((prev) => [...prev, draft]);
    setDraft(EMPTY_DRAFT);
  }

  async function handleSubmitAll() {
    if (!profile || !coords) {
      Alert.alert(t("addScrap.locatingYou"));
      return;
    }

    let finalItems = items;
    // Fold in whatever is currently in the draft, if it's a valid item.
    if (!validateDraft(draft)) {
      finalItems = [...items, draft];
    } else if (items.length === 0) {
      Alert.alert(validateDraft(draft) ?? t("addScrap.needPhoto"));
      return;
    }

    setSubmitting(true);
    try {
      for (const item of finalItems) {
        const photoUrl = await uploadListingPhoto(item.photoUri, profile.id);
        await createScrapListing({
          customerId: profile.id,
          photos: [photoUrl],
          category: item.categoryId,
          subCategory: item.subCategoryId ?? undefined,
          quantity: Number(item.quantity),
          unit: item.unit,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
      }
      Alert.alert(t("addScrap.success"));
      router.replace("/(customer)/dashboard");
    } catch (err: any) {
      Alert.alert(t("auth.errorGeneric"), err?.message ?? "");
    } finally {
      setSubmitting(false);
    }
  }

  if (!permission) {
    return <LoadingView />;
  }

  if (showCamera) {
    if (!permission.granted) {
      requestPermission();
      return <LoadingView />;
    }
    return (
      <View className="flex-1 bg-black">
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
        <View className="absolute bottom-10 w-full items-center">
          <Pressable
            onPress={handleCapture}
            className="w-20 h-20 rounded-full bg-white border-4 border-leaf items-center justify-center"
          />
        </View>
        <Pressable
          onPress={() => setShowCamera(false)}
          className="absolute top-14 left-6 w-11 h-11 rounded-full bg-black/50 items-center justify-center"
        >
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </Pressable>
      </View>
    );
  }

  return (
    <ScreenContainer scroll>
      <Text className="text-2xl font-bold text-bark mt-4 mb-4">{t("addScrap.title")}</Text>

      {/* Photo */}
      <Pressable
        onPress={() => setShowCamera(true)}
        className="w-full h-44 rounded-card bg-sand border border-line items-center justify-center mb-4 overflow-hidden"
      >
        {draft.photoUri ? (
          <Image source={{ uri: draft.photoUri }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="items-center">
            <MaterialCommunityIcons name="camera-plus-outline" size={36} color={theme.leaf} />
            <Text className="text-bark/70 mt-2">{t("addScrap.takePhoto")}</Text>
          </View>
        )}
      </Pressable>

      {/* Category */}
      <Text className="text-base font-semibold text-bark mb-2">{t("addScrap.chooseCategory")}</Text>
      <CategoryPicker
        selectedId={draft.categoryId}
        onSelect={(id) => setDraft((d) => ({ ...d, categoryId: id, subCategoryId: null }))}
      />

      {/* Sub-category */}
      {selectedCategory && (
        <View className="mb-4">
          <Text className="text-base font-semibold text-bark mb-2 mt-2">
            {t("addScrap.chooseSubCategory")}
          </Text>
          <View className="flex-row flex-wrap">
            {selectedCategory.subCategories.map((sub) => {
              const isSelected = draft.subCategoryId === sub.id;
              return (
                <Pressable
                  key={sub.id}
                  onPress={() => setDraft((d) => ({ ...d, subCategoryId: sub.id }))}
                  className={`rounded-full px-4 py-2 mr-2 mb-2 border ${
                    isSelected ? "bg-leaf border-leaf" : "bg-sand border-line"
                  }`}
                >
                  <Text className={isSelected ? "text-white" : "text-bark"}>{t(sub.labelKey)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Quantity + unit */}
      <Text className="text-base font-semibold text-bark mb-2">{t("addScrap.quantity")}</Text>
      <View className="flex-row mb-4">
        <TextInput
          value={draft.quantity}
          onChangeText={(v) => setDraft((d) => ({ ...d, quantity: v.replace(/[^0-9.]/g, "") }))}
          keyboardType="decimal-pad"
          placeholder="0"
          className="flex-1 bg-sand border border-line rounded-card px-4 py-3 mr-2 text-base text-bark"
        />
        <View className="flex-row">
          {QUANTITY_UNITS.map((u) => (
            <Pressable
              key={u}
              onPress={() => setDraft((d) => ({ ...d, unit: u }))}
              className={`rounded-full px-4 py-3 ml-1 border ${
                draft.unit === u ? "bg-leaf border-leaf" : "bg-sand border-line"
              }`}
            >
              <Text className={draft.unit === u ? "text-white" : "text-bark"}>{u}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mb-3">
        <PrimaryButton
          label={t("addScrap.addAnother")}
          onPress={handleAddAnother}
          variant="secondary"
        />
      </View>

      {/* Session review */}
      {items.length > 0 && (
        <View className="mb-4">
          <Text className="text-base font-semibold text-bark mb-2">
            {t("addScrap.reviewTitle")} ({items.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {items.map((it, idx) => (
              <Image
                key={idx}
                source={{ uri: it.photoUri }}
                className="w-16 h-16 rounded-2xl mr-2"
              />
            ))}
          </ScrollView>
        </View>
      )}

      <PrimaryButton
        label={t("addScrap.submitAll")}
        onPress={handleSubmitAll}
        loading={submitting}
      />
    </ScreenContainer>
  );
}
