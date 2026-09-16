import { supabase } from "../supabase";

export async function getKabadiwalaRating(kabadiwalaId: string) {
  const { data, error } = await supabase
    .from("ratings")
    .select("rating,comment,created_at,customer_id")
    .eq("kabadiwala_id", kabadiwalaId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const average = rows.length
    ? rows.reduce((sum, row) => sum + Number(row.rating), 0) / rows.length
    : 0;
  return { average, count: rows.length, rows };
}

export async function getCustomerRatingForBooking(params: {
  customerId: string;
  kabadiwalaId: string;
}) {
  const { data, error } = await supabase
    .from("ratings")
    .select("id,rating,comment,created_at")
    .eq("customer_id", params.customerId)
    .eq("kabadiwala_id", params.kabadiwalaId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function submitKabadiwalaRating(params: {
  customerId: string;
  kabadiwalaId: string;
  rating: number;
  comment?: string;
}) {
  const existing = await getCustomerRatingForBooking({
    customerId: params.customerId,
    kabadiwalaId: params.kabadiwalaId,
  });

  if (existing) {
    const { error } = await supabase
      .from("ratings")
      .update({ rating: params.rating, comment: params.comment ?? null })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("ratings").insert({
      customer_id: params.customerId,
      kabadiwala_id: params.kabadiwalaId,
      rating: params.rating,
      comment: params.comment ?? null,
    });
    if (error) throw error;
  }

}
