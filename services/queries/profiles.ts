import { supabase } from "../supabase";

export async function getProfilesByIds(ids: string[]) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id,role,name,phone,photo_url,verified,rating,location")
    .in("id", ids);
  if (error) throw error;
  return data ?? [];
}

export async function getProfileById(id: string) {
  const rows = await getProfilesByIds([id]);
  return rows[0] ?? null;
}

export async function getVerifiedOfficers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,role,name,rating,verified")
    .eq("role", "officer")
    .eq("verified", true)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getNearbyKabadiwalas(params: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}) {
  const { data, error } = await supabase.rpc("get_nearby_kabadiwalas", {
    lat: params.latitude,
    lng: params.longitude,
    radius_m: params.radiusMeters ?? 10000,
  });
  if (error) throw error;
  return data ?? [];
}

export async function updatePushToken(userId: string, token: string | null) {
  const { error } = await supabase
    .from("profiles")
    .update({ push_token: token })
    .eq("id", userId);
  if (error) throw error;
}
