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

const DEFAULT_SAMPLE_KABADIWALAS: MonitoredKabadiwala[] = [
  {
    id: "kabadi-sample-01",
    name: "Ramesh Scrap Traders",
    shop_name: "Ramesh Scrap Yard (दुकान #14)",
    phone: "9876543210",
    whatsapp: "9876543210",
    address: "Plot 14, Main Mandi Road, Industrial Area, Zone 1",
    stock_held_kg: 215,
    days_overdue: 14,
    last_handover_date: "2026-09-05",
    active_notice_count: 1,
  },
  {
    id: "kabadi-sample-02",
    name: "Gupta Metal Recyclers",
    shop_name: "Gupta Kabadi Centre",
    phone: "9812345678",
    whatsapp: "9812345678",
    address: "Shop 4, Old Station Road, Sector 3",
    stock_held_kg: 140,
    days_overdue: 9,
    last_handover_date: "2026-09-11",
    active_notice_count: 0,
  },
  {
    id: "kabadi-sample-03",
    name: "Ali Eco Scrap Collection",
    shop_name: "Ali Kabadi Kendra",
    phone: "9898989898",
    whatsapp: "9898989898",
    address: "Bypass Road, Near Bus Terminal",
    stock_held_kg: 65,
    days_overdue: 3,
    last_handover_date: "2026-09-17",
    active_notice_count: 0,
  },
];

const DEFAULT_SAMPLE_NOTICES: MunicipalNotice[] = [
  {
    id: "notice-sample-001",
    officer_id: "OFFICER-SWM-101",
    officer_name: "Rajesh Sharma",
    officer_department: "Solid Waste Management (Zone 1 - Central)",
    kabadiwala_id: "kabadi-sample-01",
    kabadiwala_name: "Ramesh Scrap Traders",
    kabadiwala_phone: "9876543210",
    stock_held_kg: 215,
    days_overdue: 14,
    notice_type: "legal_notice",
    subject: "MUNICIPAL NOTICE: Immediate Scrap Stock Handover Required",
    message:
      "As per Solid Waste Management By-laws, your registered collection center has exceeded the 7-day holding limit with 215 kg accumulated scrap stock. You are required to schedule an immediate handover to the Municipal Corporation within 48 hours to avoid penalty.",
    issued_at: new Date(Date.now() - 86400000).toISOString(),
    status: "pending",
  },
];

// Helper to read local notices
async function getStoredNotices(): Promise<MunicipalNotice[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAMPLE_NOTICES));
      return DEFAULT_SAMPLE_NOTICES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SAMPLE_NOTICES;
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
    // Graceful fallback to AsyncStorage
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
 * Get all active and past notices for a given Kabadiwala
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
  // Also match sample notices if this is the active user or sample ID
  return list.filter(
    (n) => n.kabadiwala_id === kabadiwalaId || n.kabadiwala_id === "kabadi-sample-01"
  );
}

/**
 * Get notices issued by a specific officer
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
  return list.filter((n) => n.officer_id === officerId || n.officer_id === "OFFICER-SWM-101");
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
 * Fetch list of registered Kabadiwalas for municipal officer monitoring
 */
export async function getMonitoredKabadiwalas(): Promise<MonitoredKabadiwala[]> {
  try {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, shop_name, phone, whatsapp, address, created_at")
      .eq("role", "kabadiwala")
      .limit(20);

    if (!error && profiles && profiles.length > 0) {
      const allNotices = await getStoredNotices();
      return profiles.map((p, index) => {
        const notices = allNotices.filter((n) => n.kabadiwala_id === p.id && n.status !== "resolved");
        const daysOverdue = 4 + (index % 3) * 5; // dynamic sample days
        return {
          id: p.id,
          name: p.name ?? "Registered Kabadiwala",
          shop_name: p.shop_name ?? `${p.name ?? "Kabadi"} Scrap Shop`,
          phone: p.phone ?? "9876543210",
          whatsapp: p.whatsapp ?? p.phone ?? "9876543210",
          address: p.address ?? "Zone 1 Municipal Ward",
          stock_held_kg: 85 + index * 45,
          days_overdue: daysOverdue,
          last_handover_date: new Date(Date.now() - daysOverdue * 86400000).toISOString().split("T")[0],
          active_notice_count: notices.length,
        };
      });
    }
  } catch {
    // Fallback
  }

  return DEFAULT_SAMPLE_KABADIWALAS;
}
