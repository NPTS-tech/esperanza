"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface EventMapProps {
  latitude: number;
  longitude: number;
  locationName: string;
}

export default function EventMap({ latitude, longitude, locationName }: EventMapProps) {
  const container_ref = useRef<HTMLDivElement>(null);
  const map_ref = useRef<mapboxgl.Map | null>(null);
  const marker_ref = useRef<mapboxgl.Marker | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  useEffect(() => {
    if (!token || !container_ref.current || map_ref.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: container_ref.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 14,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    const marker = new mapboxgl.Marker({ color: "#6366f1" })
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup({ offset: 20 }).setText(locationName))
      .addTo(map);

    marker_ref.current = marker;
    map_ref.current = map;

    return () => {
      marker_ref.current?.remove();
      marker_ref.current = null;
      map.remove();
      map_ref.current = null;
    };
  }, [latitude, longitude, locationName, token]);

  useEffect(() => {
    if (!map_ref.current || !marker_ref.current) return;

    marker_ref.current.setLngLat([longitude, latitude]);
    map_ref.current.flyTo({ center: [longitude, latitude], zoom: 14 });
  }, [latitude, longitude]);

  if (!token) {
    return (
      <div
        className="w-full h-64 rounded-lg flex items-center justify-center text-sm"
        style={{
          border: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text-secondary)",
        }}
      >
        Map unavailable: set NEXT_PUBLIC_MAPBOX_TOKEN.
      </div>
    );
  }

  return <div ref={container_ref} className="w-full h-64 rounded-lg overflow-hidden" />;
}