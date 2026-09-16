import Constants from "expo-constants";
import { supabase } from "./supabase";

type NotificationModule = typeof import("expo-notifications");

let notificationsModule: NotificationModule | null = null;

function isExpoGo(): boolean {
  return (
    Constants.appOwnership === "expo"
  );
}

async function getNotifications(): Promise<NotificationModule | null> {
  // Expo Go Android does not support remote push notifications.
  // Most importantly, do NOT import expo-notifications in Expo Go.
  if (isExpoGo()) {
    return null;
  }

  if (notificationsModule) {
    return notificationsModule;
  }

  try {
    notificationsModule = await import("expo-notifications");
    return notificationsModule;
  } catch (error) {
    console.log("expo-notifications unavailable:", error);
    return null;
  }
}

export async function registerForPushNotifications(
  profileId: string
): Promise<string | null> {
  const Notifications = await getNotifications();

  if (!Notifications) {
    console.log("Push notifications skipped.");
    return null;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();

    let permissionStatus = existing.status;

    if (permissionStatus !== "granted") {
      const requested =
        await Notifications.requestPermissionsAsync();

      permissionStatus = requested.status;
    }

    if (permissionStatus !== "granted") {
      console.log("Notification permission not granted.");
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log("EAS projectId not configured.");
      return null;
    }

    const tokenResponse =
      await Notifications.getExpoPushTokenAsync({
        projectId,
      });

    const token = tokenResponse.data;

    if (!token) {
      return null;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        push_token: token,
      })
      .eq("id", profileId);

    if (error) {
      console.error(
        "Failed to save push token:",
        error
      );
      return null;
    }

    return token;
  } catch (error) {
    console.error(
      "Push notification registration failed:",
      error
    );

    return null;
  }
}

export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  // In Expo Go, silently skip.
  if (isExpoGo()) {
    console.log("Push notification skipped in Expo Go.");
    return false;
  }

  if (!expoPushToken) {
    return false;
  }

  try {
    const response = await fetch(
      "https://exp.host/--/api/v2/push/send",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: expoPushToken,
          sound: "default",
          title,
          body,
          data: data ?? {},
        }),
      }
    );

    if (!response.ok) {
      console.error(
        "Push API returned:",
        response.status
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Failed to send push notification:",
      error
    );

    return false;
  }
}

export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<boolean> {
  if (isExpoGo()) {
    console.log("Notification skipped in Expo Go.");
    return false;
  }

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("push_token")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile?.push_token) {
      return false;
    }

    return await sendPushNotification(
      profile.push_token,
      title,
      body,
      data
    );
  } catch (error) {
    console.error(
      "Failed to notify user:",
      error
    );

    return false;
  }
}