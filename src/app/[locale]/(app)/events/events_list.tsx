"use client";

import { useState } from "react";
import { Search, CalendarDays } from "lucide-react";
import { EventCard } from "@/components/ui/event-card";
import { Tabs } from "@/components/ui/tabs";
import type { MockEvent } from "@/lib/mock_data";
import { EVENT_CATEGORIES } from "@/lib/mock_data";

type EventsListClientProps = {
    events: MockEvent[];
    locale: "en" | "es";
    role: string;
    search_placeholder: string;
    all_categories: string;
    no_results: string;
    view_details: string;
    rsvps: string;
};

export function EventsListClient({
    events,
    locale,
    role,
    search_placeholder,
    all_categories,
    no_results,
    view_details,
    rsvps,
}: EventsListClientProps) {
    const [search, set_search] = useState("");
    const [active_category, set_active_category] = useState("all");

    const category_tabs = [
        { key: "all", label: all_categories },
        ...EVENT_CATEGORIES.map((c) => ({ key: c, label: c })),
    ];

    const filtered = events
        .filter((e) => (role === "USER" ? e.status === "APPROVED" : true))
        .filter((e) => active_category === "all" || e.category === active_category)
        .filter((e) => {
            const q = search.toLowerCase();
            return (
                e.title_en.toLowerCase().includes(q) ||
                e.title_es.toLowerCase().includes(q) ||
                e.location_name.toLowerCase().includes(q)
            );
        });

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative flex items-center">
                <Search
                    size={16}
                    className="absolute left-3 shrink-0 pointer-events-none"
                    style={{ color: "var(--color-text-secondary)" }}
                />
                <input
                    type="search"
                    className="input w-full"
                    style={{ paddingLeft: "2.25rem" }}
                    placeholder={search_placeholder}
                    value={search}
                    onChange={(e) => set_search(e.target.value)}
                />
            </div>

            {/* Category chips */}
            <div className="overflow-x-auto pb-1">
                <Tabs
                    tabs={category_tabs}
                    activeTab={active_category}
                    onChange={set_active_category}
                    variant="chips"
                />
            </div>

            {/* Results count */}
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {filtered.length} {filtered.length === 1 ? "event" : "events"}
            </p>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <CalendarDays size={48} style={{ color: "var(--color-border)" }} />
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {no_results}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((evt) => (
                        <EventCard
                            key={evt.id}
                            event={evt}
                            locale={locale}
                            view_details_label={view_details}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
