"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/routing";
import type { EventData } from "@/components/event_card";
import { category_label, use_categories } from "@/lib/event_categories";
import { type MapBounds } from "@/components/map_view";

// Loaded client-only — no SSR for Mapbox
const MapView = dynamic(() => import("@/components/map_view"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-surface-hover, #f1f5f9)",
        borderRadius: "var(--radius)",
      }}
    >
      <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>
        Loading map…
      </p>
    </div>
  ),
});

// ─────────────────────────────────────────────────────────────
// Props — kept backward-compatible with the original server
// component. placeholder_* props are no longer used visually
// but are kept optional so the parent doesn't need to change.
// ─────────────────────────────────────────────────────────────
type MapPageClientProps = {
  events?: EventData[];           // optional initial data; client re-fetches anyway
  locale: "en" | "es";
  sidebar_count_label: string;    // "events" / "eventos"
  filter_all: string;             // "All" / "Todos"
  view_details: string;           // "View Details" / "Ver Detalles"
  placeholder_title?: string;     // unused — kept for compat
  placeholder_subtitle?: string;  // unused — kept for compat
  placeholder_area?: string;      // unused — kept for compat
};

export function MapPageClient({
  events: initial_events = [],
  locale,
  sidebar_count_label,
  filter_all,
  view_details,
}: MapPageClientProps) {
  const [events, set_events]         = useState<EventData[]>(initial_events);
  const [loading, set_loading]       = useState(true);
  const [search, set_search]         = useState("");
  const [active_cats, set_active_cats] = useState<Set<string>>(new Set());
  const [selected_id, set_selected_id] = useState<string | null>(null);
  const [map_bounds, set_map_bounds]   = useState<MapBounds | null>(null);
  const [cats_open, set_cats_open]     = useState(false);
  const { categories } = use_categories();

  // Fetch approved events on mount
  useEffect(() => {
    fetch("/api/events?limit=100&status=APPROVED")
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.events) {
          set_events(data.events.filter((e: EventData) => e.status === "APPROVED"));
        }
      })
      .catch(console.error)
      .finally(() => set_loading(false));
  }, []);

  const toggle_cat = useCallback((cat: string) => {
    set_active_cats(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
    set_selected_id(null);
  }, []);

  const clear_cats = useCallback(() => {
    set_active_cats(new Set());
    set_selected_id(null);
  }, []);

  const on_bounds_change = useCallback((b: MapBounds) => set_map_bounds(b), []);
  const on_event_click   = useCallback(
    (id: string) => set_selected_id(prev => (prev === id ? null : id)),
    [],
  );

  // Filter by active categories + search text
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return events.filter(e => {
      if (active_cats.size > 0 && !active_cats.has(e.category.id)) return false;
      if (!q) return true;
      const title = locale === "es" ? e.title_es : e.title_en;
      return (
        title.toLowerCase().includes(q) ||
        e.location_name.toLowerCase().includes(q) ||
        (e.location_address ?? "").toLowerCase().includes(q) ||
        category_label(e.category, locale).toLowerCase().includes(q)
      );
    });
  }, [events, active_cats, search, locale]);

  // Further filter sidebar list to only events visible in the current map viewport
  const sidebar_events = useMemo(() => {
    if (!map_bounds) return filtered;
    return filtered.filter(
      e =>
        e.latitude  >= map_bounds.south &&
        e.latitude  <= map_bounds.north &&
        e.longitude >= map_bounds.west  &&
        e.longitude <= map_bounds.east,
    );
  }, [filtered, map_bounds]);

  const active_count = active_cats.size;

  // ─── Shared UI fragments (rendered in both mobile + desktop slots) ───

  const search_el = (
    <input
      type="text"
      value={search}
      onChange={e => set_search(e.target.value)}
      placeholder={`🔍  Search events…`}
      className="input"
      style={{ fontSize: 13, width: "100%" }}
    />
  );

  const cats_el = (
    <div
      className="card"
      style={{ padding: "10px 12px" }}
    >
      {/* Toggle button */}
      <button
        onClick={() => set_cats_open(o => !o)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          fontSize: 12,
          fontWeight: 600,
          color: "var(--color-text)",
        }}
      >
        <span>
          📂{" "}
          {active_count > 0
            ? `${active_count} categor${active_count === 1 ? "y" : "ies"} selected`
            : "All categories"}
        </span>
        <span
          style={{
            fontSize: 9,
            color: "var(--color-text-secondary)",
            marginLeft: 8,
          }}
        >
          {cats_open ? "▲" : "▼"}
        </span>
      </button>

      {/* Chip grid */}
      {cats_open && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexWrap: "wrap",
            gap: 5,
          }}
        >
          {/* "All" chip */}
          <button
            onClick={clear_cats}
            style={{
              padding: "3px 9px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              border: `1.5px solid ${
                active_count === 0
                  ? "var(--color-primary)"
                  : "var(--color-border)"
              }`,
              background:
                active_count === 0 ? "var(--color-primary)" : "transparent",
              color:
                active_count === 0 ? "#fff" : "var(--color-text-secondary)",
              cursor: "pointer",
            }}
          >
            {filter_all}
          </button>

          {categories.map(cat => {
            const on  = active_cats.has(cat.id);
            const cfg = cat;
            return (
              <button
                key={cat.id}
                onClick={() => toggle_cat(cat.id)}
                style={{
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1.5px solid ${on ? cfg.color : "var(--color-border)"}`,
                  background: on ? `${cfg.color}18` : "transparent",
                  color: on ? cfg.color : "var(--color-text-secondary)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span>{cfg.emoji}</span>
                <span>{category_label(cat, locale)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const count_el = (
    <p
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: "var(--color-text-secondary)",
        margin: 0,
      }}
    >
      {loading
        ? "Loading…"
        : `${sidebar_events.length} ${sidebar_count_label}`}
    </p>
  );

  const empty_el = (
    <div
      style={{
        textAlign: "center",
        padding: "20px 0",
        color: "var(--color-text-secondary)",
        fontSize: 12,
      }}
    >
      📭 No events visible in this area
    </div>
  );

  const cards_el = sidebar_events.map(evt => (
    <MiniEventCard
      key={evt.id}
      event={evt}
      locale={locale}
      is_selected={evt.id === selected_id}
      view_details={view_details}
      onClick={() => on_event_click(evt.id)}
    />
  ));

  // ─────────────────────────────────────────────────────────────────────
  //
  // LAYOUT STRATEGY
  // ───────────────
  // A single <MapView> instance is placed in the DOM once.
  // CSS Grid on desktop / flex-col on mobile rearranges the other
  // elements around it without ever unmounting / remounting the map.
  //
  // Desktop (lg+)
  //   2-column grid: [map — col 1, spans all rows] | [sidebar — col 2]
  //   Outer container has a fixed viewport-relative height.
  //
  // Phone + iPad portrait (< lg)
  //   Flex-col with `order` to achieve:
  //   search → categories → map (fixed px height) → count → cards (2-col grid)
  //
  // CSS Grid explicit placement (col-start / row-start) overrides the
  // flex `order` on desktop, so no conflicts.
  //
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div
      className={[
        // Mobile: flex column
        "flex flex-col gap-3",
        // Desktop: 2-col grid, viewport-height container
        "lg:grid lg:gap-4",
        "lg:grid-cols-[1fr_320px]",
        "lg:grid-rows-[auto_auto_auto_1fr]",
        "lg:h-[calc(100dvh_-_10rem)]",
      ].join(" ")}
    >
      {/* ── Search ── mobile: order 1 / desktop: col 2 row 1 */}
      <div className="order-1 lg:col-start-2 lg:row-start-1">
        {search_el}
      </div>

      {/* ── Category filter ── mobile: order 2 / desktop: col 2 row 2 */}
      <div className="order-2 lg:col-start-2 lg:row-start-2">
        {cats_el}
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────
           Mobile:  order 3, 50dvh (min 320 px) height
           Desktop: col 1, spans all 4 rows → fills entire grid height
          ──────────────────────────────────────────────────────────────── */}
      <div
        className={[
          "order-3",
          "rounded-xl overflow-hidden",
          "h-[50dvh] min-h-[320px]",
          // Desktop overrides
          "lg:col-start-1 lg:row-start-1 lg:row-span-4",
          "lg:h-full",
        ].join(" ")}
      >
        <MapView
          events={filtered}
          selected_id={selected_id}
          onEventClick={on_event_click}
          onBoundsChange={on_bounds_change}
        />
      </div>

      {/* ── Count label ── mobile: order 4 / desktop: col 2 row 3 */}
      <div className="order-4 lg:col-start-2 lg:row-start-3">
        {count_el}
      </div>

      {/* ── Event cards ─────────────────────────────────────────────────
           Mobile:  order 5, 2-column grid
           Desktop: col 2 row 4, single column, vertically scrollable
          ──────────────────────────────────────────────────────────────── */}
      <div
        className={[
          "order-5",
          "lg:col-start-2 lg:row-start-4",
          "lg:overflow-y-auto",
        ].join(" ")}
      >
        {sidebar_events.length === 0 ? (
          empty_el
        ) : (
          <div
            className="grid grid-cols-2 @2xl:grid-cols-3 lg:grid-cols-1 gap-2"
          >
            {cards_el}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Compact sidebar event card
// ─────────────────────────────────────────────────────────────
function MiniEventCard({
  event,
  locale,
  is_selected,
  view_details,
  onClick,
}: {
  event: EventData;
  locale: "en" | "es";
  is_selected: boolean;
  view_details: string;
  onClick: () => void;
}) {
  const cfg = event.category;
  const title = locale === "es" ? event.title_es : event.title_en;
  const loc   = locale === "es" ? "es-US" : "en-US";

  const date = new Date(event.start_time).toLocaleDateString(loc, {
    month: "short",
    day: "numeric",
  });
  const time = new Date(event.start_time).toLocaleTimeString(loc, {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div
      onClick={onClick}
      style={{
        background:  "var(--color-surface)",
        border:      `1.5px solid ${is_selected ? cfg.color : "var(--color-border)"}`,
        borderRadius: "var(--radius)",
        padding:     "12px 12px",
        cursor:      "pointer",
        display:     "flex",
        flexDirection: "column",
        gap: 3,
        boxShadow:   is_selected ? `0 0 0 3px ${cfg.color}22` : "none",
        transition:  "border-color .15s, box-shadow .15s",
      }}
    >
      {/* Category dot + label */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: cfg.color,
            display: "inline-block",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: cfg.color,
            textTransform: "uppercase",
            letterSpacing: ".06em",
          }}
        >
          {cfg.emoji} {category_label(event.category, locale)}
        </span>
      </div>

      {/* Title */}
      <div
        className="line-clamp-2"
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--color-text)",
          lineHeight: 1.35,
        }}
      >
        {title}
      </div>

      {/* Date + time */}
      <div style={{ fontSize: 10.5, color: "var(--color-text-secondary)" }}>
        {date} · {time}
      </div>

      {/* Location */}
      <div
        className="line-clamp-1"
        style={{ fontSize: 10.5, color: "var(--color-text-secondary)" }}
      >
        📍 {event.location_name}
        {event.location_address ? ` · ${event.location_address}` : ""}
      </div>

      {/* View details link — stopPropagation so card click doesn't fire too */}
      <Link
        href={`/events/${event.id}`}
        onClick={e => e.stopPropagation()}
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          color: cfg.color,
          textDecoration: "none",
          marginTop: 1,
        }}
      >
        {view_details} →
      </Link>
    </div>
  );
}