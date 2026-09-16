import * as Location from "expo-location";
import { supabase } from "./supabase";

export async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === "granted";
}

export async function getCurrentCoords() {
  const granted = await requestLocationPermission();
  if (!granted) {
    throw new Error("Location permission was not granted.");
  }
  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}


export async function syncProfileLocation(userId: string) {
  const coords = await getCurrentCoords();
  const { error } = await supabase
    .from("profiles")
    .update({ location: `POINT(${coords.longitude} ${coords.latitude})` })
    .eq("id", userId);
  if (error) throw error;
  return coords;
}
