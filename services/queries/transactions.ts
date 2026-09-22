import { getBookingById } from "./bookings";
import { getProfilesByIds } from "./profiles";
import { supabase } from "../supabase";
import { sendPushToUser } from "../notifications";
import { SCRAP_PRICE_CATALOG } from "../../constants/scrapPricing";

export const QUALITY_GRADES = [
  { id: "grade_a", labelKey: "quality.gradeA", descriptionKey: "quality.gradeADesc" },
  { id: "grade_b", labelKey: "quality.gradeB", descriptionKey: "quality.gradeBDesc" },
  { id: "grade_c", labelKey: "quality.gradeC", descriptionKey: "quality.gradeCDesc" },
] as const;

/**
 * Phase 1 handover: customer -> kabadiwala.
 * Supports actual measured quantity, agreed price, and scrap quality grading.
 */
export async function markBookingCollected(params: {
  bookingId: string;
  price: number;
  actualQuantity?: number;
  quality?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}) {
  const booking = await getBookingById(params.bookingId);
  if (!booking) throw new Error("Booking not found.");

  const listing = (booking as any).scrap_listings;
  const items = (booking as any).items as any[] | undefined;

  let materialCategory = listing?.category ?? null;
  let quantity = params.actualQuantity ?? listing?.quantity ?? null;

  // Fallback to first item if created through direct booking wizard
  if (!materialCategory && items && items.length > 0) {
    materialCategory = items.map((it) => it.category).join(", ");
    if (!quantity) {
      quantity = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    }
  }

  const { error: txError } = await supabase.from("transactions").insert({
    from_user_id: booking.customer_id,
    to_user_id: booking.kabadiwala_id,
    from_role: "customer",
    to_role: "kabadiwala",
    material_category: materialCategory,
    quantity: quantity,
    price: params.price,
    photos: listing?.photos ?? null,
    quality: params.quality ?? "Grade A (Clean)",
    notes: params.notes ?? null,
    location:
      params.latitude != null && params.longitude != null
        ? `POINT(${params.longitude} ${params.latitude})`
        : null,
  });
  if (txError) throw txError;

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({ status: "collected", price_agreed: params.price })
    .eq("id", params.bookingId);
  if (bookingError) throw bookingError;

  if (booking.listing_id) {
    const { error: listingError } = await supabase
      .from("scrap_listings")
      .update({ status: "collected" })
      .eq("id", booking.listing_id);
    if (listingError) throw listingError;
  }

  void sendPushToUser(
    booking.kabadiwala_id,
    "Kawa • Collection updated",
    "The pickup has been marked as collected.",
    { bookingId: booking.id }
  );
  void sendPushToUser(
    booking.customer_id,
    "Kawa • Scrap collected",
    "Your scrap handover has been completed. Please rate your Kabadiwala.",
    { bookingId: booking.id }
  );
}

/**
 * Phase 2 handover: kabadiwala -> officer.
 * Allows recording material category, quantity, price, and quality grade.
 */
export async function recordOfficerSale(params: {
  kabadiwalaId: string;
  officerId: string;
  category: string;
  quantity: number;
  price: number;
  quality?: string;
  notes?: string;
  photos?: string[];
  latitude?: number;
  longitude?: number;
}) {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      from_user_id: params.kabadiwalaId,
      to_user_id: params.officerId,
      from_role: "kabadiwala",
      to_role: "officer",
      material_category: params.category,
      quantity: params.quantity,
      price: params.price,
      quality: params.quality ?? "Grade A (Clean)",
      notes: params.notes ?? null,
      photos: params.photos ?? null,
      location:
        params.latitude != null && params.longitude != null
          ? `POINT(${params.longitude} ${params.latitude})`
          : null,
    })
    .select()
    .single();

  if (error) throw error;

  void sendPushToUser(
    params.officerId,
    "Kawa • New collection batch",
    "A Kabadiwala recorded a scrap handover to you.",
    { transactionId: data.id }
  );

  return data;
}

export async function getTransactionsForUser(userId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function recordDirectIntake(params: {
  kabadiwalaId: string;
  category: string;
  quantity: number;
  pricePaid: number;
  quality?: string;
  customerName?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
}) {
  const { data, error } = await supabase.from("transactions").insert({
    from_user_id: null,
    to_user_id: params.kabadiwalaId,
    from_role: "customer",
    to_role: "kabadiwala",
    material_category: params.category,
    quantity: params.quantity,
    price: params.pricePaid,
    quality: params.quality ?? "Grade A (Clean)",
    notes: params.notes ?? (params.customerName ? `Walk-in customer: ${params.customerName}` : "Direct intake"),
    location:
      params.latitude != null && params.longitude != null
        ? `POINT(${params.longitude} ${params.latitude})`
        : null,
  }).select().single();

  if (error) throw error;
  return data;
}

/** Kabadiwala's full Waste Ledger (Intake from Customers + Outgoing to Officers) */
export async function getKabadiwalaWasteLedger(
  kabadiwalaId: string,
  customPriceRates?: Record<string, number>
) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .or(`from_user_id.eq.${kabadiwalaId},to_user_id.eq.${kabadiwalaId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  const rows = data ?? [];

  // Intake: customer -> kabadiwala (to_user_id = kabadiwalaId)
  const intakeRows = rows.filter((r) => r.to_user_id === kabadiwalaId && r.from_role === "customer");
  // Outgoing: kabadiwala -> officer (from_user_id = kabadiwalaId)
  const outgoingRows = rows.filter((r) => r.from_user_id === kabadiwalaId && r.to_role === "officer");

  const totalIntakeKg = intakeRows.reduce((sum, r) => sum + Number(r.quantity ?? 0), 0);
  const totalOutgoingKg = outgoingRows.reduce((sum, r) => sum + Number(r.quantity ?? 0), 0);
  const totalIntakeSpent = intakeRows.reduce((sum, r) => sum + Number(r.price ?? 0), 0);
  const totalOutgoingEarned = outgoingRows.reduce((sum, r) => sum + Number(r.price ?? 0), 0);
  const stockBalanceKg = Math.max(0, totalIntakeKg - totalOutgoingKg);

  // Fetch linked counterpart profiles
  const counterProfileIds = [
    ...new Set([
      ...intakeRows.map((r) => r.from_user_id),
      ...outgoingRows.map((r) => r.to_user_id),
    ].filter(Boolean)),
  ];

  const counterProfiles = await getProfilesByIds(counterProfileIds as string[]);
  const profileMap = new Map(counterProfiles.map((p) => [p.id, p]));

  // Build itemized category analysis (हर टाइप के कबाड़ का अलग रिकॉर्ड)
  const categoryMap: Record<
    string,
    {
      key: string;
      nameEn: string;
      nameHi: string;
      icon: string;
      intakeKg: number;
      spent: number;
      outgoingKg: number;
      earned: number;
      stockKg: number;
      avgBuyRate: number;
      expectedOfficerRate: number;
      expectedOfficerPayout: number;
      expectedProfit: number;
    }
  > = {};

  for (const item of SCRAP_PRICE_CATALOG) {
    categoryMap[item.key.toLowerCase()] = {
      key: item.key,
      nameEn: item.nameEn,
      nameHi: item.nameHi,
      icon: item.icon,
      intakeKg: 0,
      spent: 0,
      outgoingKg: 0,
      earned: 0,
      stockKg: 0,
      avgBuyRate: customPriceRates?.[item.key] ?? item.defaultBuyRate,
      expectedOfficerRate: item.expectedOfficerRate,
      expectedOfficerPayout: 0,
      expectedProfit: 0,
    };
  }

  function resolveCategoryKey(rawCat: string): string {
    const raw = (rawCat ?? "other").toLowerCase();
    const exact = Object.keys(categoryMap).find((k) => raw === k || raw.includes(k));
    if (exact) return exact;

    if (raw.includes("pcb") || raw.includes("circuit") || raw.includes("motherboard")) return "ewaste_pcb";
    if (raw.includes("batter")) return "ewaste_batteries";
    if (raw.includes("cable") || raw.includes("wire")) return "ewaste_cables";
    if (raw.includes("screen") || raw.includes("display") || raw.includes("monitor") || raw.includes("tv")) return "ewaste_screens";
    if (raw.includes("motor") || raw.includes("compressor") || raw.includes("fan")) return "ewaste_motors";
    if (raw.includes("phone") || raw.includes("mobile") || raw.includes("tablet")) return "ewaste_mobiles";
    if (raw.includes("appliance") || raw.includes("washing") || raw.includes("fridge")) return "ewaste_appliances";
    if (raw.includes("ewaste") || raw.includes("electronic")) return "ewaste";
    if (raw.includes("copper") || raw.includes("तांबा")) return "copper";
    if (raw.includes("brass") || raw.includes("पीतल")) return "brass";
    if (raw.includes("alumin") || raw.includes("एल्युमिनियम")) return "aluminium";
    if (raw.includes("iron") || raw.includes("steel") || raw.includes("लोहा")) return "iron";
    if (raw.includes("paper") || raw.includes("book") || raw.includes("newspaper") || raw.includes("अखबार")) return "paper";
    if (raw.includes("cardboard") || raw.includes("carton") || raw.includes("गत्ता")) return "cardboard";
    if (raw.includes("plastic") || raw.includes("bottle") || raw.includes("प्लास्टिक")) return "plastic";
    if (raw.includes("glass") || raw.includes("कांच")) return "glass";

    return "other";
  }

  // Populate from intake rows
  for (const r of intakeRows) {
    const rawCat = r.material_category ?? "other";
    const matchedKey = resolveCategoryKey(rawCat);
    const cat = categoryMap[matchedKey];
    if (cat) {
      cat.intakeKg += Number(r.quantity ?? 0);
      cat.spent += Number(r.price ?? 0);
    }
  }

  // Populate from outgoing rows
  for (const r of outgoingRows) {
    const rawCat = r.material_category ?? "other";
    const matchedKey = resolveCategoryKey(rawCat);
    const cat = categoryMap[matchedKey];
    if (cat) {
      cat.outgoingKg += Number(r.quantity ?? 0);
      cat.earned += Number(r.price ?? 0);
    }
  }

  let totalExpectedOfficerPayout = 0;
  let totalProjectedProfit = 0;

  const categoryBreakdown = Object.values(categoryMap).map((cat) => {
    cat.stockKg = Math.max(0, cat.intakeKg - cat.outgoingKg);
    if (cat.intakeKg > 0) {
      cat.avgBuyRate = Math.round((cat.spent / cat.intakeKg) * 10) / 10;
    }
    cat.expectedOfficerPayout = Math.round(cat.stockKg * cat.expectedOfficerRate);
    const heldBuyingCost = Math.round(cat.stockKg * cat.avgBuyRate);
    cat.expectedProfit = cat.expectedOfficerPayout - heldBuyingCost;

    totalExpectedOfficerPayout += cat.expectedOfficerPayout;
    totalProjectedProfit += cat.expectedProfit;
    return cat;
  });

  return {
    intakeRows: intakeRows.map((r) => ({ ...r, counterpart: profileMap.get(r.from_user_id) })),
    outgoingRows: outgoingRows.map((r) => ({ ...r, counterpart: profileMap.get(r.to_user_id) })),
    totalIntakeKg,
    totalOutgoingKg,
    totalIntakeSpent,
    totalOutgoingEarned,
    stockBalanceKg,
    categoryBreakdown,
    totalExpectedOfficerPayout,
    totalProjectedProfit,
  };
}

/**
 * Officer Master Transactions:
 * Provides full end-to-end visibility of both legs:
 * 1. Customer -> Kabadiwala intake
 * 2. Kabadiwala -> Officer outgoing/handover
 */
export async function getOfficerMasterTransactions(params?: {
  flow?: "all" | "officer_handovers" | "customer_intake";
  category?: string;
  quality?: string;
  minQuantity?: number;
}) {
  let query = supabase
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false });

  if (params?.flow === "officer_handovers") {
    query = query.eq("to_role", "officer").eq("from_role", "kabadiwala");
  } else if (params?.flow === "customer_intake") {
    query = query.eq("to_role", "kabadiwala").eq("from_role", "customer");
  }

  if (params?.category) query = query.eq("material_category", params.category);
  if (params?.quality) query = query.eq("quality", params.quality);
  if (params?.minQuantity != null && params?.minQuantity > 0) {
    query = query.gte("quantity", params.minQuantity);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];

  const profileIds = [
    ...new Set([
      ...rows.map((row) => row.from_user_id),
      ...rows.map((row) => row.to_user_id),
    ].filter(Boolean)),
  ];

  const profiles = await getProfilesByIds(profileIds as string[]);
  const profileMap = new Map(profiles.map((item) => [item.id, item]));

  return rows.map((row) => ({
    ...row,
    from_profile: profileMap.get(row.from_user_id) ?? null,
    to_profile: profileMap.get(row.to_user_id) ?? null,
  }));
}

export async function getOfficerRecords(params: {
  officerId: string;
  kabadiwalaId?: string;
  category?: string;
  minQuantity?: number;
}) {
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("to_user_id", params.officerId)
    .eq("to_role", "officer")
    .eq("from_role", "kabadiwala")
    .order("created_at", { ascending: false });

  if (params.kabadiwalaId) query = query.eq("from_user_id", params.kabadiwalaId);
  if (params.category) query = query.eq("material_category", params.category);
  if (params.minQuantity != null && params.minQuantity > 0) {
    query = query.gte("quantity", params.minQuantity);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  const profileIds = [...new Set(rows.map((row) => row.from_user_id).filter(Boolean))];
  const profiles = await getProfilesByIds(profileIds as string[]);
  const profileMap = new Map(profiles.map((item) => [item.id, item]));
  return rows.map((row) => ({ ...row, from_profile: profileMap.get(row.from_user_id) ?? null }));
}

export async function getPriceTrend(category?: string) {
  const { data, error } = await supabase.rpc("get_price_trend", {
    material: category || null,
    days_back: 90,
  });
  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    date: row.date,
    avgPrice: Number(row.avg_price ?? 0),
    totalQuantity: Number(row.total_quantity ?? 0),
  }));
}
