import { supabase } from "../supabase";
import { sendPushToUser } from "../notifications";

export type BookingStatus = "requested" | "accepted" | "collected" | "completed";

export interface Booking {
  id: string;
  listing_id: string;
  customer_id: string;
  kabadiwala_id: string;
  status: BookingStatus;
  price_agreed: number | null;
  created_at: string;
}

/** Kabadiwala books an available listing: creates the booking row and
 * flips the listing to "booked" so it drops out of other kabadiwalas'
 * nearby lists. */
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
  const { data, error } = await supabase
    .from("bookings")
    .select("*, scrap_listings(*)")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getBookingsForKabadiwala(kabadiwalaId: string) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, scrap_listings(*)")
    .eq("kabadiwala_id", kabadiwalaId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
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

/** Phase 1 assumes at most one active booking per listing, so the
 * customer's booking-status screen can look a booking up by listing
 * id instead of needing to know the booking id. */
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
