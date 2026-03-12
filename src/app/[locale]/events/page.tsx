"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/routing";
import EventCard from "@/components/event_card";
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

export default function EventsPage() {
    const t = useTranslations("Events");
    const { data: session } = useSession();

    const [events, set_events] = useState<EventData[]>([]);
    const [pagination, set_pagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
    const [category, set_category] = useState<string>("");
    const [search, set_search] = useState("");
    const [debounced_search, set_debounced_search] = useState("");
    const [loading, set_loading] = useState(true);
    const [error, set_error] = useState<string | null>(null);
    const [page, set_page] = useState(1);

    // debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            set_debounced_search(search);
            set_page(1); // reset page on new search
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // reset page when category changes
    useEffect(() => {
        set_page(1);
    }, [category]);

    const fetch_events = useCallback(async () => {
        set_loading(true);
        set_error(null);

        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");
        if (category) params.set("category", category);
        if (debounced_search.trim()) params.set("search", debounced_search.trim());

        try {
            const res = await fetch(`/api/events?${params.toString()}`);
            if (!res.ok) {
                throw new Error("Failed to fetch");
            }
            const data: PaginatedResponse = await res.json();
            set_events(data.events);
            set_pagination(data.pagination);
        } catch {
            set_error(t("error_loading"));
        } finally {
            set_loading(false);
        }
    }, [page, category, debounced_search, t]);

    useEffect(() => {
        fetch_events();
    }, [fetch_events]);

    const can_create = session?.user?.role === "PROVIDER" || session?.user?.role === "ADMIN";
    const show_status = session?.user?.role === "PROVIDER" || session?.user?.role === "ADMIN";

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                        {t("page_title")}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                        {t("page_subtitle")}
                    </p>
                </div>
                {can_create && (
                    <Link href="/events/create" className="btn btn-primary no-underline">
                        + {t("create_event")}
                    </Link>
                )}
            </div>

            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => set_search(e.target.value)}
                    placeholder={t("search_placeholder")}
                    className="input max-w-md"
                />
            </div>

            {/* Category filter chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => set_category("")}
                    className={`badge cursor-pointer transition-colors ${!category ? "badge-approved" : ""}`}
                    style={!category ? {} : { background: "var(--color-surface-hover)", color: "var(--color-text-secondary)" }}
                >
                    {t("filter_all")}
                </button>
                {EVENT_CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => set_category(cat)}
                        className={`badge cursor-pointer transition-colors ${category === cat ? `badge-${cat.toLowerCase().replace(/\s+/g, "")}` : ""}`}
                        style={category !== cat ? { background: "var(--color-surface-hover)", color: "var(--color-text-secondary)" } : {}}
                    >
                        {t(`cat_${cat.toLowerCase().replace(/\s+/g, "_")}` as any)}
                    </button>
                ))}
            </div>

            {/* Error state */}
            {error && (
                <div
                    className="p-4 rounded-lg mb-6 text-sm"
                    style={{ background: "#fee2e2", color: "#991b1b" }}
                >
                    {error}
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="text-center py-16" style={{ color: "var(--color-text-secondary)" }}>
                    <p className="text-lg">{t("loading")}</p>
                </div>
            )}

            {/* Events grid */}
            {!loading && !error && events.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            show_status={show_status}
                        />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && !error && events.length === 0 && (
                <div className="text-center py-16" style={{ color: "var(--color-text-secondary)" }}>
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-lg font-medium">{t("no_events_title")}</p>
                    <p className="text-sm">{t("no_events_subtitle")}</p>
                </div>
            )}

            {/* Pagination */}
            {!loading && pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                        onClick={() => set_page((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="btn btn-secondary text-sm"
                        style={page <= 1 ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                    >
                        {t("previous")}
                    </button>
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {t("page_of", { page, total: pagination.total_pages })}
                    </span>
                    <button
                        onClick={() => set_page((p) => Math.min(pagination.total_pages, p + 1))}
                        disabled={page >= pagination.total_pages}
                        className="btn btn-secondary text-sm"
                        style={page >= pagination.total_pages ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                    >
                        {t("next")}
                    </button>
                </div>
            )}
        </div>
    );
}
