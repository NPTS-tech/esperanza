"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE_URL } from "@/lib/map";

interface EventMapProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

export default function EventMap({ latitude, longitude, locationName }: EventMapProps) {
  const container_ref = useRef<HTMLDivElement>(null);
  const map_ref = useRef<maplibregl.Map | null>(null);
  const marker_ref = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!container_ref.current || map_ref.current) return;

    const map = new maplibregl.Map({
      container: container_ref.current,
      style: MAP_STYLE_URL,
      center: [longitude, latitude],
      zoom: 14,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const marker = new maplibregl.Marker({ color: "#6366f1" })
      .setLngLat([longitude, latitude])
      .setPopup(new maplibregl.Popup({ offset: 20 }).setText(locationName))
      .addTo(map);

    marker_ref.current = marker;
    map_ref.current = map;

    return () => {
      marker_ref.current?.remove();
      marker_ref.current = null;
      map.remove();
      map_ref.current = null;
    };
  }, [latitude, longitude, locationName]);

  useEffect(() => {
    if (!map_ref.current || !marker_ref.current) return;

    marker_ref.current.setLngLat([longitude, latitude]);
    map_ref.current.flyTo({ center: [longitude, latitude], zoom: 14 });
  }, [latitude, longitude]);

  return <div ref={container_ref} className="w-full h-64 rounded-lg overflow-hidden" />;
}
