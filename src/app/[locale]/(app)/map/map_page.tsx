"use client";

import { useState, useEffect } from "react";
import { Map } from "lucide-react";
import { EventCard } from "@/components/ui/event-card";
import { Tabs } from "@/components/ui/tabs";
import dynamic from "next/dynamic";
import type { EventData } from "@/components/event_card";
import { EVENT_CATEGORIES } from "@/lib/validators/event";

const MapView = dynamic(() => import("@/components/map_view"), { ssr: false });

type MapPageClientProps = {
    events: EventData[];
    locale: "en" | "es";
    sidebar_count_label: string;
    placeholder_title: string;
    placeholder_subtitle: string;
    placeholder_area: string;
    filter_all: string;
    view_details: string;
};

export function MapPageClient({
    events: initialEvents,
    locale,
    sidebar_count_label,
    placeholder_title,
    placeholder_subtitle,
    placeholder_area,
    filter_all,
    view_details,
}: MapPageClientProps) {
    const [active_category, set_active_category] = useState("all");
    const [selected_id, set_selected_id] = useState<string | null>(null);
    const [events, set_events] = useState(initialEvents);
    const [loading, set_loading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch("/api/events?status=APPROVED&limit=100");
                if (res.ok) {
                    const data = await res.json();
                    set_events(data.events);
                }
            } catch (error) {
                console.error("Failed to fetch events:", error);
            } finally {
                set_loading(false);
            }
        };
        fetchEvents();
    }, []);

    const category_tabs = [
        { key: "all", label: filter_all },
        ...EVENT_CATEGORIES.map((c) => ({ key: c, label: c })),
    ];

    const filtered = events.filter(
        (e) => active_category === "all" || e.category === active_category
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg">Loading events...</div>
            </div>
        );
    }

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

                {/* Interactive map */}
                <MapView events={filtered} onEventClick={set_selected_id} />
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
                            compact
                            onClick={() => set_selected_id(evt.id === selected_id ? null : evt.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
