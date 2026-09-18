import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { PrimaryButton } from "../../components/PrimaryButton";
import { TimeSlotPicker } from "../../components/TimeSlotPicker";
import { KabadiwalaCard } from "../../components/KabadiwalaCard";
import { KabadiwalaReviewsModal } from "../../components/KabadiwalaReviewsModal";
import { CategoryPicker } from "../../components/CategoryPicker";
import { SCRAP_CATEGORIES } from "../../constants/scrapCategories";
import { theme } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { getCurrentCoords } from "../../services/location";
import { getNearbyKabadiwalas, type NearbyKabadiwala } from "../../services/queries/profiles";
import { createCustomerBooking, type ScrapItemDraft } from "../../services/queries/bookings";

export default function BookPickupScreen() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Step 1: Items
  const [selectedCategory, setSelectedCategory] = useState("paper");
  const [quantity, setQuantity] = useState("5");
  const [unit, setUnit] = useState("kg");
  const [items, setItems] = useState<ScrapItemDraft[]>([]);

  // Step 2: Kabadiwala selection
  const [kabadiwalas, setKabadiwalas] = useState<NearbyKabadiwala[]>([]);
  const [selectedKabadiwala, setSelectedKabadiwala] = useState<NearbyKabadiwala | null>(null);
  const [inspectingKabadiwala, setInspectingKabadiwala] = useState<NearbyKabadiwala | null>(null);
  const [loadingKabadiwalas, setLoadingKabadiwalas] = useState(false);

  // Step 3: Time Slot
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState("09:00 AM – 12:00 PM");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getCurrentCoords()
      .then((c) => {
        setCoords(c);
        fetchKabadiwalas(c);
      })
      .catch(() => {
        // Fallback default coordinates if simulator / permission denied
        const defaultCoords = { latitude: 28.6139, longitude: 77.209 };
        setCoords(defaultCoords);
        fetchKabadiwalas(defaultCoords);
      });
  }, []);

  async function fetchKabadiwalas(location: { latitude: number; longitude: number }) {
    setLoadingKabadiwalas(true);
    try {
      const list = await getNearbyKabadiwalas({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setKabadiwalas(list);
      if (list.length > 0 && !selectedKabadiwala) {
        setSelectedKabadiwala(list[0]);
      }
    } catch {
      setKabadiwalas([]);
    } finally {
      setLoadingKabadiwalas(false);
    }
  }

  function handleAddItem() {
    if (!selectedCategory || !quantity || Number(quantity) <= 0) {
      Alert.alert("Invalid Scrap Item", "Please choose a category and enter quantity.");
      return;
    }

    const newItem: ScrapItemDraft = {
      category: selectedCategory,
      quantity: Number(quantity),
      unit,
    };

    setItems((prev) => [...prev, newItem]);
    setQuantity("");
  }

  function handleRemoveItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleConfirmBooking() {
    if (!profile) return;
    if (!selectedKabadiwala) {
      Alert.alert("Kabadiwala Required", "Please select a nearest Kabadiwala to proceed.");
      return;
    }

    let finalItems = items;
    if (items.length === 0 && selectedCategory && quantity && Number(quantity) > 0) {
      finalItems = [{ category: selectedCategory, quantity: Number(quantity), unit }];
    }

    if (finalItems.length === 0) {
      Alert.alert("Items Required", "Please select at least one scrap item to sell.");
      return;
    }

    setSubmitting(true);
    try {
      await createCustomerBooking({
        customerId: profile.id,
        kabadiwalaId: selectedKabadiwala.id,
        items: finalItems,
        timeSlot: selectedSlot,
        scheduledDate: selectedDate,
        address: address.trim() || undefined,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        "Booking Confirmed!",
        `Pickup scheduled with ${selectedKabadiwala.name ?? "Kabadiwala"} for ${selectedSlot}.`,
        [{ text: "View Bookings", onPress: () => router.replace("/(customer)/dashboard") }]
      );
    } catch (err: any) {
      Alert.alert("Booking Error", err?.message ?? "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer scroll>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-4 mb-4">
        <Pressable onPress={() => (step > 1 ? setStep((s) => (s - 1) as any) : router.back())} className="p-1">
          <MaterialCommunityIcons name="arrow-left" size={24} color={theme.bark} />
        </Pressable>
        <Text className="text-xl font-bold text-bark">
          {step === 1 ? "1. Select Scrap" : step === 2 ? "2. Choose Kabadiwala" : "3. Schedule & Address"}
        </Text>
        <View className="w-8" />
      </View>

      {/* Stepper Indicator */}
      <View className="flex-row items-center justify-between mb-6 px-4">
        {[1, 2, 3].map((s) => (
          <View key={s} className="flex-1 flex-row items-center">
            <View
              className={`w-8 h-8 rounded-full items-center justify-center ${
                step >= s ? "bg-leaf" : "bg-sand border border-line"
              }`}
            >
              <Text className={`font-bold text-xs ${step >= s ? "text-white" : "text-bark/60"}`}>
                {s}
              </Text>
            </View>
            {s < 3 && (
              <View className={`flex-1 h-1 mx-2 rounded ${step > s ? "bg-leaf" : "bg-line"}`} />
            )}
          </View>
        ))}
      </View>

      {/* STEP 1: SCRAP PRODUCTS */}
      {step === 1 && (
        <View>
          <Text className="text-base font-bold text-bark mb-2">What scrap do you want to sell?</Text>
          <CategoryPicker selectedId={selectedCategory} onSelect={setSelectedCategory} />

          <Text className="text-sm font-semibold text-bark mb-2 mt-4">Estimated Quantity</Text>
          <View className="flex-row mb-4">
            <TextInput
              value={quantity}
              onChangeText={(v) => setQuantity(v.replace(/[^0-9.]/g, ""))}
              placeholder="e.g. 10"
              keyboardType="decimal-pad"
              placeholderTextColor="#8a7d68"
              className="flex-1 bg-sand border border-line rounded-card px-4 py-3 mr-2 text-base text-bark"
            />
            <View className="flex-row">
              {["kg", "pieces"].map((u) => (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  className={`rounded-card px-4 py-3 ml-1 border items-center justify-center ${
                    unit === u ? "bg-leaf border-leaf" : "bg-sand border-line"
                  }`}
                >
                  <Text className={`font-semibold ${unit === u ? "text-white" : "text-bark"}`}>
                    {u}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleAddItem}
            className="bg-sand border border-leaf/40 rounded-card p-3 flex-row items-center justify-center mb-5"
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.leaf} />
            <Text className="text-leaf font-bold text-sm ml-2">Add This Item to List</Text>
          </Pressable>

          {/* Added items list */}
          {items.length > 0 && (
            <View className="bg-sand rounded-card p-4 mb-5 border border-line">
              <Text className="text-sm font-bold text-bark mb-2">Items to Sell ({items.length}):</Text>
              {items.map((item, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center justify-between py-2 border-b border-line/40 last:border-b-0"
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons
                      name={(SCRAP_CATEGORIES.find((c) => c.id === item.category)?.icon as any) ?? "recycle"}
                      size={20}
                      color={theme.leaf}
                    />
                    <Text className="capitalize font-semibold text-bark ml-2">
                      {item.category}: {item.quantity} {item.unit}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleRemoveItem(idx)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <PrimaryButton
            label="Next: Choose Nearest Kabadiwala"
            onPress={() => {
              if (items.length === 0 && (!quantity || Number(quantity) <= 0)) {
                Alert.alert("Quantity Required", "Please enter estimated quantity or add an item.");
                return;
              }
              if (items.length === 0) {
                setItems([{ category: selectedCategory, quantity: Number(quantity), unit }]);
              }
              setStep(2);
            }}
          />
        </View>
      )}

      {/* STEP 2: NEAREST KABADIWALAS */}
      {step === 2 && (
        <View>
          <Text className="text-base font-bold text-bark mb-1">Select Nearest Kabadiwala</Text>
          <Text className="text-xs text-bark/60 mb-4">
            Compare rates, check ratings and reviews, and pick who collects your scrap.
          </Text>

          {loadingKabadiwalas ? (
            <View className="py-8 items-center">
              <ActivityIndicator color={theme.leaf} size="large" />
              <Text className="text-sm text-bark/60 mt-3">Finding nearest verified kabadiwalas...</Text>
            </View>
          ) : kabadiwalas.length === 0 ? (
            <View className="bg-sand rounded-card p-6 items-center border border-line mb-4">
              <MaterialCommunityIcons name="map-marker-alert-outline" size={40} color={theme.line} />
              <Text className="text-bark/70 text-center mt-3">No Kabadiwalas registered nearby.</Text>
            </View>
          ) : (
            kabadiwalas.map((k) => (
              <KabadiwalaCard
                key={k.id}
                kabadiwala={k}
                isSelected={selectedKabadiwala?.id === k.id}
                onSelect={(selected) => {
                  setSelectedKabadiwala(selected);
                  setStep(3);
                }}
                onViewDetails={(selected) => setInspectingKabadiwala(selected)}
              />
            ))
          )}

          {selectedKabadiwala && (
            <View className="mt-3">
              <PrimaryButton
                label={`Continue with ${selectedKabadiwala.name ?? "Selected Kabadiwala"}`}
                onPress={() => setStep(3)}
              />
            </View>
          )}
        </View>
      )}

      {/* STEP 3: SCHEDULE & ADDRESS */}
      {step === 3 && (
        <View>
          {selectedKabadiwala && (
            <View className="bg-leafLight rounded-card p-4 mb-4 border border-leaf/30 flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-leaf font-bold">SELECTED KABADIWALA</Text>
                <Text className="font-bold text-bark text-base mt-0.5">
                  {selectedKabadiwala.name ?? "Local Kabadiwala"}
                </Text>
                <Text className="text-xs text-bark/60 mt-0.5">
                  ★ {Number(selectedKabadiwala.rating ?? 0).toFixed(1)} • {(selectedKabadiwala.distance_m / 1000).toFixed(1)} km away
                </Text>
              </View>
              <Pressable
                onPress={() => setStep(2)}
                className="py-1 px-3 bg-white rounded-full border border-line"
              >
                <Text className="text-xs font-bold text-bark">Change</Text>
              </Pressable>
            </View>
          )}

          <TimeSlotPicker
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            selectedSlot={selectedSlot}
            onSelectSlot={setSelectedSlot}
          />

          <Text className="text-sm font-semibold text-bark mb-2">Pickup Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="Flat / House No., Landmark, Street"
            placeholderTextColor="#8a7d68"
            className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
          />

          <Text className="text-sm font-semibold text-bark mb-2">Notes for Kabadiwala (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="e.g. Call before coming, heavy cartons"
            placeholderTextColor="#8a7d68"
            className="bg-sand border border-line rounded-card px-4 py-3 mb-6 text-base text-bark"
          />

          <PrimaryButton
            label="Confirm & Book Pickup"
            onPress={handleConfirmBooking}
            loading={submitting}
          />
        </View>
      )}

      {/* Reviews Modal */}
      <KabadiwalaReviewsModal
        visible={!!inspectingKabadiwala}
        kabadiwala={inspectingKabadiwala}
        onClose={() => setInspectingKabadiwala(null)}
        onBook={(k) => {
          setSelectedKabadiwala(k);
          setInspectingKabadiwala(null);
          setStep(3);
        }}
      />
    </ScreenContainer>
  );
}
