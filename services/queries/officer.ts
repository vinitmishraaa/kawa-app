import { File } from "expo-file-system";
import { decode as decodeBase64 } from "base64-arraybuffer";
import { supabase } from "../supabase";

export async function uploadOfficerDocument(localUri: string, officerId: string) {
  const fileExt = localUri.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = fileExt === "jpeg" ? "jpg" : fileExt;
  const path = `${officerId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.${safeExt}`;

  const file = new File(localUri);
  const base64 = await file.base64();

  const { error } = await supabase.storage
    .from("officer-documents")
    .upload(path, decodeBase64(base64), {
      contentType: safeExt === "pdf" ? "application/pdf" : `image/${safeExt}`,
      upsert: false,
    });
  if (error) throw error;
  return path;
}

export async function submitOfficerVerification(params: {
  officerId: string;
  documentPaths: string[];
}) {
  const { error: deleteError } = await supabase
    .from("officer_verifications")
    .delete()
    .eq("officer_id", params.officerId)
    .eq("status", "pending");

  if (deleteError && !deleteError.message.toLowerCase().includes("permission")) {
    throw deleteError;
  }

  const { data, error } = await supabase
    .from("officer_verifications")
    .insert({
      officer_id: params.officerId,
      document_urls: params.documentPaths,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOfficerVerification(officerId: string) {
  const { data, error } = await supabase
    .from("officer_verifications")
    .select("*")
    .eq("officer_id", officerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getOfficerSummary(officerId: string) {
  const { data, error } = await supabase
    .from("transactions")
    .select("quantity,price,material_category,created_at,from_user_id,from_role,to_user_id,to_role")
    .eq("to_user_id", officerId)
    .eq("to_role", "officer")
    .eq("from_role", "kabadiwala")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  return {
    rows,
    totalQuantity: rows.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0),
    totalValue: rows.reduce((sum, row) => sum + Number(row.price ?? 0), 0),
    handovers: rows.length,
  };
}
