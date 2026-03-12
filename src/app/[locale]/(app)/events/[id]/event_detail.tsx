"use client";

import { useState } from "react";
import { CalendarDays, MapPin, User, Clock, Map } from "lucide-react";
import { Badge, get_category_badge_variant } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { format_date } from "@/lib/utils";
import type { MockEvent } from "@/lib/mock_data";

type EventDetailClientProps = {
    event: MockEvent;
    locale: "en" | "es";
    rsvp_event: string;
    cancel_rsvp: string;
    location_label: string;
    map_coming_soon: string;
    description_label: string;
    provider_label: string;
};

export function EventDetailClient({
    event,
    locale,
    rsvp_event,
    cancel_rsvp,
    location_label,
    map_coming_soon,
    description_label,
    provider_label,
}: EventDetailClientProps) {
    const [rsvp_active, set_rsvp_active] = useState(false);
    const [desc_locale, set_desc_locale] = useState<"en" | "es">(locale);

    const title = locale === "es" ? event.title_es : event.title_en;

    const desc_tabs = [
        { key: "en", label: "English" },
        { key: "es", label: "Español" },
    ];

    return (
        <div className="space-y-4">
            {/* Hero */}
            <div
                className="rounded-xl overflow-hidden flex items-center justify-center"
                style={{
                    height: "220px",
                    background: "linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-secondary) 100%)",
                }}
            >
                {event.image_url ? (
                    <img src={event.image_url} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <CalendarDays size={56} color="white" opacity={0.8} />
                )}
            </div>

            {/* Header card */}
            <div className="card p-6">
                <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant={get_category_badge_variant(event.category)}>{event.category}</Badge>
                </div>

                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                    {title}
                </h1>
                {locale === "en" && event.title_es !== event.title_en && (
                    <p className="text-sm mt-1 italic" style={{ color: "var(--color-text-secondary)" }}>
                        {event.title_es}
                    </p>
                )}

                {/* Meta grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
                    <span
                        className="flex items-center gap-2"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        <Clock size={14} style={{ color: "var(--color-primary)" }} />
                        {format_date(event.start_time)}
                    </span>
                    <span
                        className="flex items-center gap-2"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        <MapPin size={14} style={{ color: "var(--color-primary)" }} />
                        {event.location_name}
                    </span>
                    <span
                        className="flex items-center gap-2"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        <User size={14} style={{ color: "var(--color-primary)" }} />
                        {provider_label}: {event.provider_email}
                    </span>
                </div>

                {/* RSVP button */}
                <button
                    onClick={() => set_rsvp_active((v) => !v)}
                    className={`btn mt-5 ${rsvp_active ? "btn-secondary" : "btn-primary"}`}
                >
                    {rsvp_active ? cancel_rsvp : rsvp_event}
                </button>
            </div>

            {/* Description card */}
            <div className="card p-6">
                <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                    {description_label}
                </h2>
                <Tabs
                    tabs={desc_tabs}
                    activeTab={desc_locale}
                    onChange={(k) => set_desc_locale(k as "en" | "es")}
                    variant="underline"
                />
                <p
                    className="mt-4 text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                >
                    {desc_locale === "en"
                        ? event.description_en || "—"
                        : event.description_es || "—"}
                </p>
            </div>

            {/* Map placeholder */}
            <div className="card p-6">
                <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text)" }}>
                    {location_label}
                </h2>
                <div
                    className="rounded-lg flex flex-col items-center justify-center gap-2"
                    style={{
                        height: "180px",
                        background: "var(--color-surface-hover)",
                        border: "1.5px dashed var(--color-border)",
                    }}
                >
                    <Map size={36} style={{ color: "var(--color-primary)" }} opacity={0.5} />
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                        {map_coming_soon}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        {event.location_name} · {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                    </p>
                </div>
            </div>
        </div>
    );
}
