import React from "react";
import { View } from "react-native";
import { theme } from "../constants/theme";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label?: string;
  isSelf?: boolean;
}

interface Props {
  markers: MapMarker[];
  center: { latitude: number; longitude: number };
  height?: number;
}

function buildHtml(markers: MapMarker[], center: Props["center"]) {
  const markerJs = markers
    .map((m) => {
      const color = m.isSelf ? theme.clay : theme.leaf;
      const label = (m.label ?? "").replace(/"/g, "'");
      return `
        L.circleMarker([${m.latitude}, ${m.longitude}], {
          radius: ${m.isSelf ? 9 : 7},
          color: "${color}",
          fillColor: "${color}",
          fillOpacity: 0.9,
          weight: 2
        }).addTo(map)${label ? `.bindPopup("${label}")` : ""};
      `;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      var map = L.map('map', { zoomControl: false, attributionControl: false })
        .setView([${center.latitude}, ${center.longitude}], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);
      ${markerJs}
    </script>
  </body>
</html>`;
}

export function LeafletMap({ markers, center, height = 220 }: Props) {
  return (
    <View style={{ height, borderRadius: 18, overflow: "hidden" }}>
      <iframe
        srcDoc={buildHtml(markers, center)}
        style={{ width: "100%", height: "100%", border: 0 }}
        title="Leaflet Map"
      />
    </View>
  );
}
