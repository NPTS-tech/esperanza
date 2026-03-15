"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { List, CalendarDays, ChevronDown, ChevronUp, Plus, Check } from "lucide-react";
import EventCard from "@/components/event_card";
import CalendarView from "@/components/calendar_view";
import type { EventData } from "@/components/event_card";
import { EVENT_CATEGORIES } from "@/lib/validators/event";

interface PaginatedResponse {
  events: EventData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ── Category dropdown ────────────────────────────────────────────────
function CategoryDropdown({
  category,
  set_category,
  t,
}: {
  category: string;
  set_category: (c: string) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, set_open] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) set_open(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const label = category
    ? t(`cat_${category.toLowerCase().replace(/\s+/g, "_")}` as any)
    : t("filter_all");

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => set_open((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "7px 12px",
          fontSize: 13,
          fontWeight: 500,
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          cursor: "pointer",
          background: category ? "var(--color-surface-hover)" : "var(--color-surface)",
          color: "var(--color-text)",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          transition: "background .12s",
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        Category: <strong>{label}</strong>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 50,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            boxShadow: "0 6px 24px rgba(0,0,0,0.10)",
            minWidth: 200,
            padding: "4px 0",
            maxHeight: 320,
            overflowY: "auto",
          }}
          role="listbox"
        >
          {/* All option */}
          <button
            onClick={() => { set_category(""); set_open(false); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: !category ? 600 : 400,
              background: !category ? "var(--color-surface-hover)" : "transparent",
              color: "var(--color-text)",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              fontFamily: "inherit",
              transition: "background .1s",
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-hover)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = !category ? "var(--color-surface-hover)" : "transparent")}
            role="option"
            aria-selected={!category}
          >
            {t("filter_all")}
            {!category && <Check size={13} style={{ color: "var(--color-primary)" }} />}
          </button>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />

          {/* Categories */}
          {EVENT_CATEGORIES.map((cat) => {
            const is_sel = category === cat;
            return (
              <button
                key={cat}
                onClick={() => { set_category(cat); set_open(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 14px",
                  fontSize: 13,
                  fontWeight: is_sel ? 600 : 400,
                  background: is_sel ? "var(--color-surface-hover)" : "transparent",
                  color: "var(--color-text)",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-hover)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = is_sel ? "var(--color-surface-hover)" : "transparent")}
                role="option"
                aria-selected={is_sel}
              >
                {t(`cat_${cat.toLowerCase().replace(/\s+/g, "_")}` as any)}
                {is_sel && <Check size={13} style={{ color: "var(--color-primary)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── View toggle (segmented control) ─────────────────────────────────
function ViewToggle({
  view,
  set_view,
}: {
  view: "list" | "calendar";
  set_view: (v: "list" | "calendar") => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {(["list", "calendar"] as const).map((v, i) => {
        const active = view === v;
        return (
          <button
            key={v}
            onClick={() => set_view(v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              border: "none",
              borderLeft: i > 0 ? "1px solid var(--color-border)" : "none",
              background: active ? "var(--color-primary)" : "transparent",
              color: active ? "#fff" : "var(--color-text-secondary)",
              transition: "background .12s, color .12s",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => {
              if (!active)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "var(--color-surface-hover)";
            }}
            onMouseLeave={(e) => {
              if (!active)
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
            aria-pressed={active}
          >
            {v === "list" ? <List size={13} /> : <CalendarDays size={13} />}
            {v === "list" ? "List" : "Calendar"}
          </button>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────
export default function EventsPage() {
  const t = useTranslations("Events");
  const { data: session } = useSession();

  const [events, set_events]           = useState<EventData[]>([]);
  const [pagination, set_pagination]   = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [category, set_category]       = useState<string>("");
  const [search, set_search]           = useState("");
  const [debounced_search, set_debounced_search] = useState("");
  const [loading, set_loading]         = useState(true);
  const [error, set_error]             = useState<string | null>(null);
  const [page, set_page]               = useState(1);
  const [view, set_view]               = useState<"list" | "calendar">("list");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { set_debounced_search(search); set_page(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on category change
  useEffect(() => { set_page(1); }, [category]);

  const fetch_events = useCallback(async () => {
    set_loading(true);
    set_error(null);

    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", view === "calendar" ? "100" : "20");
    if (category) params.set("category", category);
    if (debounced_search.trim()) params.set("search", debounced_search.trim());

    try {
      const res = await fetch(`/api/events?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data: PaginatedResponse = await res.json();
      set_events(data.events);
      set_pagination(data.pagination);
    } catch {
      set_error(t("error_loading"));
    } finally {
      set_loading(false);
    }
  }, [page, category, debounced_search, t, view]);

  useEffect(() => { fetch_events(); }, [fetch_events]);

  const can_create = session?.user?.role === "PROVIDER" || session?.user?.role === "ADMIN";
  const show_status = session?.user?.role === "PROVIDER" || session?.user?.role === "ADMIN";

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
          {t("page_title")}
        </h1>

        <div className="flex items-center gap-3">
          {can_create && (
            <Link
              href="/events/create"
              className="no-underline"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                background: "var(--color-primary)",
                color: "#fff",
                borderRadius: 8,
                border: "none",
              }}
            >
              <Plus size={13} />
              {t("create_event")}
            </Link>
          )}
          <ViewToggle view={view} set_view={set_view} />
        </div>
      </div>

      {/* ── Controls row: search + category ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => set_search(e.target.value)}
          placeholder={t("search_placeholder")}
          className="input"
          style={{ flex: "1 1 200px", minWidth: 0, maxWidth: 420, fontSize: 13 }}
        />
        <CategoryDropdown
          category={category}
          set_category={(c) => { set_category(c); }}
          t={t}
        />
      </div>

      {/* ── Error ── */}
      {error && (
        <div
          className="p-4 rounded-lg mb-5 text-sm"
          style={{ background: "#fee2e2", color: "#991b1b" }}
        >
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="text-center py-16" style={{ color: "var(--color-text-secondary)" }}>
          <p className="text-sm">{t("loading")}</p>
        </div>
      )}

      {/* ── Events ── */}
      {!loading && !error && events.length > 0 && (
        <>
          {view === "list" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} show_status={show_status} />
              ))}
            </div>
          )}

          {view === "calendar" && (
            <CalendarView
              events={events.map((e) => ({
                id: e.id,
                title_en: e.title_en,
                title_es: e.title_es,
                start_time: e.start_time,
                end_time: e.end_time,
                category: e.category,
                location_name: e.location_name,
              }))}
            />
          )}
        </>
      )}

      {/* ── Empty ── */}
      {!loading && !error && events.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--color-text-secondary)" }}>
          <p className="text-3xl mb-3" style={{ opacity: 0.4 }}>—</p>
          <p className="text-sm font-medium">{t("no_events_title")}</p>
          <p className="text-xs mt-1">{t("no_events_subtitle")}</p>
        </div>
      )}

      {/* ── Pagination (list only) ── */}
      {!loading && view === "list" && pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => set_page((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn btn-secondary text-sm"
            style={page <= 1 ? { opacity: 0.4, cursor: "not-allowed" } : {}}
          >
            {t("previous")}
          </button>
          <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
            {t("page_of", { page, total: pagination.total_pages })}
          </span>
          <button
            onClick={() => set_page((p) => Math.min(pagination.total_pages, p + 1))}
            disabled={page >= pagination.total_pages}
            className="btn btn-secondary text-sm"
            style={page >= pagination.total_pages ? { opacity: 0.4, cursor: "not-allowed" } : {}}
          >
            {t("next")}
          </button>
        </div>
      )}
    </div>
  );
}