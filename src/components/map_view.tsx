"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE_URL, DALLAS_CENTER } from "@/lib/map";
import type { EventData } from "@/components/event_card";
import { CATEGORY_CONFIG } from "@/lib/event_category_assets";

// Re-export so map_page and others can keep importing from here
export { CATEGORY_CONFIG };

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapViewProps {
  events: EventData[];
  selected_id: string | null;
  onEventClick: (id: string) => void;
  onBoundsChange: (bounds: MapBounds) => void;
}


function escape_html(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Build a custom category marker (emoji + colored pin)
function make_marker_element(category: string, selected: boolean) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["Other"];
  const size = selected ? 42 : 32;
  const tri = selected ? 9 : 7;
  const shadow = selected ? 12 : 5;
  const alpha = selected ? 0.45 : 0.28;
  const fs = selected ? 19 : 14;

  const root = document.createElement("div");
  root.style.textAlign = "center";
  root.style.cursor = "pointer";

  const circle = document.createElement("div");
  circle.style.background = cfg.color;
  circle.style.width = `${size}px`;
  circle.style.height = `${size}px`;
  circle.style.borderRadius = "50%";
  circle.style.border = "2.5px solid white";
  circle.style.boxShadow = `0 2px ${shadow}px rgba(0,0,0,${alpha})`;
  circle.style.display = "flex";
  circle.style.alignItems = "center";
  circle.style.justifyContent = "center";
  circle.style.fontSize = `${fs}px`;
  circle.style.margin = "0 auto";
  if (selected) {
    circle.style.outline = `3px solid ${cfg.color}38`;
    circle.style.outlineOffset = "2px";
  }
  circle.textContent = cfg.emoji;

  const pointer = document.createElement("div");
  pointer.style.width = "0";
  pointer.style.height = "0";
  pointer.style.borderLeft = `${tri - 2}px solid transparent`;
  pointer.style.borderRight = `${tri - 2}px solid transparent`;
  pointer.style.borderTop = `${tri}px solid ${cfg.color}`;
  pointer.style.margin = "-1px auto 0";

  root.appendChild(circle);
  root.appendChild(pointer);
  return root;
}

export default function MapView({
  events,
  selected_id,
  onEventClick,
  onBoundsChange,
}: MapViewProps) {
  const locale        = useLocale();
  const container_ref = useRef<HTMLDivElement>(null);
  const map_ref       = useRef<maplibregl.Map | null>(null);
  const markers_ref   = useRef<maplibregl.Marker[]>([]);
  const marker_map    = useRef<Map<string, maplibregl.Marker>>(new Map());
  const has_fit       = useRef(false);

  // Keep callback refs fresh without re-running effects
  const bounds_cb = useRef(onBoundsChange);
  const click_cb  = useRef(onEventClick);
  useEffect(() => { bounds_cb.current = onBoundsChange; }, [onBoundsChange]);
  useEffect(() => { click_cb.current  = onEventClick;   }, [onEventClick]);

  // ── Init map once ──
  useEffect(() => {
    if (!container_ref.current || map_ref.current) return;

    const map = new maplibregl.Map({
      container: container_ref.current,
      style: MAP_STYLE_URL,
      center: DALLAS_CENTER,
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const fire_bounds = () => {
      const b = map.getBounds();
      if (!b) return;
      bounds_cb.current({
        north: b.getNorth(),
        south: b.getSouth(),
        east:  b.getEast(),
        west:  b.getWest(),
      });
    };

    map.on("moveend", fire_bounds);
    map.on("zoomend", fire_bounds);
    map.on("load", () => setTimeout(fire_bounds, 100));

    map_ref.current = map;

    return () => {
      markers_ref.current.forEach((m) => m.remove());
      markers_ref.current = [];
      marker_map.current.clear();
      map.remove();
      map_ref.current = null;
      has_fit.current = false;
    };
  }, []);

  // ── Update markers whenever events / selection / locale changes ──
  useEffect(() => {
    if (!map_ref.current) return;
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
      const safe_title = escape_html(title);
      const safe_cat = escape_html(event.category);
      const safe_loc = escape_html(event.location_name);
      const safe_id = encodeURIComponent(event.id);

      const popup_html = `
        <div style="width:215px;font-family:system-ui,-apple-system,sans-serif;padding:2px 0;">
          <div style="
            display:inline-flex;align-items:center;gap:5px;
            background:${cfg.color}15;color:${cfg.color};
            font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
            padding:3px 9px;border-radius:999px;margin-bottom:8px;
          ">${cfg.emoji} ${safe_cat}</div>

          <div style="
            font-size:13.5px;font-weight:700;color:#111827;
            line-height:1.35;margin-bottom:7px;
          ">${safe_title}</div>

          <div style="font-size:11px;color:#6b7280;margin-bottom:3px;">
            📅 ${date_str} &middot; ${time_str}
          </div>
          <div style="
            font-size:11px;color:#6b7280;margin-bottom:11px;
            overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
          ">📍 ${safe_loc}</div>

          <a href="/events/${safe_id}" style="
            display:block;text-align:center;
            background:${cfg.color};color:#fff;
            font-size:12px;font-weight:600;
            padding:7px 12px;border-radius:8px;
            text-decoration:none;
          ">View Details →</a>
        </div>`;

      const marker = new maplibregl.Marker({
        element: make_marker_element(event.category, is_sel),
        anchor: "bottom",
      })
        .setLngLat([event.longitude, event.latitude])
        .setPopup(new maplibregl.Popup({ closeButton: false, offset: 16 }).setHTML(popup_html))
        .addTo(map);

      marker.getElement().addEventListener("click", () => click_cb.current(event.id));

      if (is_sel) {
        setTimeout(() => marker.togglePopup(), 60);
      }

      marker_map.current.set(event.id, marker);
      markers_ref.current.push(marker);
    });

    // Fit bounds once on first data load only
    if (!has_fit.current && events.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      events.forEach((event) => bounds.extend([event.longitude, event.latitude]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      has_fit.current = true;
    }
    if (events.length === 0) {
      map.flyTo({ center: DALLAS_CENTER, zoom: 11 });
    }
  }, [events, selected_id, locale]);

  return (
    <div
      ref={container_ref}
      style={{ width: "100%", height: "100%" }}
    />
  );
}