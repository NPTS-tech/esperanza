"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type EventMapboxProps = {
  latitude: number;
  longitude: number;
  location_name: string;
};

export default function EventMapbox({
  latitude,
  longitude,
  location_name,
}: EventMapboxProps) {
  const container_ref = useRef<HTMLDivElement>(null);
  const map_ref = useRef<mapboxgl.Map | null>(null);
  const marker_ref = useRef<mapboxgl.Marker | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

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

    const marker = new mapboxgl.Marker({ color: "#3b82f6" })
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup({ offset: 20 }).setText(location_name))
      .addTo(map);

    marker_ref.current = marker;
    map_ref.current = map;

    return () => {
      marker_ref.current?.remove();
      marker_ref.current = null;
      map.remove();
      map_ref.current = null;
    };
  }, [token, latitude, longitude, location_name]);

  useEffect(() => {
    if (!map_ref.current || !marker_ref.current) return;

    map_ref.current.flyTo({ center: [longitude, latitude], zoom: 14 });
    marker_ref.current.setLngLat([longitude, latitude]);
  }, [latitude, longitude]);

  if (!token) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-medium text-slate-700 mb-1">Map unavailable</p>
        <p className="text-xs text-slate-500">
          Missing NEXT_PUBLIC_MAPBOX_TOKEN in environment.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={container_ref}
      className="w-full h-80 rounded-xl overflow-hidden border border-slate-200"
    />
  );
}
