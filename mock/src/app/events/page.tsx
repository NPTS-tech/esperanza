"use client";

import { useState } from "react";
import EventCard from "@/components/event_card";
import {
    get_approved_events,
    mock_current_user,
    is_user_rsvped,
    EVENT_CATEGORIES,
} from "@/lib/mock_data";

export default function EventsPage() {
    const events = get_approved_events();
    const [filter, set_filter] = useState("All");
    const [view, set_view] = useState<"grid" | "calendar">("grid");

    const filtered = filter === "All"
        ? events
        : events.filter((e) => e.category === filter);

    function handle_rsvp(event_id: string) {
        alert(`Mock RSVP toggled for event ${event_id}`);
    }

    // group events by date for calendar view
    const events_by_date: Record<string, typeof events> = {};
    for (const event of filtered) {
        const date_key = new Date(event.start_time).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
        if (!events_by_date[date_key]) {
            events_by_date[date_key] = [];
        }
        events_by_date[date_key].push(event);
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Events</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Upcoming events at and around the Esperanza Community Center
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => set_view("grid")}
                        className={`btn text-sm ${view === "grid" ? "btn-primary" : "btn-secondary"}`}
                    >
                        Grid
                    </button>
                    <button
                        onClick={() => set_view("calendar")}
                        className={`btn text-sm ${view === "calendar" ? "btn-primary" : "btn-secondary"}`}
                    >
                        Calendar
                    </button>
                </div>
            </div>

            {/* category filter chips */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => set_filter("All")}
                    className={`badge cursor-pointer ${filter === "All" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                >
                    All
                </button>
                {EVENT_CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => set_filter(cat)}
                        className={`badge cursor-pointer ${filter === cat ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {view === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            is_rsvped={is_user_rsvped(mock_current_user.id, event.id)}
                            on_rsvp={handle_rsvp}
                        />
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(events_by_date).map(([date, date_events]) => (
                        <div key={date}>
                            <h3 className="text-lg font-semibold text-slate-800 mb-3 pb-2 border-b border-slate-200">
                                📅 {date}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {date_events.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        is_rsvped={is_user_rsvped(mock_current_user.id, event.id)}
                                        on_rsvp={handle_rsvp}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filtered.length === 0 && (
                <div className="text-center py-16 text-slate-400">
                    <p className="text-4xl mb-3">📭</p>
                    <p className="text-lg font-medium">No events found</p>
                    <p className="text-sm">Try a different category filter.</p>
                </div>
            )}
        </div>
    );
}
