"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { EventData } from "@/components/event_card";

interface MapViewProps {
  events: EventData[];
  onEventClick: (id: string) => void;
}

export default function MapView({ events, onEventClick }: MapViewProps) {
  const locale = useLocale();

  useEffect(() => {
    // Fix for default markers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    const map = L.map("map-view").setView([32.7767, -96.7970], 10); // Dallas area

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const markers: L.Marker[] = [];

    events.forEach((event) => {
      const marker = L.marker([event.latitude, event.longitude])
        .addTo(map)
        .bindPopup(`<b>${locale === "es" ? event.title_es : event.title_en}</b><br>${event.location_name}`)
        .on("click", () => onEventClick(event.id));
      markers.push(marker);
    });

    // Fit bounds if there are events
    if (events.length > 0) {
      const group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      map.remove();
    };
  }, [events, onEventClick, locale]);

  return <div id="map-view" className="w-full h-full" />;
}