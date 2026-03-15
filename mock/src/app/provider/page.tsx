"use client";

import { useState } from "react";
import {
    mock_events,
    mock_rsvps,
    format_date,
    EVENT_CATEGORIES,
} from "@/lib/mock_data";

export default function ProviderDashboard() {
    const [tab, set_tab] = useState<"my_events" | "submit" | "analytics">("my_events");

    // mock: provider sees their own events
    const provider_events = mock_events.filter((e) => e.provider_id === "user-010");

    const [new_event, set_new_event] = useState({
        title_en: "",
        title_es: "",
        description_en: "",
        description_es: "",
        location_name: "",
        latitude: null as number | null,
        longitude: null as number | null,
        category: "",
        date: "",
        start_time: "",
        end_time: "",
    });

    function handle_submit(e: React.FormEvent) {
        e.preventDefault();
        alert("Mock: Event submitted for admin review!");
        set_new_event({
            title_en: "", title_es: "", description_en: "", description_es: "",
            location_name: "", latitude: null, longitude: null,
            category: "", date: "", start_time: "", end_time: "",
        });
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Provider Dashboard</h1>
                <p className="text-slate-500 text-sm mt-1">
                    Submit events, view RSVPs, and check analytics
                </p>
            </div>

            {/* tabs */}
            <div className="flex gap-1 mb-6 border-b border-slate-200">
                {([
                    { key: "my_events", label: "My Events" },
                    { key: "submit", label: "Submit Event" },
                    { key: "analytics", label: "RSVP Analytics" },
                ] as const).map((t) => (
                    <button
                        key={t.key}
                        onClick={() => set_tab(t.key as typeof tab)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${tab === t.key
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "my_events" && (
                <div className="space-y-3">
                    {provider_events.length === 0 ? (
                        <p className="text-sm text-slate-400 py-8 text-center">No events submitted yet.</p>
                    ) : (
                        provider_events.map((event) => {
                            const rsvp_count = mock_rsvps.filter((r) => r.event_id === event.id).length;
                            return (
                                <div key={event.id} className="card p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-semibold text-slate-800">{event.title_en}</p>
                                                <span className={`badge badge-${event.status.toLowerCase()}`}>
                                                    {event.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-500">
                                                {format_date(event.start_time)} · {event.location_name}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-2xl font-bold text-blue-600">{rsvp_count}</p>
                                            <p className="text-xs text-slate-400">RSVPs</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {tab === "submit" && (
                <div className="max-w-2xl">
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4">Submit New Event</h2>
                        <p className="text-sm text-slate-500 mb-4">
                            Events will be reviewed by an admin before being published.
                        </p>

                        <form onSubmit={handle_submit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Title (English)</label>
                                    <input className="input" required value={new_event.title_en}
                                        onChange={(e) => set_new_event({ ...new_event, title_en: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Title (Spanish)</label>
                                    <input className="input" value={new_event.title_es}
                                        onChange={(e) => set_new_event({ ...new_event, title_es: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Description (English)</label>
                                <textarea className="input" rows={3} required value={new_event.description_en}
                                    onChange={(e) => set_new_event({ ...new_event, description_en: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">Description (Spanish)</label>
                                <textarea className="input" rows={3} value={new_event.description_es}
                                    onChange={(e) => set_new_event({ ...new_event, description_es: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Location (address)</label>
                                    <input className="input" required value={new_event.location_name}
                                        onChange={(e) => set_new_event({ ...new_event, location_name: e.target.value })} />
                                    <p className="text-xs text-slate-400 mt-1">
                                        In production, this uses Mapbox address autocomplete + a draggable pin map.
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Category</label>
                                    <select className="select" required value={new_event.category}
                                        onChange={(e) => set_new_event({ ...new_event, category: e.target.value })}>
                                        <option value="">Select...</option>
                                        {EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Date</label>
                                    <input type="date" className="input" required value={new_event.date}
                                        onChange={(e) => set_new_event({ ...new_event, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">Start Time</label>
                                    <input type="time" className="input" required value={new_event.start_time}
                                        onChange={(e) => set_new_event({ ...new_event, start_time: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1">End Time</label>
                                    <input type="time" className="input" required value={new_event.end_time}
                                        onChange={(e) => set_new_event({ ...new_event, end_time: e.target.value })} />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary w-full mt-2">
                                Submit for Review
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {tab === "analytics" && (
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">RSVP Demographics</h2>
                    <p className="text-sm text-slate-500 mb-6">
                        Demographic breakdown of users who RSVPed to your events. (Mock data)
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* age distribution */}
                        <div className="card p-6">
                            <h3 className="font-semibold text-slate-700 mb-3">Age Distribution</h3>
                            <div className="space-y-2">
                                {[
                                    { range: "18 – 24", pct: 15 },
                                    { range: "25 – 34", pct: 28 },
                                    { range: "35 – 44", pct: 22 },
                                    { range: "45 – 54", pct: 18 },
                                    { range: "55 – 64", pct: 10 },
                                    { range: "65+", pct: 7 },
                                ].map((d) => (
                                    <div key={d.range}>
                                        <div className="flex items-center justify-between text-sm mb-1">
                                            <span className="text-slate-600">{d.range}</span>
                                            <span className="text-slate-400">{d.pct}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${d.pct}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* transportation */}
                        <div className="card p-6">
                            <h3 className="font-semibold text-slate-700 mb-3">Transportation</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm text-slate-600">🚗 Has personal vehicle</span>
                                    <span className="font-bold text-slate-800">62%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm text-slate-600">🚌 Uses public transit</span>
                                    <span className="font-bold text-slate-800">38%</span>
                                </div>
                            </div>
                        </div>

                        {/* employment */}
                        <div className="card p-6">
                            <h3 className="font-semibold text-slate-700 mb-3">Employment Status</h3>
                            <div className="flex items-center gap-4 justify-center py-4">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-green-600">71%</p>
                                    <p className="text-xs text-slate-500">Employed</p>
                                </div>
                                <div className="w-px h-12 bg-slate-200" />
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-amber-600">29%</p>
                                    <p className="text-xs text-slate-500">Not Employed</p>
                                </div>
                            </div>
                        </div>

                        {/* families */}
                        <div className="card p-6">
                            <h3 className="font-semibold text-slate-700 mb-3">Family Status</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm text-slate-600">👶 Children under 5</span>
                                    <span className="font-bold text-slate-800">18%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm text-slate-600">🧒 Children under 18</span>
                                    <span className="font-bold text-slate-800">45%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
