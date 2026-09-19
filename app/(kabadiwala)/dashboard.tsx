import { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  View,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
  Linking,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScreenContainer } from "../../components/ScreenContainer";
import { LoadingView } from "../../components/LoadingView";
import { PrimaryButton } from "../../components/PrimaryButton";
import { LeafletMap } from "../../components/LeafletMap";
import { theme } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { syncProfileLocation } from "../../services/location";
import { getNearbyListings, type NearbyListing } from "../../services/queries/listings";
import {
  getBookingsForKabadiwala,
  bookListing,
  updateBookingStatus,
  type Booking,
} from "../../services/queries/bookings";
import {
  markBookingCollected,
  getKabadiwalaWasteLedger,
  QUALITY_GRADES,
} from "../../services/queries/transactions";
import { signOut } from "../../services/auth";
import { AppSettingsModal } from "../../components/AppSettingsModal";

export default function KabadiwalaDashboard() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const reset = useAuthStore((s) => s.reset);

  const [activeTab, setActiveTab] = useState<"pickups" | "route" | "ledger">("pickups");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [listings, setListings] = useState<NearbyListing[]>([]);
  const [ledger, setLedger] = useState<any>(null);
  const [ledgerSubTab, setLedgerSubTab] = useState<"intake" | "outgoing">("intake");
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Mark Collected Modal State
  const [collectingBooking, setCollectingBooking] = useState<Booking | null>(null);
  const [collectWeight, setCollectWeight] = useState("");
  const [collectPrice, setCollectPrice] = useState("");
  const [collectQuality, setCollectQuality] = useState("Grade A (Clean)");
  const [submittingCollection, setSubmittingCollection] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    try {
      const c = await syncProfileLocation(profile.id).catch(() => ({
        latitude: 28.6139,
        longitude: 77.209,
      }));
      setCoords(c);

      const [bookingsData, nearbyListingsData, ledgerData] = await Promise.all([
        getBookingsForKabadiwala(profile.id),
        getNearbyListings({ latitude: c.latitude, longitude: c.longitude }).catch(() => []),
        getKabadiwalaWasteLedger(profile.id).catch(() => null),
      ]);

      setBookings(bookingsData as any);
      setListings(nearbyListingsData);
      setLedger(ledgerData);
    } catch (err: any) {
      // Keep UI active on errors
    }
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await signOut();
    reset();
    router.replace("/(auth)/role-select");
  }

  async function handleUpdateStatus(bookingId: string, status: any) {
    try {
      await updateBookingStatus(bookingId, status);
      await load();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not update status");
    }
  }

  function openCollectModal(b: Booking) {
    setCollectingBooking(b);
    const firstItem = b.items?.[0] || b.scrap_listings;
    setCollectWeight(firstItem?.quantity ? String(firstItem.quantity) : "");
    setCollectPrice(b.price_agreed ? String(b.price_agreed) : "");
    setCollectQuality("Grade A (Clean)");
  }

  async function submitCollection() {
    if (!collectingBooking || !collectPrice || Number(collectPrice) <= 0) {
      Alert.alert("Price Required", "Please enter the price paid for this collection.");
      return;
    }

    setSubmittingCollection(true);
    try {
      await markBookingCollected({
        bookingId: collectingBooking.id,
        price: Number(collectPrice),
        actualQuantity: collectWeight ? Number(collectWeight) : undefined,
        quality: collectQuality,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });

      Alert.alert("Collection Recorded", "Garbage intake successfully logged in your waste ledger.");
      setCollectingBooking(null);
      await load();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to mark collected.");
    } finally {
      setSubmittingCollection(false);
    }
  }

  // Calculate planned route stops from accepted/in-progress bookings
  const routeStops = (bookings ?? []).filter(
    (b) => b.status === "accepted" || b.status === "in_progress" || b.status === "requested"
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center justify-between mt-4 mb-3">
        <View>
          <Text className="text-2xl font-bold text-bark">Kabadiwala Hub</Text>
          <Text className="text-sm font-semibold text-leaf">{profile?.name ?? "Collector"}</Text>
        </View>
        <View className="flex-row items-center">
          <Pressable onPress={() => setSettingsOpen(true)} className="mr-2 p-2 bg-sand rounded-full border border-line">
            <MaterialCommunityIcons name="cog" size={20} color={theme.bark} />
          </Pressable>
          <Pressable onPress={() => router.push("/price-trends")} className="mr-2 p-2 bg-sand rounded-full border border-line">
            <MaterialCommunityIcons name="chart-line" size={20} color={theme.bark} />
          </Pressable>
          <Pressable onPress={handleLogout} className="p-2 bg-sand rounded-full border border-line">
            <MaterialCommunityIcons name="logout" size={20} color={theme.bark} />
          </Pressable>
        </View>
      </View>

      {/* Main Tabs */}
      <View className="flex-row mb-4 bg-sand rounded-xl p-1 border border-line">
        <Pressable
          onPress={() => setActiveTab("pickups")}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === "pickups" ? "bg-white border border-line/40" : ""
          }`}
        >
          <Text className={`font-bold text-xs ${activeTab === "pickups" ? "text-bark" : "text-bark/60"}`}>
            Pickups ({routeStops.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("route")}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === "route" ? "bg-white border border-line/40" : ""
          }`}
        >
          <Text className={`font-bold text-xs ${activeTab === "route" ? "text-bark" : "text-bark/60"}`}>
            Planned Route 🗺️
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("ledger")}
          className={`flex-1 py-2 rounded-lg items-center ${
            activeTab === "ledger" ? "bg-white border border-line/40" : ""
          }`}
        >
          <Text className={`font-bold text-xs ${activeTab === "ledger" ? "text-bark" : "text-bark/60"}`}>
            Waste Ledger
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: PICKUPS & BOOKINGS */}
      {activeTab === "pickups" && (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Incoming Customer Bookings */}
          <Text className="text-base font-bold text-bark mb-2">Incoming Customer Bookings</Text>

          {bookings === null ? (
            <LoadingView />
          ) : bookings.length === 0 ? (
            <View className="bg-sand rounded-card p-6 items-center border border-line mb-5">
              <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={theme.line} />
              <Text className="text-bark/60 text-center mt-3">No customer bookings yet.</Text>
            </View>
          ) : (
            bookings.map((b) => {
              const isCollected = b.status === "collected" || b.status === "completed";
              const itemsList = b.items ?? [];
              return (
                <View key={b.id} className="bg-sand border border-line rounded-card p-4 mb-3">
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="clock-time-four-outline" size={16} color={theme.leaf} />
                        <Text className="font-bold text-bark text-sm ml-1.5">
                          {b.time_slot ?? "Flexible Time Slot"}
                        </Text>
                      </View>
                      <Text className="text-xs text-bark/60 mt-0.5">
                        Scheduled: {b.scheduled_date ?? "Today"}
                      </Text>
                    </View>
                    <View className="px-2.5 py-1 rounded-full bg-leafLight">
                      <Text className="text-xs font-bold text-leaf uppercase">{b.status}</Text>
                    </View>
                  </View>

                  {/* Items to collect */}
                  <View className="bg-paper/70 rounded-xl p-2.5 my-2 border border-line/50">
                    <Text className="text-xs font-semibold text-bark/70 mb-1">Items to Collect:</Text>
                    {itemsList.length > 0 ? (
                      <View className="flex-row flex-wrap gap-1.5">
                        {itemsList.map((it, idx) => (
                          <View key={idx} className="bg-sand px-2 py-0.5 rounded-md border border-line">
                            <Text className="text-xs font-bold text-bark capitalize">
                              {it.category}: {it.quantity} {it.unit || "kg"}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : b.scrap_listings ? (
                      <Text className="text-xs font-bold text-bark">
                        {b.scrap_listings.category} ({b.scrap_listings.quantity} {b.scrap_listings.unit})
                      </Text>
                    ) : (
                      <Text className="text-xs text-bark/60">Scrap parcel</Text>
                    )}

                    {b.pickup_address && (
                      <Text className="text-xs text-bark/80 mt-1.5">📍 {b.pickup_address}</Text>
                    )}
                  </View>

                  {/* Action Controls */}
                  {!isCollected && (
                    <View className="flex-row gap-2 mt-2">
                      {b.status === "requested" && (
                        <Pressable
                          onPress={() => handleUpdateStatus(b.id, "accepted")}
                          className="flex-1 py-2.5 bg-leaf rounded-xl items-center"
                        >
                          <Text className="text-white font-bold text-xs">Accept Booking</Text>
                        </Pressable>
                      )}
                      {b.status === "accepted" && (
                        <Pressable
                          onPress={() => handleUpdateStatus(b.id, "in_progress")}
                          className="flex-1 py-2.5 bg-bark rounded-xl items-center"
                        >
                          <Text className="text-white font-bold text-xs">Start Pickup</Text>
                        </Pressable>
                      )}
                      {(b.status === "in_progress" || b.status === "accepted") && (
                        <Pressable
                          onPress={() => openCollectModal(b)}
                          className="flex-1 py-2.5 bg-ok rounded-xl items-center"
                        >
                          <Text className="text-white font-bold text-xs">Mark Collected & Quality</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* TAB 2: PLANNED ROUTE (प्लांट रूट) */}
      {activeTab === "route" && (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          <View className="mb-4">
            <Text className="text-base font-bold text-bark mb-1">Optimized Pickup Route</Text>
            <Text className="text-xs text-bark/60 mb-3">
              Ordered sequence of all pending customer stops near you.
            </Text>

            {coords && (
              <LeafletMap
                center={coords}
                markers={[
                  { id: "self", latitude: coords.latitude, longitude: coords.longitude, isSelf: true },
                  ...routeStops.map((s, idx) => ({
                    id: s.id,
                    latitude: s.pickup_lat ?? coords.latitude + (idx + 1) * 0.005,
                    longitude: s.pickup_lng ?? coords.longitude + (idx + 1) * 0.005,
                    label: `Stop ${idx + 1}`,
                  })),
                ]}
              />
            )}
          </View>

          {routeStops.length === 0 ? (
            <View className="bg-sand rounded-card p-6 items-center border border-line">
              <MaterialCommunityIcons name="map-check-outline" size={40} color={theme.line} />
              <Text className="text-bark/70 text-center mt-3">All scheduled pickups are completed!</Text>
            </View>
          ) : (
            <View>
              <Text className="text-sm font-bold text-bark mb-3">
                Route Itinerary ({routeStops.length} Stops):
              </Text>
              {routeStops.map((stop, idx) => (
                <View key={stop.id} className="bg-sand border border-line rounded-card p-4 mb-3">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View className="w-7 h-7 rounded-full bg-leaf items-center justify-center mr-2">
                        <Text className="text-white font-bold text-xs">{idx + 1}</Text>
                      </View>
                      <Text className="font-bold text-bark text-base">Stop #{idx + 1}</Text>
                    </View>
                    <View className="px-2 py-0.5 rounded-full bg-leafLight">
                      <Text className="text-xs font-bold text-leaf">{stop.time_slot ?? "Anytime"}</Text>
                    </View>
                  </View>

                  <Text className="text-xs text-bark/70 mb-1">
                    📍 {stop.pickup_address ?? "Customer Location nearby"}
                  </Text>
                  {stop.items && stop.items.length > 0 && (
                    <Text className="text-xs font-semibold text-bark mb-3">
                      📦 {stop.items.map((it) => `${it.category} (${it.quantity}${it.unit || "kg"})`).join(", ")}
                    </Text>
                  )}

                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        const lat = stop.pickup_lat ?? coords?.latitude;
                        const lng = stop.pickup_lng ?? coords?.longitude;
                        if (lat && lng) {
                          Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                        }
                      }}
                      className="flex-1 py-2 px-3 bg-paper border border-line rounded-xl flex-row items-center justify-center"
                    >
                      <MaterialCommunityIcons name="navigation-variant" size={16} color={theme.leaf} />
                      <Text className="text-xs font-bold text-bark ml-1.5">Open in Google Maps</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => openCollectModal(stop)}
                      className="py-2 px-4 bg-leaf rounded-xl items-center justify-center"
                    >
                      <Text className="text-xs font-bold text-white">Collect</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* TAB 3: WASTE LEDGER (कबाड़ खाता) */}
      {activeTab === "ledger" && (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Summary Cards */}
          <View className="flex-row mb-3">
            <View className="flex-1 bg-leaf rounded-card p-4 mr-2">
              <Text className="text-white/80 text-xs">Total Inflow (Intake)</Text>
              <Text className="text-white text-xl font-bold mt-1">
                {Number(ledger?.totalIntakeKg ?? 0).toFixed(1)} kg
              </Text>
              <Text className="text-white/80 text-xs mt-0.5">Paid: ₹{Number(ledger?.totalIntakeSpent ?? 0).toFixed(0)}</Text>
            </View>
            <View className="flex-1 bg-clay rounded-card p-4 ml-2">
              <Text className="text-white/80 text-xs">Total Outflow (Officers)</Text>
              <Text className="text-white text-xl font-bold mt-1">
                {Number(ledger?.totalOutgoingKg ?? 0).toFixed(1)} kg
              </Text>
              <Text className="text-white/80 text-xs mt-0.5">Earned: ₹{Number(ledger?.totalOutgoingEarned ?? 0).toFixed(0)}</Text>
            </View>
          </View>

          {/* Current In-Stock Banner */}
          <View className="bg-sand border border-line rounded-card p-3.5 mb-4 flex-row justify-between items-center">
            <View>
              <Text className="text-xs text-bark/60">Current Stock Inventory</Text>
              <Text className="text-lg font-bold text-bark mt-0.5">
                {Number(ledger?.stockBalanceKg ?? 0).toFixed(1)} kg held
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(kabadiwala)/sell-to-officer")}
              className="py-2.5 px-4 bg-clay rounded-xl flex-row items-center"
            >
              <MaterialCommunityIcons name="truck-fast-outline" size={18} color="#fff" />
              <Text className="text-white font-bold text-xs ml-1.5">Handover to Officer</Text>
            </Pressable>
          </View>

          {/* Ledger Sub-tabs */}
          <View className="flex-row mb-3 bg-sand rounded-xl p-1 border border-line">
            <Pressable
              onPress={() => setLedgerSubTab("intake")}
              className={`flex-1 py-2 rounded-lg items-center ${
                ledgerSubTab === "intake" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text className={`font-bold text-xs ${ledgerSubTab === "intake" ? "text-bark" : "text-bark/60"}`}>
                Intake from Customers ({ledger?.intakeRows?.length ?? 0})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLedgerSubTab("outgoing")}
              className={`flex-1 py-2 rounded-lg items-center ${
                ledgerSubTab === "outgoing" ? "bg-white shadow-sm" : ""
              }`}
            >
              <Text className={`font-bold text-xs ${ledgerSubTab === "outgoing" ? "text-bark" : "text-bark/60"}`}>
                Outgoing to Officers ({ledger?.outgoingRows?.length ?? 0})
              </Text>
            </Pressable>
          </View>

          {/* Ledger Rows */}
          {ledgerSubTab === "intake" ? (
            !ledger?.intakeRows || ledger.intakeRows.length === 0 ? (
              <View className="bg-sand rounded-card p-6 items-center border border-line">
                <Text className="text-xs text-bark/60">No customer intake transactions logged yet.</Text>
              </View>
            ) : (
              ledger.intakeRows.map((row: any) => (
                <View key={row.id} className="bg-sand border border-line rounded-card p-3.5 mb-2.5">
                  <View className="flex-row justify-between items-start">
                    <View>
                      <Text className="font-bold text-bark capitalize">{row.material_category ?? "Scrap"}</Text>
                      <Text className="text-xs text-bark/60 mt-0.5">
                        From: {row.counterpart?.name ?? "Customer"} • {new Date(row.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="font-bold text-leaf">₹{Number(row.price ?? 0).toFixed(0)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-line/40">
                    <Text className="text-xs font-semibold text-bark">{Number(row.quantity ?? 0)} kg</Text>
                    <View className="px-2 py-0.5 bg-paper rounded border border-line">
                      <Text className="text-xs text-bark/70">{row.quality ?? "Grade A"}</Text>
                    </View>
                  </View>
                </View>
              ))
            )
          ) : !ledger?.outgoingRows || ledger.outgoingRows.length === 0 ? (
            <View className="bg-sand rounded-card p-6 items-center border border-line">
              <Text className="text-xs text-bark/60">No handovers to officers recorded yet.</Text>
            </View>
          ) : (
            ledger.outgoingRows.map((row: any) => (
              <View key={row.id} className="bg-sand border border-line rounded-card p-3.5 mb-2.5">
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="font-bold text-bark capitalize">{row.material_category ?? "Scrap"}</Text>
                    <Text className="text-xs text-bark/60 mt-0.5">
                      To: {row.counterpart?.name ?? "Officer"} • {new Date(row.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text className="font-bold text-clay">₹{Number(row.price ?? 0).toFixed(0)}</Text>
                </View>
                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-line/40">
                  <Text className="text-xs font-semibold text-bark">{Number(row.quantity ?? 0)} kg</Text>
                  <View className="px-2 py-0.5 bg-paper rounded border border-line">
                    <Text className="text-xs text-bark/70">{row.quality ?? "Grade A"}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* MARK COLLECTED & QUALITY MODAL */}
      <Modal visible={!!collectingBooking} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-paper rounded-t-3xl p-5">
            <View className="flex-row justify-between items-center pb-3 border-b border-line mb-4">
              <Text className="text-lg font-bold text-bark">Record Scrap Intake</Text>
              <Pressable onPress={() => setCollectingBooking(null)}>
                <MaterialCommunityIcons name="close" size={24} color={theme.bark} />
              </Pressable>
            </View>

            <Text className="text-xs font-semibold text-bark mb-1.5">Measured Weight / Quantity (kg)</Text>
            <TextInput
              value={collectWeight}
              onChangeText={(v) => setCollectWeight(v.replace(/[^0-9.]/g, ""))}
              placeholder="0.0 kg"
              keyboardType="decimal-pad"
              className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            />

            <Text className="text-xs font-semibold text-bark mb-1.5">Agreed Price Paid (₹)</Text>
            <TextInput
              value={collectPrice}
              onChangeText={(v) => setCollectPrice(v.replace(/[^0-9.]/g, ""))}
              placeholder="₹ 0"
              keyboardType="decimal-pad"
              className="bg-sand border border-line rounded-card px-4 py-3 mb-3 text-base text-bark"
            />

            <Text className="text-xs font-semibold text-bark mb-2">Scrap Quality Inspection</Text>
            <View className="gap-2 mb-5">
              {QUALITY_GRADES.map((q) => {
                const label = q.id === "grade_a" ? "Grade A (Clean & Segregated)" : q.id === "grade_b" ? "Grade B (Semi-sorted)" : "Grade C (Mixed / Wet)";
                const isSelected = collectQuality.startsWith(q.id === "grade_a" ? "Grade A" : q.id === "grade_b" ? "Grade B" : "Grade C");
                return (
                  <Pressable
                    key={q.id}
                    onPress={() => setCollectQuality(label)}
                    className={`p-3 rounded-card border flex-row items-center justify-between ${
                      isSelected ? "bg-leafLight border-leaf" : "bg-sand border-line"
                    }`}
                  >
                    <Text className={`font-semibold text-xs ${isSelected ? "text-leaf" : "text-bark"}`}>
                      {label}
                    </Text>
                    <MaterialCommunityIcons
                      name={isSelected ? "radiobox-marked" : "radiobox-blank"}
                      size={20}
                      color={isSelected ? theme.leaf : theme.line}
                    />
                  </Pressable>
                );
              })}
            </View>

            <PrimaryButton
              label="Save to Waste Ledger"
              onPress={submitCollection}
              loading={submittingCollection}
            />
          </View>
        </View>
      </Modal>

      {/* Universal Settings & Permissions Modal */}
      <AppSettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </ScreenContainer>
  );
}
