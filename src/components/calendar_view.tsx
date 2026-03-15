"use client";

import {
  Calendar,
  dateFnsLocalizer,
  Views,
  type View,
  type ToolbarProps,
} from "react-big-calendar";
import { useLocale } from "next-intl";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ChevronLeft, ChevronRight, MapPin, Clock, CalendarDays, X } from "lucide-react";
import { Link } from "@/i18n/routing";

import "react-big-calendar/lib/css/react-big-calendar.css";

// ── Category colors (mirrors map_view.tsx) ──────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Health:            "#ef4444",
  Employment:        "#3b82f6",
  Financial:         "#22c55e",
  Recreation:        "#f97316",
  Transit:           "#8b5cf6",
  "Senior Services": "#06b6d4",
  Education:         "#eab308",
  Community:         "#6366f1",
  Other:             "#6b7280",
};

// ── Types ───────────────────────────────────────────────────────────
interface EventItem {
  id: string;
  title_en: string;
  title_es: string;
  start_time: string;
  end_time: string;
  category: string;
  location_name: string;
}

interface CalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  category: string;
  location_name: string;
}

interface CalendarViewProps {
  events: EventItem[];
}

// ── Custom toolbar ──────────────────────────────────────────────────
function CustomToolbar({ label, view, onNavigate, onView }: ToolbarProps) {
  const views_list: View[] = [Views.MONTH, Views.WEEK, Views.DAY];

  const nav_btn = (onClick: () => void, children: React.ReactNode, aria: string) => (
    <button
      onClick={onClick}
      aria-label={aria}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "5px 11px",
        fontSize: 12,
        fontWeight: 500,
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        cursor: "pointer",
        background: "transparent",
        color: "var(--color-text-secondary)",
        transition: "background .12s",
        fontFamily: "inherit",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-hover)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
    >
      {children}
    </button>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
      {/* Back · Today · Next */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {nav_btn(() => onNavigate("PREV"), <><ChevronLeft size={13} /> Back</>, "Previous")}
        <button
          onClick={() => onNavigate("TODAY")}
          aria-label="Today"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 11px", fontSize: 12, fontWeight: 600,
            border: "1px solid var(--color-primary)", borderRadius: 8,
            cursor: "pointer", background: "transparent",
            color: "var(--color-primary)", transition: "background .12s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-hover)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "transparent")}
        >
          Today
        </button>
        {nav_btn(() => onNavigate("NEXT"), <>Next <ChevronRight size={13} /></>, "Next")}
      </div>

      {/* Label */}
      <span style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text)", letterSpacing: "-0.01em" }}>
        {label}
      </span>

      {/* Month / Week / Day segmented control */}
      <div style={{ display: "flex", border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
        {views_list.map((v, i) => {
          const active = view === v;
          return (
            <button
              key={v}
              onClick={() => onView(v)}
              style={{
                padding: "5px 13px", fontSize: 12, fontWeight: 500,
                cursor: "pointer", border: "none", fontFamily: "inherit",
                borderLeft: i > 0 ? "1px solid var(--color-border)" : "none",
                background: active ? "var(--color-primary)" : "transparent",
                color: active ? "#fff" : "var(--color-text-secondary)",
                transition: "background .12s, color .12s",
                textTransform: "capitalize",
              }}
              onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-hover)"; }}
              onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
            >
              {v}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Event popup ─────────────────────────────────────────────────────
function EventPopup({ event, locale, onClose }: { event: CalEvent; locale: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const color = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS["Other"];
  const loc = locale === "es" ? "es-US" : "en-US";

  const date_str = event.start.toLocaleDateString(loc, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const time_str =
    event.start.toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" }) +
    " – " +
    event.end.toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" });

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute", top: 52, right: 0, zIndex: 100,
        width: 268,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 14,
        boxShadow: "0 8px 32px rgba(0,0,0,0.13)",
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color }}>
          {event.category}
        </span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--color-text-secondary)", lineHeight: 1 }}
          aria-label="Close"
        >
          <X size={13} />
        </button>
      </div>

      {/* Title */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text)", margin: "0 0 10px", lineHeight: 1.35 }}>
        {event.title}
      </h3>

      {/* Meta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
        {[
          { icon: <CalendarDays size={11} strokeWidth={2} />, text: date_str },
          { icon: <Clock size={11} strokeWidth={2} />,        text: time_str },
          { icon: <MapPin size={11} strokeWidth={2} />,       text: event.location_name },
        ].map(({ icon, text }, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {text}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <Link
        href={`/events/${event.id}`}
        className="no-underline"
        style={{
          display: "block", textAlign: "center",
          background: color, color: "#fff",
          fontSize: 12, fontWeight: 600,
          padding: "8px 12px", borderRadius: 8,
        }}
      >
        View Details →
      </Link>
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────
export default function CalendarView({ events }: CalendarViewProps) {
  const locale = useLocale();
  const [current_view, set_current_view] = useState<View>(Views.MONTH);
  const [current_date, set_current_date] = useState(new Date());
  const [popup_event, set_popup_event] = useState<CalEvent | null>(null);

  const localizer = useMemo(
    () =>
      dateFnsLocalizer({
        format, parse, startOfWeek, getDay,
        locales: {
          en: require("date-fns/locale/en-US"),
          es: require("date-fns/locale/es"),
        },
      }),
    [],
  );

  const mapped = useMemo<CalEvent[]>(
    () =>
      events.map((e) => ({
        id: e.id,
        title: locale === "es" ? e.title_es : e.title_en,
        start: new Date(e.start_time),
        end: new Date(e.end_time),
        category: e.category,
        location_name: e.location_name,
      })),
    [events, locale],
  );

  const event_prop_getter = useCallback((event: CalEvent) => {
    const color = CATEGORY_COLORS[event.category] ?? CATEGORY_COLORS["Other"];
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: "#fff",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 500,
        border: "none",
        padding: "1px 6px",
      },
    };
  }, []);

  const on_select_event = useCallback(
    (event: CalEvent) => set_popup_event((prev) => (prev?.id === event.id ? null : event)),
    [],
  );
  const on_select_slot  = useCallback(() => set_popup_event(null), []);
  const close_popup     = useCallback(() => set_popup_event(null), []);

  if (mapped.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-16" style={{ color: "var(--color-text-secondary)" }}>
        <p className="text-sm">No events to display</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {popup_event && <EventPopup event={popup_event} locale={locale} onClose={close_popup} />}

      {/* Scoped calendar style overrides */}
      <style>{`
        .rbc-calendar { font-family: inherit !important; color: var(--color-text) !important; }
        .rbc-header {
          font-size: 10px !important; font-weight: 600 !important;
          text-transform: uppercase !important; letter-spacing: .05em !important;
          padding: 6px 0 !important; color: var(--color-text-secondary) !important;
          border-bottom: 1px solid var(--color-border) !important;
          background: transparent !important;
        }
        .rbc-month-view, .rbc-time-view {
          border: 1px solid var(--color-border) !important;
          border-radius: 12px !important; overflow: hidden !important;
          background: var(--color-surface) !important;
        }
        .rbc-day-bg { background: var(--color-surface) !important; }
        .rbc-off-range-bg { background: var(--color-surface-hover) !important; opacity: 0.7; }
        .rbc-today { background: color-mix(in srgb, var(--color-primary) 8%, transparent) !important; }
        .rbc-date-cell {
          font-size: 11px !important; font-weight: 500 !important;
          color: var(--color-text-secondary) !important;
          padding: 4px 6px !important; text-align: right !important;
        }
        .rbc-date-cell.rbc-now { font-weight: 700 !important; color: var(--color-primary) !important; }
        .rbc-row-segment { padding: 0 2px 2px !important; }
        .rbc-event { padding: 2px 6px !important; border-radius: 4px !important; }
        .rbc-event:focus { outline: 2px solid var(--color-primary) !important; outline-offset: 1px !important; }
        .rbc-show-more { font-size: 10px !important; font-weight: 600 !important; color: var(--color-primary) !important; background: transparent !important; }
        .rbc-month-row { border-top: 1px solid var(--color-border) !important; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid var(--color-border) !important; }
        .rbc-time-slot { font-size: 10px !important; color: var(--color-text-secondary) !important; }
        .rbc-timeslot-group { border-bottom: 1px solid var(--color-border) !important; }
        .rbc-current-time-indicator { background: var(--color-primary) !important; }
      `}</style>

      <Calendar
        localizer={localizer}
        events={mapped}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "calc(100vh - 260px)", minHeight: 520 }}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        view={current_view}
        date={current_date}
        onView={set_current_view}
        onNavigate={set_current_date}
        eventPropGetter={event_prop_getter as any}
        onSelectEvent={on_select_event as any}
        onSelectSlot={on_select_slot}
        selectable
        popup
        components={{ toolbar: CustomToolbar }}
      />
    </div>
  );
}