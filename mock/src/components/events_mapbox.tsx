"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { AppEvent } from "@/lib/mock_data";

type EventsMapboxProps = {
    events: AppEvent[];
};

const DALLAS_CENTER: [number, number] = [-96.797, 32.7767];

export default function EventsMapbox({ events }: EventsMapboxProps) {
    const container_ref = useRef<HTMLDivElement>(null);
    const map_ref = useRef<mapboxgl.Map | null>(null);
    const markers_ref = useRef<mapboxgl.Marker[]>([]);

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    useEffect(() => {
        if (!token || !container_ref.current || map_ref.current) return;

        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
            container: container_ref.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: DALLAS_CENTER,
            zoom: 11,
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");
        map_ref.current = map;

        return () => {
            markers_ref.current.forEach((marker) => marker.remove());
            markers_ref.current = [];
            map.remove();
            map_ref.current = null;
        };
    }, [token]);

    useEffect(() => {
        if (!map_ref.current) return;

        markers_ref.current.forEach((marker) => marker.remove());
        markers_ref.current = [];

        const map = map_ref.current;

        if (events.length === 0) {
            map.flyTo({ center: DALLAS_CENTER, zoom: 11 });
            return;
        }

        const bounds = new mapboxgl.LngLatBounds();

        for (const event of events) {
            const marker = new mapboxgl.Marker({ color: "#2563eb" })
                .setLngLat([event.longitude, event.latitude])
                .setPopup(
                    new mapboxgl.Popup({ offset: 18 }).setHTML(
                        `<div style=\"min-width:180px\"><strong>${event.title_en}</strong><br/><span>${event.location_name}</span></div>`,
                    ),
                )
                .addTo(map);

            markers_ref.current.push(marker);
            bounds.extend([event.longitude, event.latitude]);
        }

        map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }, [events]);

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

    return <div ref={container_ref} className="h-96 w-full" />;
}
