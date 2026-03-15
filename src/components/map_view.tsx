"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import "leaflet/dist/leaflet.css";
import type { EventData } from "@/components/event_card";

// ── Exported so map_page can reuse the same colors/emojis ──
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export const CATEGORY_CONFIG: Record<string, { color: string; emoji: string }> = {
  Health:            { color: "#ef4444", emoji: "🏥" },
  Employment:        { color: "#3b82f6", emoji: "💼" },
  Financial:         { color: "#22c55e", emoji: "💰" },
  Recreation:        { color: "#f97316", emoji: "⚽" },
  Transit:           { color: "#8b5cf6", emoji: "🚌" },
  "Senior Services": { color: "#06b6d4", emoji: "🤝" },
  Education:         { color: "#eab308", emoji: "📚" },
  Community:         { color: "#6366f1", emoji: "🏘️" },
  Other:             { color: "#6b7280", emoji: "📌" },
};

interface MapViewProps {
  events: EventData[];
  selected_id: string | null;
  onEventClick: (id: string) => void;
  onBoundsChange: (bounds: MapBounds) => void;
}

// Build a circle + downward-pointer divIcon for each category
function make_icon(L: any, category: string, selected: boolean) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["Other"];
  const size   = selected ? 42 : 32;
  const tri    = selected ? 9  : 7;
  const total  = size + tri;
  const shadow = selected ? 12 : 5;
  const alpha  = selected ? 0.45 : 0.28;
  const fs     = selected ? 19 : 14;

  const html = `
    <div style="text-align:center;">
      <div style="
        background:${cfg.color};
        width:${size}px;height:${size}px;
        border-radius:50%;
        border:2.5px solid white;
        box-shadow:0 2px ${shadow}px rgba(0,0,0,${alpha});
        display:flex;align-items:center;justify-content:center;
        font-size:${fs}px;
        margin:0 auto;
        ${selected ? `outline:3px solid ${cfg.color}38;outline-offset:2px;` : ""}
      ">${cfg.emoji}</div>
      <div style="
        width:0;height:0;
        border-left:${tri - 2}px solid transparent;
        border-right:${tri - 2}px solid transparent;
        border-top:${tri}px solid ${cfg.color};
        margin:-1px auto 0;
      "></div>
    </div>`;

  return L.divIcon({
    html,
    className: "",
    iconSize:     [size, total],
    iconAnchor:   [size / 2, total],
    popupAnchor:  [0, -(total + 4)],
  });
}

export default function MapView({
  events,
  selected_id,
  onEventClick,
  onBoundsChange,
}: MapViewProps) {
  const locale        = useLocale();
  const container_ref = useRef<HTMLDivElement>(null);
  const map_ref       = useRef<any>(null);
  const markers_ref   = useRef<any[]>([]);
  const marker_map    = useRef<Map<string, any>>(new Map());
  const has_fit       = useRef(false);

  // Keep callback refs fresh without re-running effects
  const bounds_cb = useRef(onBoundsChange);
  const click_cb  = useRef(onEventClick);
  useEffect(() => { bounds_cb.current = onBoundsChange; }, [onBoundsChange]);
  useEffect(() => { click_cb.current  = onEventClick;   }, [onEventClick]);

  // ── Init map once ──
  useEffect(() => {
    if (!container_ref.current || map_ref.current) return;

    const L = require("leaflet");
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    const map = L.map(container_ref.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([32.7767, -96.797], 11);

    // CartoDB Light — clean, minimal, readable
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> ' +
          '&copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      },
    ).addTo(map);

    const fire_bounds = () => {
      const b = map.getBounds();
      bounds_cb.current({
        north: b.getNorth(),
        south: b.getSouth(),
        east:  b.getEast(),
        west:  b.getWest(),
      });
    };

    map.on("moveend", fire_bounds);
    map.on("zoomend", fire_bounds);
    // Give tiles a moment to load before first bounds fire
    map.whenReady(() => setTimeout(fire_bounds, 250));

    map_ref.current = map;

    return () => {
      map.remove();
      map_ref.current = null;
      has_fit.current = false;
    };
  }, []);

  // ── Update markers whenever events / selection / locale changes ──
  useEffect(() => {
    if (!map_ref.current) return;

    const L   = require("leaflet");
    const map = map_ref.current;

    // Clear old markers
    markers_ref.current.forEach(m => m.remove());
    markers_ref.current = [];
    marker_map.current.clear();

    events.forEach(event => {
      const is_sel = event.id === selected_id;
      const cfg    = CATEGORY_CONFIG[event.category] ?? CATEGORY_CONFIG["Other"];
      const title  = locale === "es" ? event.title_es : event.title_en;
      const loc    = locale === "es" ? "es-US" : "en-US";

      const date_str = new Date(event.start_time).toLocaleDateString(loc, {
        weekday: "short", month: "short", day: "numeric",
      });
      const time_str = new Date(event.start_time).toLocaleTimeString(loc, {
        hour: "numeric", minute: "2-digit",
      });

      const popup_html = `
        <div style="width:215px;font-family:system-ui,-apple-system,sans-serif;padding:2px 0;">
          <div style="
            display:inline-flex;align-items:center;gap:5px;
            background:${cfg.color}15;color:${cfg.color};
            font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
            padding:3px 9px;border-radius:999px;margin-bottom:8px;
          ">${cfg.emoji} ${event.category}</div>

          <div style="
            font-size:13.5px;font-weight:700;color:#111827;
            line-height:1.35;margin-bottom:7px;
          ">${title}</div>

          <div style="font-size:11px;color:#6b7280;margin-bottom:3px;">
            📅 ${date_str} &middot; ${time_str}
          </div>
          <div style="
            font-size:11px;color:#6b7280;margin-bottom:11px;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
          ">📍 ${event.location_name}</div>

          <a href="/events/${event.id}" style="
            display:block;text-align:center;
            background:${cfg.color};color:#fff;
            font-size:12px;font-weight:600;
            padding:7px 12px;border-radius:8px;
            text-decoration:none;
          ">View Details →</a>
        </div>`;

      const marker = L.marker([event.latitude, event.longitude], {
        icon:        make_icon(L, event.category, is_sel),
        zIndexOffset: is_sel ? 1000 : 0,
      })
        .addTo(map)
        .bindPopup(popup_html, { maxWidth: 240, closeButton: false })
        .on("click", () => click_cb.current(event.id));

      if (is_sel) {
        // Small delay so the marker renders before popup opens
        setTimeout(() => marker.openPopup(), 60);
      }

      marker_map.current.set(event.id, marker);
      markers_ref.current.push(marker);
    });

    // Fit bounds once on first data load only
    if (!has_fit.current && events.length > 0) {
      try {
        const group = require("leaflet").featureGroup(markers_ref.current);
        map.fitBounds(group.getBounds().pad(0.15));
      } catch {}
      has_fit.current = true;
    }
  }, [events, selected_id, locale]);

  return (
    <div
      ref={container_ref}
      style={{ width: "100%", height: "100%" }}
    />
  );
}