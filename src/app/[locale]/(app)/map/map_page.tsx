"use client";

import { useState } from "react";
import { Map } from "lucide-react";
import { EventCard } from "@/components/ui/event-card";
import { Tabs } from "@/components/ui/tabs";
import type { MockEvent } from "@/lib/mock_data";
import { EVENT_CATEGORIES } from "@/lib/mock_data";

type MapPageClientProps = {
    events: MockEvent[];
    locale: "en" | "es";
    sidebar_count_label: string;
    placeholder_title: string;
    placeholder_subtitle: string;
    placeholder_area: string;
    filter_all: string;
    view_details: string;
    rsvps: string;
};

export function MapPageClient({
    events,
    locale,
    sidebar_count_label,
    placeholder_title,
    placeholder_subtitle,
    placeholder_area,
    filter_all,
    view_details,
    rsvps,
}: MapPageClientProps) {
    const [active_category, set_active_category] = useState("all");
    const [selected_id, set_selected_id] = useState<string | null>(null);

    const category_tabs = [
        { key: "all", label: filter_all },
        ...EVENT_CATEGORIES.map((c) => ({ key: c, label: c })),
    ];

    const filtered = events.filter(
        (e) => active_category === "all" || e.category === active_category
    );

    return (
        <div
            className="flex flex-col md:flex-row gap-4"
            style={{ height: "calc(100vh - 12rem)" }}
        >
            {/* Map area */}
            <div className="card flex-1 relative overflow-hidden" style={{ minHeight: "300px" }}>
                {/* Category filter overlay */}
                <div className="absolute top-3 left-3 right-3 z-10 overflow-x-auto pb-1">
                    <Tabs
                        tabs={category_tabs}
                        activeTab={active_category}
                        onChange={set_active_category}
                        variant="chips"
                    />
                </div>

                {/* Placeholder map */}
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3"
                    style={{ background: "var(--color-surface-hover)" }}
                >
                    <Map size={56} style={{ color: "var(--color-primary)" }} opacity={0.4} />
                    <p
                        className="text-lg font-semibold"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {placeholder_title}
                    </p>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {placeholder_subtitle}
                    </p>
                    <p
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                            color: "var(--color-text-secondary)",
                            background: "var(--color-border)",
                        }}
                    >
                        {placeholder_area}
                    </p>

                    {/* Event pins summary */}
                    {filtered.length > 0 && (
                        <p
                            className="text-xs mt-2 font-medium"
                            style={{ color: "var(--color-primary)" }}
                        >
                            {filtered.length} {sidebar_count_label}
                        </p>
                    )}
                </div>
            </div>

            {/* Event sidebar */}
            <div
                className="w-full md:w-72 lg:w-80 flex flex-col gap-3 overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 12rem)" }}
            >
                <p
                    className="text-xs font-semibold px-1"
                    style={{ color: "var(--color-text-secondary)" }}
                >
                    {filtered.length} {sidebar_count_label}
                </p>
                {filtered.map((evt) => (
                    <div
                        key={evt.id}
                        className={selected_id === evt.id ? "ring-2 ring-[var(--color-primary)] rounded-[var(--radius)]" : ""}
                    >
                        <EventCard
                            event={evt}
                            locale={locale}
                            view_details_label={view_details}
                            rsvp_label={rsvps}
                            compact
                            onClick={() => set_selected_id(evt.id === selected_id ? null : evt.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
