import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../supabase";
import { sendPushToUser } from "../notifications";

export interface MunicipalNotice {
  id: string;
  officer_id: string;
  officer_name: string;
  officer_department: string;
  kabadiwala_id: string;
  kabadiwala_name: string;
  kabadiwala_phone?: string;
  stock_held_kg: number;
  days_overdue: number;
  notice_type: "warning" | "legal_notice" | "final_order";
  subject: string;
  message: string;
  issued_at: string;
  status: "pending" | "acknowledged" | "resolved";
}

export interface MonitoredKabadiwala {
  id: string;
  name: string;
  shop_name?: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  stock_held_kg: number;
  days_overdue: number;
  last_handover_date?: string;
  active_notice_count: number;
}

const STORAGE_KEY = "@kawa_municipal_notices";

// Helper to read local notices (real notices only)
async function getStoredNotices(): Promise<MunicipalNotice[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Helper to write local notices
async function saveStoredNotices(notices: MunicipalNotice[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
  } catch (err) {
    console.warn("Failed to persist notices in AsyncStorage:", err);
  }
}

/**
 * Send a formal Municipal Notice from an Officer to a Kabadiwala
 */
export async function sendMunicipalNotice(params: {
  officer_id: string;
  officer_name: string;
  officer_department: string;
  kabadiwala_id: string;
  kabadiwala_name: string;
  kabadiwala_phone?: string;
  stock_held_kg: number;
  days_overdue: number;
  notice_type: "warning" | "legal_notice" | "final_order";
  subject: string;
  message: string;
}): Promise<MunicipalNotice> {
  const newNotice: MunicipalNotice = {
    id: `notice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...params,
    issued_at: new Date().toISOString(),
    status: "pending",
  };

  // 1. Try Supabase insert if table exists
  try {
    await supabase.from("municipal_notices").insert([
      {
        id: newNotice.id,
        officer_id: newNotice.officer_id,
        officer_name: newNotice.officer_name,
        officer_department: newNotice.officer_department,
        kabadiwala_id: newNotice.kabadiwala_id,
        kabadiwala_name: newNotice.kabadiwala_name,
        kabadiwala_phone: newNotice.kabadiwala_phone,
        stock_held_kg: newNotice.stock_held_kg,
        days_overdue: newNotice.days_overdue,
        notice_type: newNotice.notice_type,
        subject: newNotice.subject,
        message: newNotice.message,
        issued_at: newNotice.issued_at,
        status: newNotice.status,
      },
    ]);
  } catch {
    // Graceful fallback to local persistence
  }

  // 2. Persist in AsyncStorage
  const list = await getStoredNotices();
  list.unshift(newNotice);
  await saveStoredNotices(list);

  // 3. Dispatch real Push Notification if Kabadiwala is registered
  try {
    await sendPushToUser(
      params.kabadiwala_id,
      `🚨 ${params.subject}`,
      `${params.message.slice(0, 100)}...`,
      { noticeId: newNotice.id, type: "municipal_notice" }
    );
  } catch (pushErr) {
    console.log("Push notification skipped:", pushErr);
  }

  return newNotice;
}

/**
 * Get all active and past notices for a given Kabadiwala (Real data only)
 */
export async function getNoticesForKabadiwala(kabadiwalaId: string): Promise<MunicipalNotice[]> {
  try {
    const { data, error } = await supabase
      .from("municipal_notices")
      .select("*")
      .eq("kabadiwala_id", kabadiwalaId)
      .order("issued_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch {
    // Ignore and fallback
  }

  const list = await getStoredNotices();
  return list.filter((n) => n.kabadiwala_id === kabadiwalaId);
}

/**
 * Get notices issued by a specific officer (Real data only)
 */
export async function getIssuedNoticesByOfficer(officerId: string): Promise<MunicipalNotice[]> {
  try {
    const { data, error } = await supabase
      .from("municipal_notices")
      .select("*")
      .eq("officer_id", officerId)
      .order("issued_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch {
    // Ignore and fallback
  }

  const list = await getStoredNotices();
  return list.filter((n) => n.officer_id === officerId);
}

/**
 * Mark a notice as acknowledged by Kabadiwala
 */
export async function acknowledgeNotice(noticeId: string): Promise<void> {
  try {
    await supabase
      .from("municipal_notices")
      .update({ status: "acknowledged" })
      .eq("id", noticeId);
  } catch {
    // Ignore
  }

  const list = await getStoredNotices();
  const updated = list.map((n) => (n.id === noticeId ? { ...n, status: "acknowledged" as const } : n));
  await saveStoredNotices(updated);
}

/**
 * Fetch list of registered Kabadiwalas for municipal officer monitoring (Real profiles & real transactions only)
 */
export async function getMonitoredKabadiwalas(): Promise<MonitoredKabadiwala[]> {
  try {
    // 1. Fetch real registered kabadiwalas from profiles
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, shop_name, phone, whatsapp, address, created_at")
      .eq("role", "kabadiwala");

    if (error || !profiles || profiles.length === 0) {
      return [];
    }

    // 2. Fetch real transactions to compute actual stock held by each kabadiwala
    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, from_user_id, from_role, to_user_id, to_role, quantity, created_at");

    const allTx = transactions ?? [];
    const allNotices = await getStoredNotices();

    return profiles.map((p) => {
      // Real intake: customer -> this kabadiwala
      const intakes = allTx.filter((t) => t.to_user_id === p.id && t.from_role === "customer");
      const totalInflowKg = intakes.reduce((sum, t) => sum + Number(t.quantity ?? 0), 0);

      // Real outflow: this kabadiwala -> officer
      const outflows = allTx.filter((t) => t.from_user_id === p.id && t.to_role === "officer");
      const totalOutflowKg = outflows.reduce((sum, t) => sum + Number(t.quantity ?? 0), 0);

      // Real stock held
      const realStockKg = Math.max(0, Math.round(totalInflowKg - totalOutflowKg));

      // Calculate days overdue only if stock is actually held (> 0)
      let daysOverdue = 0;
      let lastHandoverDate: string | undefined = undefined;

      if (outflows.length > 0) {
        // Sort to get latest outflow date
        const sortedOutflows = [...outflows].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        lastHandoverDate = sortedOutflows[0].created_at.split("T")[0];
        if (realStockKg > 0) {
          const diffMs = Date.now() - new Date(sortedOutflows[0].created_at).getTime();
          daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        }
      } else if (intakes.length > 0) {
        // Stock collected from customers but zero officer handovers yet
        const sortedIntakes = [...intakes].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        const oldestIntake = sortedIntakes[0];
        const diffMs = Date.now() - new Date(oldestIntake.created_at).getTime();
        daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }

      const activeNotices = allNotices.filter(
        (n) => n.kabadiwala_id === p.id && n.status !== "resolved"
      );

      return {
        id: p.id,
        name: p.name ?? "Registered Kabadiwala",
        shop_name: p.shop_name ?? `${p.name ?? "Kabadiwala"}'s Scrap Center`,
        phone: p.phone ?? "",
        whatsapp: p.whatsapp ?? p.phone ?? "",
        address: p.address ?? "",
        stock_held_kg: realStockKg,
        days_overdue: realStockKg > 0 ? daysOverdue : 0,
        last_handover_date: lastHandoverDate,
        active_notice_count: activeNotices.length,
      };
    });
  } catch (err) {
    console.warn("getMonitoredKabadiwalas query error:", err);
    return [];
  }
}
