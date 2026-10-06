"use client";

/**
 * LocationPicker
 *
 * Address-autocomplete (Geoapify, or keyless Photon fallback) + draggable-pin map
 * (MapLibre + OpenFreeMap). Used when creating / editing events so providers never
 * type raw coordinates.
 *
 * Flow:
 *  1. User types an address → geocoder shows dropdown suggestions
 *  2. User selects one → map flies there and drops a pin
 *  3. User can drag the pin to the exact spot; lat/lng update on dragend
 *     (reverse-geocoded to a label)
 *
 * Import with `dynamic(..., { ssr: false })`: maplibre-gl touches browser globals
 * at module init.
 */

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE_URL, DALLAS_CENTER as DALLAS } from "@/lib/map";
import { geocode_search, geocode_reverse, type GeoResult } from "@/lib/geocode";

export interface LocationValue {
  location_name: string;
  location_address?: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  label?: string;
  drag_hint?: string;
}

export default function LocationPicker({
  value,
  onChange,
  label,
  drag_hint = "Drag the pin to refine the exact location",
}: LocationPickerProps) {
  const container_ref = useRef<HTMLDivElement>(null);
  const map_ref = useRef<maplibregl.Map | null>(null);
  const marker_ref = useRef<maplibregl.Marker | null>(null);
  const reverse_request_id_ref = useRef(0);
  const debounce_ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const search_abort_ref = useRef<AbortController | null>(null);
  const has_coords = value.latitude != null && value.longitude != null;
  const supports_separate_address = Object.prototype.hasOwnProperty.call(
    value,
    "location_address",
  );

  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);

  // Keep mutable refs so closures read the latest values without re-running effects.
  const on_change_ref = useRef(onChange);
  const value_ref = useRef(value);
  useEffect(() => {
    on_change_ref.current = onChange;
  }, [onChange]);
  useEffect(() => {
    value_ref.current = value;
  }, [value]);

  // ── Initialise map once ──
  useEffect(() => {
    if (!container_ref.current || map_ref.current) return;

    const initial_center: [number, number] =
      value.longitude != null && value.latitude != null
        ? [value.longitude, value.latitude]
        : DALLAS;

    const map = new maplibregl.Map({
      container: container_ref.current,
      style: MAP_STYLE_URL,
      center: initial_center,
      zoom: value.longitude != null ? 15 : 11,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map_ref.current = map;

    if (value.longitude != null && value.latitude != null) {
      _place_marker([value.longitude, value.latitude]);
    }

    return () => {
      marker_ref.current?.remove();
      marker_ref.current = null;
      map.remove();
      map_ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!map_ref.current) return;

    if (!has_coords) {
      marker_ref.current?.remove();
      marker_ref.current = null;
      map_ref.current.flyTo({ center: DALLAS, zoom: 11 });
      return;
    }

    const next_lnglat: [number, number] = [value.longitude!, value.latitude!];
    const current_lnglat = marker_ref.current?.getLngLat();

    if (
      current_lnglat &&
      Math.abs(current_lnglat.lng - next_lnglat[0]) < 0.000001 &&
      Math.abs(current_lnglat.lat - next_lnglat[1]) < 0.000001
    ) {
      return;
    }

    _place_marker(next_lnglat);
  }, [has_coords, value.latitude, value.longitude]);

  useEffect(() => {
    if (!map_ref.current) return;
    const resize_map = () => map_ref.current?.resize();
    const timeout_id = window.setTimeout(resize_map, 0);
    window.addEventListener("resize", resize_map);
    return () => {
      window.clearTimeout(timeout_id);
      window.removeEventListener("resize", resize_map);
    };
  }, []);

  // Cancel pending search work on unmount.
  useEffect(() => {
    return () => {
      if (debounce_ref.current) clearTimeout(debounce_ref.current);
      search_abort_ref.current?.abort();
    };
  }, []);

  // ── Place (or replace) the draggable marker ──
  function _place_marker(lnglat: [number, number]) {
    if (!map_ref.current) return;
    marker_ref.current?.remove();

    const marker = new maplibregl.Marker({ color: "#6366f1", draggable: true })
      .setLngLat(lnglat)
      .addTo(map_ref.current);

    marker.on("dragend", async () => {
      const { lat, lng } = marker.getLngLat();
      const rounded_lat = parseFloat(lat.toFixed(6));
      const rounded_lng = parseFloat(lng.toFixed(6));

      on_change_ref.current({
        location_name: value_ref.current.location_name,
        location_address: value_ref.current.location_address,
        latitude: rounded_lat,
        longitude: rounded_lng,
      });

      const request_id = ++reverse_request_id_ref.current;
      const resolved_label = await geocode_reverse(rounded_lat, rounded_lng);
      if (request_id !== reverse_request_id_ref.current) return;

      if (resolved_label) {
        const current = value_ref.current;
        on_change_ref.current({
          location_name:
            supports_separate_address && current.location_name.trim().length > 0
              ? current.location_name
              : resolved_label,
          location_address: supports_separate_address ? resolved_label : undefined,
          latitude: rounded_lat,
          longitude: rounded_lng,
        });
      }
    });

    marker_ref.current = marker;
  }

  // ── Autocomplete input handlers ──
  function handle_input(text: string) {
    const current_text = (
      value_ref.current.location_address ?? value_ref.current.location_name
    ).trim();

    on_change_ref.current({
      ...value_ref.current,
      location_address: supports_separate_address ? text : undefined,
      location_name: supports_separate_address
        ? value_ref.current.location_name
        : text,
      // Typing invalidates the resolved pin until a suggestion is chosen.
      latitude: text.trim() === current_text ? value_ref.current.latitude : null,
      longitude: text.trim() === current_text ? value_ref.current.longitude : null,
    });

    if (debounce_ref.current) clearTimeout(debounce_ref.current);
    debounce_ref.current = setTimeout(async () => {
      // Cancel any in-flight request so only the latest keystroke's results apply.
      search_abort_ref.current?.abort();
      const ctrl = new AbortController();
      search_abort_ref.current = ctrl;
      setSearching(true);
      setOpen(true);
      const results = await geocode_search(text, DALLAS, ctrl.signal);
      if (ctrl.signal.aborted) return; // superseded by a newer keystroke
      setSuggestions(results);
      setSearching(false);
      setOpen(true);
    }, 250);
  }

  function handle_select(r: GeoResult) {
    setOpen(false);
    setSearching(false);
    setSuggestions([]);
    map_ref.current?.flyTo({ center: [r.lon, r.lat], zoom: 15 });
    _place_marker([r.lon, r.lat]);

    on_change_ref.current({
      location_name:
        supports_separate_address &&
        value_ref.current.location_name.trim().length > 0
          ? value_ref.current.location_name
          : r.name,
      location_address: supports_separate_address ? r.label : undefined,
      latitude: parseFloat(r.lat.toFixed(6)),
      longitude: parseFloat(r.lon.toFixed(6)),
    });
  }

  return (
    <div className="space-y-3">
      {label && (
        <label
          className="block text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          {label} *
        </label>
      )}

      {/* Address autocomplete (Photon) */}
      <div className="relative">
        <input
          type="text"
          value={value.location_address ?? value.location_name}
          onChange={(e) => handle_input(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search for an address or place…"
          autoComplete="off"
          className="w-full text-sm rounded-lg px-3 py-2"
          style={{
            border: "1px solid var(--color-border)",
            background: "var(--color-surface, #fff)",
            color: "var(--color-text, #1e293b)",
          }}
        />
        {open && (searching || suggestions.length > 0) && (
          <ul
            className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg shadow-lg"
            style={{
              background: "var(--color-surface, #fff)",
              border: "1px solid var(--color-border)",
            }}
          >
            {searching && (
              <li
                className="px-3 py-2 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Searching…
              </li>
            )}
            {!searching && suggestions.map((s, i) => (
              <li key={`${s.lat},${s.lon},${i}`}>
                <button
                  type="button"
                  // onMouseDown fires before the input's onBlur so the click registers.
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handle_select(s);
                  }}
                  className="block w-full text-left px-3 py-2 text-sm"
                  style={{ color: "var(--color-text, #1e293b)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--color-surface-hover, #f1f5f9)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Map */}
      <div
        ref={container_ref}
        className="mt-2 h-75 w-full overflow-hidden rounded-lg sm:h-90 lg:h-110"
        style={{ border: "1px solid var(--color-border)" }}
      />

      {has_coords && (
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            📍 {drag_hint}
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {value.latitude?.toFixed(5)}, {value.longitude?.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
}
