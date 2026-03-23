import { CalendarDays, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Badge, get_category_badge_variant } from "@/components/ui/badge";
import { format_date } from "@/lib/utils";
import { getCategoryPlaceholderStyle } from "@/lib/event_category_assets";
import type { EventData } from "@/components/event_card";

type EventCardProps = {
    event: EventData;
    locale: "en" | "es";
    view_details_label: string;
    rsvp_label?: string;
    show_status?: boolean;
    compact?: boolean;
    onClick?: () => void;
};

export function EventCard({
    event,
    locale,
    view_details_label,
    show_status = false,
    compact = false,
    onClick,
}: EventCardProps) {
    const title = locale === "es" ? event.title_es : event.title_en;

    return (
        <div
            className="card flex flex-col h-full"
            onClick={onClick}
            style={{ cursor: onClick ? "pointer" : undefined }}
        >
            {/* Hero image / category placeholder */}
            <div
                className="rounded-t-[var(--radius)] flex items-center justify-center overflow-hidden"
                style={{
                    height: compact ? "80px" : "140px",
                    background: event.image_url
                        ? undefined
                        : (() => {
                            const cfg = getCategoryPlaceholderStyle(event.category);
                            return `linear-gradient(135deg, ${cfg.color} 0%, rgba(0,0,0,0.2) 100%)`;
                          })(),
                }}
            >
                {event.image_url ? (
                    <img
                        src={event.image_url}
                        alt={title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <span aria-hidden="true" style={{ fontSize: compact ? "1.5rem" : "2.25rem", lineHeight: 1 }}>
                        {getCategoryPlaceholderStyle(event.category).emoji}
                    </span>
                )}
            </div>

            <div className="p-4 flex flex-col gap-2 flex-1">
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant={get_category_badge_variant(event.category)}>
                        {event.category}
                    </Badge>
                </div>

                {/* Title */}
                <h3
                    className={`font-semibold leading-snug line-clamp-2 ${compact ? "text-xs" : "text-sm"}`}
                    style={{ color: "var(--color-text)" }}
                >
                    {title}
                </h3>

                {!compact && (
                    <div className="flex flex-col gap-1">
                        <span
                            className="flex items-center gap-1.5 text-xs"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            <CalendarDays size={12} />
                            {format_date(event.start_time)}
                        </span>
                        <span
                            className="flex items-center gap-1.5 text-xs"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            <MapPin size={12} />
                            {event.location_name}
                            {event.location_address ? ` · ${event.location_address}` : ""}
                        </span>
                    </div>
                )}

                {/* Provider */}
                <div className="flex items-center gap-1.5 mt-auto">
                    <div
                        style={{
                            width: 20, height: 20, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                            background: "var(--color-primary-light)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                    >
                        {event.provider.provider_profile?.logo_url ? (
                            <img
                                src={event.provider.provider_profile.logo_url}
                                alt=""
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                                {(event.provider.provider_profile?.org_name ?? event.provider.email)
                                    .charAt(0)
                                    .toUpperCase()}
                            </span>
                        )}
                    </div>
                    <span
                        className="text-xs font-medium truncate"
                        style={{ color: "var(--color-primary)" }}
                    >
                        {event.provider.provider_profile?.org_name ?? event.provider.email}
                    </span>
                </div>

                {/* Footer */}
                {!onClick && (
                    <div
                        className="mt-auto pt-2 border-t"
                        style={{ borderColor: "var(--color-border)" }}
                    >
                        <Link
                            href={`/events/${event.id}`}
                            className="btn btn-primary text-xs px-3 py-1.5 w-full justify-center"
                        >
                            {view_details_label}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
