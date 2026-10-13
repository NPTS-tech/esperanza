"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "@/lib/auth-client";
import { Link } from "@/i18n/routing";
import { List, CalendarDays, ChevronDown, ChevronUp, Plus, Check, Star } from "lucide-react";
import EventCard from "@/components/event_card";
import CalendarView from "@/components/calendar_view";
import type { EventData } from "@/components/event_card";
import { category_label, type CategoryDto, use_categories } from "@/lib/event_categories";

interface PaginatedResponse {
  events: EventData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ── Time filter dropdown ────────────────────────────────────────────────
function TimeFilterDropdown({
  timeFilter,
  setTimeFilter,
  t,
}: {
  timeFilter: "all" | "past" | "future";
  setTimeFilter: (f: "all" | "past" | "future") => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const labels: Record<string, string> = {
    all: "All Events",
    past: "Past Events",
    future: "Future Events",
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
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
          background: timeFilter !== "all" ? "var(--color-surface-hover)" : "var(--color-surface)",
          color: "var(--color-text)",
          fontFamily: "inherit",
          whiteSpace: "nowrap",
          transition: "background .12s",
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        Time: <strong>{labels[timeFilter]}</strong>
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
            minWidth: 160,
            padding: "4px 0",
          }}
          role="listbox"
        >
          {(["all", "past", "future"] as const).map((option) => (
            <button
              key={option}
              onClick={() => {
                setTimeFilter(option);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: option === timeFilter ? 600 : 400,
                background: option === timeFilter ? "var(--color-surface-hover)" : "transparent",
                color: "var(--color-text)",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "background .1s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = option === timeFilter ? "var(--color-surface-hover)" : "transparent")}
              role="option"
              aria-selected={option === timeFilter}
            >
              {labels[option]}
              {option === timeFilter && <Check size={13} style={{ color: "var(--color-primary)" }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Category dropdown ────────────────────────────────────────────────
// Rows come from the seeded event_categories table. The special
// "interests" value filters to the signed-in user's saved categories,
// and each row has a star to save/remove that interest inline.
function CategoryDropdown({
  category,
  set_category,
  categories,
  interest_ids,
  on_toggle_interest,
  show_interests,
  locale,
  t,
}: {
  category: string;
  set_category: (c: string) => void;
  categories: CategoryDto[];
  interest_ids: Set<string>;
  on_toggle_interest: (id: string) => void;
  show_interests: boolean;
  locale: string;
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

  const selected_category = categories.find((c) => c.id === category);
  const label =
    category === "interests"
      ? t("filter_interests")
      : selected_category
        ? category_label(selected_category, locale)
        : t("filter_all");

  const row_style = (selected: boolean) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "8px 14px",
    fontSize: 13,
    fontWeight: selected ? 600 : 400,
    background: selected ? "var(--color-surface-hover)" : "transparent",
    color: "var(--color-text)",
    border: "none",
    cursor: "pointer",
    textAlign: "left" as const,
    fontFamily: "inherit",
    transition: "background .1s",
  });

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
            minWidth: 220,
            padding: "4px 0",
            maxHeight: 320,
            overflowY: "auto",
          }}
          role="listbox"
        >
          {/* All option */}
          <button
            onClick={() => { set_category(""); set_open(false); }}
            style={row_style(!category)}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-hover)")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = !category ? "var(--color-surface-hover)" : "transparent")}
            role="option"
            aria-selected={!category}
          >
            {t("filter_all")}
            {!category && <Check size={13} style={{ color: "var(--color-primary)" }} />}
          </button>

          {/* Interests option — right under All */}
          {show_interests && (
            <button
              onClick={() => { set_category("interests"); set_open(false); }}
              style={row_style(category === "interests")}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--color-surface-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = category === "interests" ? "var(--color-surface-hover)" : "transparent")}
              role="option"
              aria-selected={category === "interests"}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Star
                  size={13}
                  style={{
                    color: interest_ids.size > 0 ? "#f59e0b" : "var(--color-text-secondary)",
                    fill: interest_ids.size > 0 ? "#f59e0b" : "none",
                  }}
                />
                {t("filter_interests")}
              </span>
              {category === "interests" && <Check size={13} style={{ color: "var(--color-primary)" }} />}
            </button>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />

          {/* Categories — click row to filter, star to save the interest */}
          {categories.map((cat) => {
            const is_sel = category === cat.id;
            const is_interest = interest_ids.has(cat.id);
            return (
              <div
                key={cat.id}
                style={{
                  display: "flex",
                  alignItems: "stretch",
                  background: is_sel ? "var(--color-surface-hover)" : "transparent",
                  transition: "background .1s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "var(--color-surface-hover)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = is_sel ? "var(--color-surface-hover)" : "transparent")}
              >
                <button
                  onClick={() => { set_category(cat.id); set_open(false); }}
                  style={{ ...row_style(is_sel), flex: 1, background: "none" }}
                  role="option"
                  aria-selected={is_sel}
                >
                  <span style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                    {category_label(cat, locale)}
                  </span>
                  {is_sel && <Check size={13} style={{ color: "var(--color-primary)", flexShrink: 0 }} />}
                </button>
                {show_interests && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      on_toggle_interest(cat.id);
                    }}
                    aria-label={is_interest ? t("remove_from_interests") : t("add_to_interests")}
                    aria-pressed={is_interest}
                    title={is_interest ? t("remove_from_interests") : t("add_to_interests")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 34,
                      flexShrink: 0,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <Star
                      size={14}
                      style={{
                        color: is_interest ? "#f59e0b" : "var(--color-text-secondary)",
                        fill: is_interest ? "#f59e0b" : "none",
                      }}
                    />
                  </button>
                )}
              </div>
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
  const locale = useLocale();
  const { data: session } = useSession();
  const { categories } = use_categories();

  const [events, set_events]           = useState<EventData[]>([]);
  const [pagination, set_pagination]   = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  // "" = All, "interests" = user's saved categories, otherwise a category ID
  const [category, set_category]       = useState<string>("");
  const [interest_ids, set_interest_ids] = useState<Set<string>>(new Set());
  const [search, set_search]           = useState("");
  const [debounced_search, set_debounced_search] = useState("");
  const [loading, set_loading]         = useState(true);
  const [error, set_error]             = useState<string | null>(null);
  const [page, set_page]               = useState(1);
  const [view, set_view]               = useState<"list" | "calendar">("list");
  const [timeFilter, setTimeFilter]    = useState<"all" | "past" | "future">("future");

  const is_signed_in = Boolean(session?.user);

  // Load the signed-in user's interests once
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    fetch("/api/users/me/interests")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.category_ids) {
          set_interest_ids(new Set<string>(data.category_ids));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  async function toggle_interest(category_id: string) {
    const previous = interest_ids;
    const next = new Set(previous);
    if (next.has(category_id)) {
      next.delete(category_id);
    } else {
      next.add(category_id);
    }
    set_interest_ids(next);

    try {
      const res = await fetch("/api/users/me/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_ids: [...next] }),
      });
      if (!res.ok) throw new Error("Failed to update interests");
      const data = await res.json();
      set_interest_ids(new Set<string>(data.category_ids));
    } catch {
      set_interest_ids(previous);
    }
  }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { set_debounced_search(search); set_page(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on category/filter change
  useEffect(() => { set_page(1); }, [category, timeFilter]);

  const fetch_events = useCallback(async () => {
    set_loading(true);
    set_error(null);

    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("limit", view === "calendar" ? "100" : "20");


    if (category === "interests") {
      params.set("interests", "true");
    } else if (category) {
      params.set("category", category);
    }
    if (debounced_search.trim()) params.set("search", debounced_search.trim());

    // Calculate date range for time filter
    const now = new Date();
    if (timeFilter === "future") {
      params.set("start_date", now.toISOString());
    } else if (timeFilter === "past") {
      params.set("end_date", now.toISOString());
    }

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
  }, [page, category, debounced_search, t, view, timeFilter, interest_ids]);

  useEffect(() => { fetch_events(); }, [fetch_events]);

  const can_create = session?.user?.role === "PROVIDER" || session?.user?.role === "ADMIN";

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

      {/* ── Controls row: search + filters ── */}
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
          categories={categories}
          interest_ids={interest_ids}
          on_toggle_interest={(id) => { void toggle_interest(id); }}
          show_interests={is_signed_in}
          locale={locale}
          t={t}
        />
        <TimeFilterDropdown
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
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
                <EventCard key={event.id} event={event} />
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