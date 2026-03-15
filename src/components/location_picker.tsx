"use client";

/**
 * LocationPicker
 *
 * A combined address-autocomplete + draggable-pin map widget.
 * Used when creating / editing events so providers never have to
 * type raw coordinates.
 *
 * Flow:
 *  1. User types an address → Mapbox SearchBox shows dropdown suggestions
 *  2. User selects a suggestion → map flies to that location and drops a pin
 *  3. User can drag the pin to the exact spot (à la Uber Eats / DoorDash)
 *  4. Lat/lng are updated on every dragend
 *
 * This component MUST be imported with `dynamic(..., { ssr: false })` because
 * both `mapbox-gl` and `@mapbox/search-js-react` reference browser globals at
 * module initialisation time.
 */

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { SearchBox } from "@mapbox/search-js-react";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

/** Default map centre — Dallas metro */
const DALLAS: [number, number] = [-96.797, 32.7767];

// ─── Public types ────────────────────────────────────────────────────────────

export interface LocationValue {
  location_name: string;
  location_address?: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  /** Label rendered above the search box */
  label?: string;
  /** Small hint shown beneath the map once a pin is placed */
  drag_hint?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LocationPicker({
  value,
  onChange,
  label,
  drag_hint = "Drag the pin to refine the exact location",
}: LocationPickerProps) {
  const container_ref = useRef<HTMLDivElement>(null);
  const map_ref = useRef<mapboxgl.Map | null>(null);
  const marker_ref = useRef<mapboxgl.Marker | null>(null);
  const reverse_request_id_ref = useRef(0);
  const has_coords = value.latitude != null && value.longitude != null;
  const supports_separate_address =
    Object.prototype.hasOwnProperty.call(value, "location_address");

  // Keep mutable refs so drag-end closure always reads the latest values
  // without causing the map init effect to re-run.
  const on_change_ref = useRef(onChange);
  const value_ref = useRef(value);
  useEffect(() => {
    on_change_ref.current = onChange;
  }, [onChange]);
  useEffect(() => {
    value_ref.current = value;
  }, [value]);

  // ── Initialise map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!container_ref.current || map_ref.current) return;

    mapboxgl.accessToken = TOKEN;

    const initial_center: [number, number] =
      value.longitude != null && value.latitude != null
        ? [value.longitude, value.latitude]
        : DALLAS;

    const map = new mapboxgl.Map({
      container: container_ref.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initial_center,
      zoom: value.longitude != null ? 15 : 11,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map_ref.current = map;

    // If editing an existing event, place the marker on the saved coordinates
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

  // ── Internal helpers ─────────────────────────────────────────────────────

  async function reverse_geocode_label(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    if (!TOKEN) return null;

    try {
      const url =
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json` +
        `?access_token=${encodeURIComponent(TOKEN)}` +
        "&types=poi,address,place" +
        "&limit=1" +
        "&language=en";

      const res = await fetch(url);
      if (!res.ok) return null;

      const data = (await res.json()) as {
        features?: Array<{ place_name?: string; text?: string }>;
      };

      const best = data.features?.[0];
      return best?.place_name ?? best?.text ?? null;
    } catch {
      return null;
    }
  }

  /** Place (or replace) the draggable marker at the given coordinates. */
  function _place_marker(lnglat: [number, number]) {
    if (!map_ref.current) return;
    marker_ref.current?.remove();

    const marker = new mapboxgl.Marker({ color: "#6366f1", draggable: true })
      .setLngLat(lnglat)
      .addTo(map_ref.current);

    marker.on("dragend", async () => {
      const { lat, lng } = marker.getLngLat();
      const rounded_lat = parseFloat(lat.toFixed(6));
      const rounded_lng = parseFloat(lng.toFixed(6));

      // Update coordinates immediately so form state stays in sync.
      on_change_ref.current({
        location_name: value_ref.current.location_name,
        location_address: value_ref.current.location_address,
        latitude: rounded_lat,
        longitude: rounded_lng,
      });

      // Then resolve the nearest specific place/address for the label.
      const request_id = ++reverse_request_id_ref.current;
      const resolved_label = await reverse_geocode_label(rounded_lat, rounded_lng);

      // Ignore stale responses when user drags multiple times quickly.
      if (request_id !== reverse_request_id_ref.current) return;

      if (resolved_label) {
        const current = value_ref.current;
        on_change_ref.current({
          location_name:
            supports_separate_address && current.location_name.trim().length > 0
              ? current.location_name
              : resolved_label,
          location_address: supports_separate_address
            ? resolved_label
            : undefined,
          latitude: rounded_lat,
          longitude: rounded_lng,
        });
      }
    });

    marker_ref.current = marker;
  }

  // ── SearchBox result handler ─────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handle_retrieve(res: any) {
    const feature = res?.features?.[0];
    if (!feature) return;

    // GeoJSON `Position` is number[] (may have altitude); we only need lng/lat
    const lng = feature.geometry.coordinates[0] as number;
    const lat = feature.geometry.coordinates[1] as number;
    const props = feature.properties as Record<string, unknown>;
    const resolved_address =
      (props?.full_address as string | undefined) ??
      (props?.name as string | undefined) ??
      value_ref.current.location_address ??
      value_ref.current.location_name;
    const resolved_place_name =
      (props?.name as string | undefined) ??
      (feature.text as string | undefined) ??
      value_ref.current.location_name;

    map_ref.current?.flyTo({ center: [lng, lat], zoom: 15 });
    _place_marker([lng, lat]);

    on_change_ref.current({
      location_name:
        supports_separate_address && value_ref.current.location_name.trim().length > 0
          ? value_ref.current.location_name
          : resolved_place_name,
      location_address: supports_separate_address
        ? resolved_address
        : undefined,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {/* Label */}
      {label && (
        <label
          className="block text-sm font-medium"
          style={{ color: "var(--color-text)" }}
        >
          {label} *
        </label>
      )}

      {/* Address autocomplete */}
      <SearchBox
        accessToken={TOKEN}
        value={value.location_address ?? value.location_name}
        onChange={(v: string) => {
          const next_name = v.trimStart();
          const current_text =
            (value_ref.current.location_address ??
              value_ref.current.location_name).trim();

          on_change_ref.current({
            ...value_ref.current,
            location_address: supports_separate_address ? v : undefined,
            location_name: supports_separate_address
              ? value_ref.current.location_name
              : v,
            latitude: next_name === current_text ? value_ref.current.latitude : null,
            longitude:
              next_name === current_text ? value_ref.current.longitude : null,
          });
        }}
        onRetrieve={handle_retrieve}
        options={{
          proximity: { lng: DALLAS[0], lat: DALLAS[1] },
          language: "en",
          limit: 5,
        }}
        theme={{
          variables: {
            fontFamily: "inherit",
            unit: "14px",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            boxShadow: "none",
            border: "1px solid var(--color-border)",
            colorBackground: "var(--color-surface, #fff)",
            colorText: "var(--color-text, #1e293b)",
            colorPrimary: "#6366f1",
          },
        }}
      />

      {/* Map container */}
      <div
        ref={container_ref}
        className="mt-2 h-75 w-full overflow-hidden rounded-lg sm:h-90 lg:h-110"
        style={{
          border: "1px solid var(--color-border)",
        }}
      />

      {/* Drag hint + coordinate readout (shown once a pin is placed) */}
      {has_coords && (
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span
            className="text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
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
