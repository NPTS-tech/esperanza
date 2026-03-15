"use client";

import dynamic from "next/dynamic";
import { get_approved_events } from "@/lib/mock_data";

const EventsMapbox = dynamic(() => import("@/components/events_mapbox"), {
    ssr: false,
    loading: () => (
        <div className="h-96 w-full bg-slate-100 animate-pulse" />
    ),
});

export default function MapPage() {
    const events = get_approved_events();

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Neighborhood Map</h1>
                <p className="text-slate-500 text-sm mt-1">
                    See where events and services are located around Esperanza
                </p>
            </div>

            {/* map */}
            <div className="card overflow-hidden mb-6">
                <EventsMapbox events={events} />
            </div>

            {/* event locations list */}
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Event Locations</h2>
            <div className="space-y-3">
                {events.map((event) => (
                    <div key={event.id} className="card p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xl">📍</span>
                            <div>
                                <p className="font-medium text-sm text-slate-800">{event.title_en}</p>
                                <p className="text-xs text-slate-500">{event.location_name}</p>
                            </div>
                        </div>
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary text-xs no-underline"
                        >
                            Directions
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
