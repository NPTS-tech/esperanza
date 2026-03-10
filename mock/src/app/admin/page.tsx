"use client";

import { useState } from "react";
import {
    mock_events,
    mock_announcements,
    format_date,
    EVENT_CATEGORIES,
} from "@/lib/mock_data";

export default function AdminDashboard() {
    const [tab, set_tab] = useState<"events" | "announcements" | "analytics">("events");
    const pending_events = mock_events.filter((e) => e.status === "PENDING");
    const approved_events = mock_events.filter((e) => e.status === "APPROVED");

    function handle_approve(event_id: string) {
        alert(`Mock: Approved event ${event_id}`);
    }

    function handle_reject(event_id: string) {
        alert(`Mock: Rejected event ${event_id}`);
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage events, announcements, and view analytics</p>
                </div>
            </div>

            {/* stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total Events", value: mock_events.length, icon: "📅", color: "bg-blue-50 text-blue-700" },
                    { label: "Pending Review", value: pending_events.length, icon: "⏳", color: "bg-amber-50 text-amber-700" },
                    { label: "Approved", value: approved_events.length, icon: "✅", color: "bg-green-50 text-green-700" },
                    { label: "Announcements", value: mock_announcements.length, icon: "📢", color: "bg-purple-50 text-purple-700" },
                ].map((stat) => (
                    <div key={stat.label} className={`card p-4 ${stat.color}`}>
                        <div className="text-2xl mb-1">{stat.icon}</div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs font-medium opacity-75">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* tabs */}
            <div className="flex gap-1 mb-6 border-b border-slate-200">
                {(["events", "announcements", "analytics"] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => set_tab(t)}
                        className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors cursor-pointer ${tab === t
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === "events" && (
                <div>
                    {/* pending events */}
                    {pending_events.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-lg font-semibold text-amber-800 mb-3">⏳ Pending Review</h2>
                            <div className="space-y-3">
                                {pending_events.map((event) => (
                                    <div key={event.id} className="card p-4 border-amber-200 bg-amber-50/50">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-slate-800">{event.title_en}</p>
                                                <p className="text-sm text-slate-500">
                                                    {format_date(event.start_time)} · {event.location_name}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">{event.description_en}</p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handle_approve(event.id)}
                                                    className="btn bg-green-500 text-white text-sm hover:bg-green-600"
                                                >
                                                    ✓ Approve
                                                </button>
                                                <button
                                                    onClick={() => handle_reject(event.id)}
                                                    className="btn btn-danger text-sm"
                                                >
                                                    ✕ Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* all events */}
                    <h2 className="text-lg font-semibold text-slate-800 mb-3">All Events</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-xs text-slate-400 uppercase">
                                    <th className="pb-3 pr-4">Event</th>
                                    <th className="pb-3 pr-4">Category</th>
                                    <th className="pb-3 pr-4">Date</th>
                                    <th className="pb-3 pr-4">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mock_events.map((event) => (
                                    <tr key={event.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-3 pr-4 font-medium text-slate-800">{event.title_en}</td>
                                        <td className="py-3 pr-4">
                                            <span className={`badge badge-${event.category.toLowerCase()}`}>{event.category}</span>
                                        </td>
                                        <td className="py-3 pr-4 text-slate-500">{format_date(event.start_time)}</td>
                                        <td className="py-3 pr-4">
                                            <span className={`badge badge-${event.status.toLowerCase()}`}>{event.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === "announcements" && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">Announcements</h2>
                        <button
                            onClick={() => alert("Mock: Create announcement form")}
                            className="btn btn-primary text-sm"
                        >
                            + New Announcement
                        </button>
                    </div>
                    <div className="space-y-3">
                        {mock_announcements.map((ann) => (
                            <div key={ann.id} className="card p-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800">{ann.title_en}</p>
                                        <p className="text-sm text-slate-500 mt-1">{ann.body_en}</p>
                                        <p className="text-xs text-slate-400 mt-2">
                                            {format_date(ann.created_at)} · Target: {ann.target_role}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {tab === "analytics" && (
                <div>
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Analytics Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card p-6">
                            <h3 className="font-semibold text-slate-700 mb-3">📅 Events by Category</h3>
                            <div className="space-y-2">
                                {EVENT_CATEGORIES.filter((cat) =>
                                    mock_events.some((e) => e.category === cat)
                                ).map((cat) => {
                                    const count = mock_events.filter((e) => e.category === cat).length;
                                    const pct = Math.round((count / mock_events.length) * 100);
                                    return (
                                        <div key={cat}>
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-slate-600">{cat}</span>
                                                <span className="text-slate-400">{count}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2">
                                                <div
                                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="card p-6">
                            <h3 className="font-semibold text-slate-700 mb-3">📊 Mock Metrics</h3>
                            <div className="space-y-4">
                                {[
                                    { label: "Total Registered Users", value: "142" },
                                    { label: "RSVPs This Month", value: "38" },
                                    { label: "Page Views (7 days)", value: "1,240" },
                                    { label: "Direction Requests", value: "67" },
                                    { label: "Search Queries", value: "203" },
                                ].map((m) => (
                                    <div key={m.label} className="flex items-center justify-between">
                                        <span className="text-sm text-slate-600">{m.label}</span>
                                        <span className="text-lg font-bold text-slate-800">{m.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
