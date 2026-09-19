import { supabase } from "../supabase";
import { sendPushToUser } from "../notifications";

export type BookingStatus = "requested" | "accepted" | "in_progress" | "collected" | "completed" | "cancelled";

export interface ScrapItemDraft {
  category: string;
  subCategory?: string | null;
  quantity: number;
  unit?: string;
  photoUrl?: string;
}

export interface Booking {
  id: string;
  listing_id?: string | null;
  customer_id: string;
  kabadiwala_id: string;
  status: BookingStatus;
  price_agreed?: number | null;
  time_slot?: string | null;
  scheduled_date?: string | null;
  pickup_address?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  items?: ScrapItemDraft[] | null;
  notes?: string | null;
  created_at: string;
  scrap_listings?: any;
  customer?: any;
  kabadiwala?: any;
}

/** Customer directly books a chosen Kabadiwala */
export async function createCustomerBooking(params: {
  customerId: string;
  kabadiwalaId: string;
  items: ScrapItemDraft[];
  timeSlot: string;
  scheduledDate?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  listingId?: string;
}) {
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      customer_id: params.customerId,
      kabadiwala_id: params.kabadiwalaId,
      status: "requested",
      items: params.items,
      time_slot: params.timeSlot,
      scheduled_date: params.scheduledDate ?? new Date().toISOString().split("T")[0],
      pickup_address: params.address ?? null,
      pickup_lat: params.latitude ?? null,
      pickup_lng: params.longitude ?? null,
      notes: params.notes ?? null,
      listing_id: params.listingId ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  void sendPushToUser(
    params.kabadiwalaId,
    "Kawa • New Booking Request",
    `A customer requested a scrap pickup for ${params.timeSlot}.`,
    { bookingId: booking.id }
  );

  return booking as Booking;
}

/** Update booking status */
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  priceAgreed?: number
) {
  const updatePayload: any = { status };
  if (priceAgreed !== undefined) updatePayload.price_agreed = priceAgreed;

  const { data, error } = await supabase
    .from("bookings")
    .update(updatePayload)
    .eq("id", bookingId)
    .select()
    .single();

  if (error) throw error;
  return data as Booking;
}

/** Kabadiwala books an available listing */
export async function bookListing(params: {
  listingId: string;
  customerId: string;
  kabadiwalaId: string;
}) {
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      listing_id: params.listingId,
      customer_id: params.customerId,
      kabadiwala_id: params.kabadiwalaId,
      status: "accepted",
    })
    .select()
    .single();
  if (bookingError) throw bookingError;

  const { error: listingError } = await supabase
    .from("scrap_listings")
    .update({ status: "booked" })
    .eq("id", params.listingId);
  if (listingError) throw listingError;

  void sendPushToUser(
    params.customerId,
    "Kawa • Pickup booked",
    "A Kabadiwala has booked your scrap listing.",
    { listingId: params.listingId, bookingId: booking.id }
  );

  return booking as Booking;
}

export async function getBookingsForCustomer(customerId: string) {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, scrap_listings(*), kabadiwala:profiles!kabadiwala_id(id, name, shop_name, phone, whatsapp, address)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (!error && data) return data;
  } catch {
    // fallback below
  }
  const { data: fallbackData } = await supabase
    .from("bookings")
    .select("*, scrap_listings(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  return fallbackData ?? [];
}

export async function getBookingsForKabadiwala(kabadiwalaId: string) {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, scrap_listings(*), customer:profiles!customer_id(id, name, phone, whatsapp, address)")
      .eq("kabadiwala_id", kabadiwalaId)
      .order("created_at", { ascending: false });
    if (!error && data) return data;
  } catch {
    // fallback below
  }
  const { data: fallbackData } = await supabase
    .from("bookings")
    .select("*, scrap_listings(*)")
    .eq("kabadiwala_id", kabadiwalaId)
    .order("created_at", { ascending: false });
  return fallbackData ?? [];
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, scrap_listings(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getBookingByListingId(listingId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, scrap_listings(*)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
