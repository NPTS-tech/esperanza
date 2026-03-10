"use client";

import { get_approved_events } from "@/lib/mock_data";

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

            {/* map placeholder — will be replaced with Leaflet */}
            <div className="card overflow-hidden mb-6">
                <div className="bg-gradient-to-br from-green-100 via-blue-50 to-green-50 h-96 flex flex-col items-center justify-center relative">
                    <div className="text-6xl mb-4">🗺️</div>
                    <p className="text-slate-600 font-medium text-lg">Interactive Map</p>
                    <p className="text-slate-400 text-sm mt-1">
                        Leaflet + OpenStreetMap will be embedded here
                    </p>

                    {/* mock pins */}
                    <div className="absolute top-8 left-[30%] text-2xl animate-bounce">📍</div>
                    <div className="absolute top-20 right-[25%] text-2xl animate-bounce" style={{ animationDelay: "0.2s" }}>📍</div>
                    <div className="absolute bottom-16 left-[45%] text-2xl animate-bounce" style={{ animationDelay: "0.4s" }}>📍</div>
                </div>
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
