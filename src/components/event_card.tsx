"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { MapPin, Clock, CalendarDays, Building2 } from "lucide-react";

export interface EventData {
  id: string;
  title_en: string;
  title_es: string;
  description_en: string;
  description_es: string;
  location_name: string;
  location_address?: string | null;
  latitude: number;
  longitude: number;
  start_time: string;
  end_time: string;
  provider_id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  category: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
  provider: {
    id: string;
    email: string;
    provider_profile: { org_name: string | null; logo_url: string | null } | null;
  };
  _count: { rsvps: number };
}

interface EventCardProps {
  event: EventData;
}

function format_date(date_string: string, locale: string) {
  return new Date(date_string).toLocaleDateString(
    locale === "es" ? "es-US" : "en-US",
    { weekday: "short", month: "short", day: "numeric", year: "numeric" },
  );
}

function format_time(date_string: string, locale: string) {
  return new Date(date_string).toLocaleTimeString(
    locale === "es" ? "es-US" : "en-US",
    { hour: "numeric", minute: "2-digit" },
  );
}

export default function EventCard({ event }: EventCardProps) {
  const t = useTranslations("Events");
  const locale = useLocale();

  const title = locale === "es" ? event.title_es : event.title_en;
  const description = locale === "es" ? event.description_es : event.description_en;

  return (
    <Link href={`/events/${event.id}`} className="block no-underline group">
      <div
        className="card p-4 h-full flex flex-col"
        style={{
          cursor: "pointer",
          border: "1px solid var(--color-border)",
          transition: "border-color .15s, box-shadow .15s",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "var(--color-primary)";
          el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.borderColor = "var(--color-border)";
          el.style.boxShadow = "";
        }}
      >
        {/* Image */}
        <div
          className="mb-3 rounded-lg overflow-hidden"
          style={{
            aspectRatio: "16 / 9",
            background: "var(--color-surface-hover)",
            border: "1px solid var(--color-border)",
          }}
        >
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={title}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, var(--color-surface-hover), var(--color-border))",
              }}
            />
          )}
        </div>

        {/* Title */}
        <h3
          className="text-sm font-semibold mb-1 leading-snug"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </h3>

        {/* Category */}
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}
        >
          {t(`cat_${event.category.toLowerCase().replace(/\s+/g, "_")}` as any)}
        </p>

        {/* Description */}
        <p
          className="text-xs mb-4 line-clamp-2 flex-1 leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {description}
        </p>

        {/* Meta */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <MapPin size={11} strokeWidth={2} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
            <span className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
              {event.location_name}
              {event.location_address ? ` · ${event.location_address}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={11} strokeWidth={2} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {format_date(event.start_time, locale)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={11} strokeWidth={2} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              {format_time(event.start_time, locale)} – {format_time(event.end_time, locale)}
            </span>
          </div>
          <div
            className="flex items-center gap-2 pt-1.5 mt-0.5"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <Building2 size={11} strokeWidth={2} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
            <span className="text-xs font-medium truncate" style={{ color: "var(--color-primary)" }}>
              {event.provider.provider_profile?.org_name ?? event.provider.email}
            </span>
          </div>
        </div>

      </div>
    </Link>
  );
}