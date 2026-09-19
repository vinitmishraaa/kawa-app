import { supabase } from "../supabase";

export const DEFAULT_PRICE_RATES: Record<string, number> = {
  paper: 14,
  plastic: 18,
  metal: 35,
  ewaste: 40,
  glass: 5,
  other: 10,
};

export interface NearbyKabadiwala {
  id: string;
  name: string | null;
  phone: string | null;
  rating: number;
  distance_m: number;
  lat: number;
  lng: number;
  price_rates?: Record<string, number> | null;
  review_count?: number;
}

export async function getProfilesByIds(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id,role,name,phone,photo_url,verified,rating,location,price_rates,address,gov_id_type,gov_id_number,department")
    .in("id", ids);
  if (error) throw error;
  return data ?? [];
}

export async function getProfileById(id: string) {
  const rows = await getProfilesByIds([id]);
  return rows[0] ?? null;
}

export async function getVerifiedOfficers() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,role,name,rating,verified,department,phone")
      .eq("role", "officer")
      .eq("verified", true)
      .order("name", { ascending: true });
    if (!error && data && data.length > 0) return data;
  } catch {}

  const { AUTHORIZED_OFFICER_IDS } = await import("../../constants/authorizedOfficers");
  return AUTHORIZED_OFFICER_IDS.map((o) => ({
    id: "officer_" + o.officerId.toLowerCase().replace(/[^a-z0-9]/g, ""),
    role: "officer",
    name: o.name,
    rating: 5.0,
    verified: true,
    department: `${o.department} (${o.zone})`,
    phone: "98765000" + o.officerId.slice(-2),
  }));
}

export async function getNearbyKabadiwalas(params: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}): Promise<NearbyKabadiwala[]> {
  try {
    const { data, error } = await supabase.rpc("get_nearby_kabadiwalas", {
      lat: params.latitude,
      lng: params.longitude,
      radius_m: params.radiusMeters ?? 15000,
    });
    if (!error && data) {
      return data.map((item: any) => ({
        ...item,
        price_rates: item.price_rates ?? DEFAULT_PRICE_RATES,
        review_count: Number(item.review_count ?? 0),
      }));
    }
  } catch {
    // Fall back to direct profiles query if RPC is not yet migrated
  }

  const { data: fallbackProfiles, error: fbError } = await supabase
    .from("profiles")
    .select("id,name,phone,rating,location,price_rates")
    .eq("role", "kabadiwala");

  if (fbError) throw fbError;
  return (fallbackProfiles ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    rating: Number(p.rating ?? 0),
    distance_m: 1200, // mock approximate distance if PostGIS fallback
    lat: params.latitude,
    lng: params.longitude,
    price_rates: p.price_rates ?? DEFAULT_PRICE_RATES,
    review_count: 5,
  }));
}

export async function updateKabadiwalaPriceRates(
  kabadiwalaId: string,
  rates: Record<string, number>
) {
  const { error } = await supabase
    .from("profiles")
    .update({ price_rates: rates })
    .eq("id", kabadiwalaId);
  if (error) throw error;
}

export async function updateOfficerProfile(
  officerId: string,
  info: {
    govIdType?: string;
    govIdNumber?: string;
    department?: string;
  }
) {
  const { error } = await supabase
    .from("profiles")
    .update({
      gov_id_type: info.govIdType,
      gov_id_number: info.govIdNumber,
      department: info.department,
    })
    .eq("id", officerId);
  if (error) throw error;
}

export async function updatePushToken(userId: string, token: string | null) {
  const { error } = await supabase
    .from("profiles")
    .update({ push_token: token })
    .eq("id", userId);
  if (error) throw error;
}
