// SDK 57's default `expo-file-system` export is the new File/Directory
// API — the old `readAsStringAsync`/`EncodingType` helpers now live
// under `expo-file-system/legacy` and throw a deprecation error if
// imported from the main entry point. `File#base64()` is the SDK 57
// equivalent for reading a local photo into a base64 string.
import { File } from "expo-file-system";
import { decode as decodeBase64 } from "base64-arraybuffer";
import { supabase } from "../supabase";

export type ListingStatus = "available" | "booked" | "collected";

export interface ScrapListing {
  id: string;
  customer_id: string;
  photos: string[];
  category: string;
  sub_category: string | null;
  quantity: number | null;
  unit: string | null;
  estimated_price: number | null;
  status: ListingStatus;
  created_at: string;
}

export interface NearbyListing extends ScrapListing {
  distance_m: number;
  lat: number;
  lng: number;
}

/** Uploads one photo (local file uri from expo-camera/expo-image-picker)
 * to the `listing-photos` storage bucket and returns its public URL. */
export async function uploadListingPhoto(localUri: string, customerId: string) {
  const fileExt = localUri.split(".").pop() ?? "jpg";
  const path = `${customerId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${fileExt}`;

  const file = new File(localUri);
  const base64 = await file.base64();

  const { error } = await supabase.storage
    .from("listing-photos")
    .upload(path, decodeBase64(base64), {
      contentType: `image/${fileExt}`,
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data.publicUrl;
}

export async function createScrapListing(params: {
  customerId: string;
  photos: string[];
  category: string;
  subCategory?: string;
  quantity: number;
  unit: string;
  latitude: number;
  longitude: number;
}) {
  const { error } = await supabase.from("scrap_listings").insert({
    customer_id: params.customerId,
    photos: params.photos,
    category: params.category,
    sub_category: params.subCategory ?? null,
    quantity: params.quantity,
    unit: params.unit,
    location: `POINT(${params.longitude} ${params.latitude})`,
  });
  if (error) throw error;
}

export async function getMyListings(customerId: string) {
  const { data, error } = await supabase
    .from("scrap_listings")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as ScrapListing[];
}

/** Nearby available listings, sorted by distance — backed by the
 * `get_nearby_listings` PostGIS function defined in supabase/schema.sql. */
export async function getNearbyListings(params: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}) {
  const { data, error } = await supabase.rpc("get_nearby_listings", {
    lat: params.latitude,
    lng: params.longitude,
    radius_m: params.radiusMeters ?? 10000,
  });
  if (error) throw error;
  return data as NearbyListing[];
}

export async function getListingById(id: string) {
  const { data, error } = await supabase
    .from("scrap_listings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as ScrapListing;
}
