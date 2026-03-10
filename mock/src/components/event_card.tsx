"use client";

import Link from "next/link";
import { AppEvent, format_date, format_time } from "@/lib/mock_data";

interface EventCardProps {
    event: AppEvent;
    is_rsvped?: boolean;
    on_rsvp?: (event_id: string) => void;
    show_status?: boolean;
}

export default function EventCard({ event, is_rsvped = false, on_rsvp, show_status = false }: EventCardProps) {
    const category_class = `badge badge-${event.category.toLowerCase()}`;

    return (
        <div className="card p-5">
            <div className="flex items-start justify-between mb-3">
                <span className={category_class}>{event.category}</span>
                {show_status && (
                    <span className={`badge badge-${event.status.toLowerCase()}`}>
                        {event.status}
                    </span>
                )}
            </div>

            <Link href={`/events/${event.id}`} className="no-underline">
                <h3 className="text-lg font-semibold text-slate-900 mb-2 hover:text-blue-600 transition-colors">
                    {event.title_en}
                </h3>
            </Link>

            <p className="text-sm text-slate-500 mb-3 line-clamp-2">
                {event.description_en}
            </p>

            <div className="flex flex-col gap-1.5 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                    <span>📍</span>
                    <span>{event.location_name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>📅</span>
                    <span>{format_date(event.start_time)}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span>{format_time(event.start_time)} – {format_time(event.end_time)}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {on_rsvp && event.status === "APPROVED" && (
                    <button
                        onClick={() => on_rsvp(event.id)}
                        className={`btn ${is_rsvped ? "btn-secondary" : "btn-primary"} text-sm`}
                    >
                        {is_rsvped ? "✓ RSVP'd" : "RSVP"}
                    </button>
                )}
                <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary text-sm no-underline"
                >
                    🧭 Directions
                </a>
            </div>
        </div>
    );
}
