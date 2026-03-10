"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
    get_event_by_id,
    format_date,
    format_time,
    mock_current_user,
    is_user_rsvped,
} from "@/lib/mock_data";

export default function EventDetailPage() {
    const params = useParams();
    const event = get_event_by_id(params.id as string);

    if (!event) {
        return (
            <div className="text-center py-20">
                <p className="text-4xl mb-3">🔍</p>
                <h2 className="text-xl font-bold text-slate-700">Event not found</h2>
                <Link href="/events" className="text-blue-600 hover:underline mt-2 inline-block">
                    ← Back to events
                </Link>
            </div>
        );
    }

    const rsvped = is_user_rsvped(mock_current_user.id, event.id);

    return (
        <div className="max-w-3xl mx-auto">
            <Link href="/events" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
                ← Back to events
            </Link>

            <div className="card p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`badge badge-${event.category.toLowerCase()}`}>
                        {event.category}
                    </span>
                    <span className={`badge badge-${event.status.toLowerCase()}`}>
                        {event.status}
                    </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    {event.title_en}
                </h1>
                <p className="text-slate-400 text-sm mb-6 italic">
                    {event.title_es}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">📅</span>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold">Date</p>
                            <p className="text-sm font-medium">{format_date(event.start_time)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🕐</span>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold">Time</p>
                            <p className="text-sm font-medium">
                                {format_time(event.start_time)} – {format_time(event.end_time)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:col-span-2">
                        <span className="text-xl">📍</span>
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-semibold">Location</p>
                            <p className="text-sm font-medium">{event.location_name}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">About This Event</h2>
                    <p className="text-slate-600 leading-relaxed">{event.description_en}</p>
                    <p className="text-slate-400 text-sm mt-3 italic">{event.description_es}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => alert("Mock RSVP toggled")}
                        className={`btn ${rsvped ? "btn-secondary" : "btn-primary"}`}
                    >
                        {rsvped ? "✓ RSVP'd" : "RSVP to This Event"}
                    </button>
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary no-underline"
                    >
                        🧭 Get Directions
                    </a>
                </div>
            </div>
        </div>
    );
}
