import { getBookingById } from "./bookings";
import { getProfilesByIds } from "./profiles";
import { supabase } from "../supabase";
import { sendPushToUser } from "../notifications";

/**
 * Phase 1 handover: customer -> kabadiwala.
 */
export async function markBookingCollected(params: {
  bookingId: string;
  price: number;
  latitude?: number;
  longitude?: number;
}) {
  const booking = await getBookingById(params.bookingId);
  if (!booking) throw new Error("Booking not found.");

  const listing = (booking as any).scrap_listings;

  const { error: txError } = await supabase.from("transactions").insert({
    from_user_id: booking.customer_id,
    to_user_id: booking.kabadiwala_id,
    from_role: "customer",
    to_role: "kabadiwala",
    material_category: listing?.category ?? null,
    quantity: listing?.quantity ?? null,
    price: params.price,
    photos: listing?.photos ?? null,
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

  const { error: listingError } = await supabase
    .from("scrap_listings")
    .update({ status: "collected" })
    .eq("id", booking.listing_id);
  if (listingError) throw listingError;

  void sendPushToUser(
    booking.kabadiwala_id,
    "Kawa • Collection updated",
    "The customer marked your pickup as collected.",
    { bookingId: booking.id }
  );
  void sendPushToUser(
    booking.customer_id,
    "Kawa • Scrap collected",
    "Your scrap handover has been marked collected.",
    { bookingId: booking.id }
  );
}

/**
 * Phase 2 handover: kabadiwala -> officer.
 * The app inserts directly as the kabadiwala, while the officer role
 * remains read-only at the transactions layer.
 */
export async function recordOfficerSale(params: {
  kabadiwalaId: string;
  officerId: string;
  category: string;
  quantity: number;
  price: number;
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
    "Kawa • New collection",
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
