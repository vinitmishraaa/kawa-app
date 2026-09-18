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
  govIdType?: string;
  govIdNumber?: string;
  department?: string;
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

  if (params.govIdNumber || params.department) {
    await supabase
      .from("profiles")
      .update({
        gov_id_type: params.govIdType ?? "Government ID",
        gov_id_number: params.govIdNumber,
        department: params.department,
      })
      .eq("id", params.officerId);
  }

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

/**
 * Enhanced Officer Summary:
 * Aggregates both:
 * 1. Outflow handovers directly received by officers (Kabadiwala -> Officer)
 * 2. Inflow waste collected by Kabadiwalas from citizens (Customer -> Kabadiwala)
 * 3. Quality & material distribution metrics
 */
export async function getOfficerSummary(officerId: string) {
  // Query all transactions accessible to verified officers
  const { data, error } = await supabase
    .from("transactions")
    .select("id,quantity,price,material_category,quality,created_at,from_user_id,from_role,to_user_id,to_role")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const allRows = data ?? [];

  // 1. Customer -> Kabadiwala Inflow
  const inflowRows = allRows.filter(
    (r) => r.from_role === "customer" && r.to_role === "kabadiwala"
  );
  const totalInflowKg = inflowRows.reduce((sum, r) => sum + Number(r.quantity ?? 0), 0);
  const totalInflowValue = inflowRows.reduce((sum, r) => sum + Number(r.price ?? 0), 0);

  // 2. Kabadiwala -> Officer Outflow
  const outflowRows = allRows.filter(
    (r) => r.from_role === "kabadiwala" && r.to_role === "officer"
  );
  const totalOutflowKg = outflowRows.reduce((sum, r) => sum + Number(r.quantity ?? 0), 0);
  const totalOutflowValue = outflowRows.reduce((sum, r) => sum + Number(r.price ?? 0), 0);

  // In-network / Held scrap balance
  const activeStockInCirculation = Math.max(0, totalInflowKg - totalOutflowKg);

  // Direct handovers to this officer
  const myHandovers = outflowRows.filter((r) => r.to_user_id === officerId);

  // Quality distribution
  const qualityCounts: Record<string, number> = { "Grade A": 0, "Grade B": 0, "Grade C": 0 };
  for (const r of allRows) {
    const q = r.quality ?? "Grade A";
    if (q.includes("Grade A")) qualityCounts["Grade A"]++;
    else if (q.includes("Grade B")) qualityCounts["Grade B"]++;
    else if (q.includes("Grade C")) qualityCounts["Grade C"]++;
    else qualityCounts["Grade A"]++;
  }

  return {
    allRows,
    inflowRows,
    outflowRows,
    myHandovers,
    totalInflowKg,
    totalInflowValue,
    totalOutflowKg,
    totalOutflowValue,
    activeStockInCirculation,
    qualityCounts,
    totalTransactions: allRows.length,
    materialTypesCount: new Set(allRows.map((r) => r.material_category).filter(Boolean)).size,
  };
}
