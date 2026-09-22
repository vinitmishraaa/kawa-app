import AsyncStorage from "@react-native-async-storage/async-storage";
import { recordDirectIntake, recordOfficerSale } from "./queries/transactions";

const STORAGE_KEY = "@kawa_offline_mutation_queue_v1";

export interface OfflineQueueItem {
  id: string;
  type: "direct_intake" | "digital_lot" | "recycler_handover";
  payload: any;
  createdAt: string;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
}

export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getPendingQueueCount(): Promise<number> {
  const queue = await getOfflineQueue();
  return queue.length;
}

export async function enqueueOfflineItem(
  type: OfflineQueueItem["type"],
  payload: any
): Promise<OfflineQueueItem> {
  const queue = await getOfflineQueue();
  const newItem: OfflineQueueItem = {
    id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
    status: "pending",
    retryCount: 0,
  };

  queue.push(newItem);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  return newItem;
}

export async function removeOfflineItem(id: string): Promise<void> {
  const queue = await getOfflineQueue();
  const filtered = queue.filter((item) => item.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Synchronize all pending offline mutations with Supabase
 * Called when internet reconnects or when dashboard refreshes.
 */
export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.type === "direct_intake" || item.type === "digital_lot") {
        await recordDirectIntake({
          kabadiwalaId: item.payload.kabadiwalaId,
          category: item.payload.category,
          quantity: item.payload.quantity,
          pricePaid: item.payload.pricePaid,
          quality: item.payload.quality,
          customerName: item.payload.customerName,
          notes: item.payload.notes,
          latitude: item.payload.latitude,
          longitude: item.payload.longitude,
        });
      } else if (item.type === "recycler_handover") {
        await recordOfficerSale({
          kabadiwalaId: item.payload.kabadiwalaId,
          officerId: item.payload.officerId,
          category: item.payload.category,
          quantity: item.payload.quantity,
          price: item.payload.price,
          quality: item.payload.quality,
          notes: item.payload.notes,
          latitude: item.payload.latitude,
          longitude: item.payload.longitude,
        });
      }
      await removeOfflineItem(item.id);
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}
