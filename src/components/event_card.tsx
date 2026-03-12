"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";

// matches the shape returned by GET /api/events and GET /api/events/[id]
export interface EventData {
  id: string;
  title_en: string;
  title_es: string;
  description_en: string;
  description_es: string;
  location_name: string;
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
  provider: { id: string; email: string };
  _count: { rsvps: number };
}

interface EventCardProps {
  event: EventData;
  show_status?: boolean;
}

function format_date(date_string: string, locale: string) {
  return new Date(date_string).toLocaleDateString(
    locale === "es" ? "es-US" : "en-US",
    {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

function format_time(date_string: string, locale: string) {
  return new Date(date_string).toLocaleTimeString(
    locale === "es" ? "es-US" : "en-US",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

export default function EventCard({
  event,
  show_status = false,
}: EventCardProps) {
  const t = useTranslations("Events");
  const locale = useLocale();

  const title = locale === "es" ? event.title_es : event.title_en;
  const description =
    locale === "es" ? event.description_es : event.description_en;
  const category_class = `badge badge-${event.category.toLowerCase().replace(/\s+/g, "")}`;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className={category_class}>
          {t(`cat_${event.category.toLowerCase().replace(/\s+/g, "_")}` as any)}
        </span>
        {show_status && (
          <span className={`badge badge-${event.status.toLowerCase()}`}>
            {t(`status_${event.status.toLowerCase()}` as any)}
          </span>
        )}
      </div>

      <Link href={`/events/${event.id}`} className="no-underline">
        <h3
          className="text-lg font-semibold mb-2 hover:opacity-80 transition-opacity"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </h3>
      </Link>

      <p
        className="text-sm mb-3 line-clamp-2"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {description}
      </p>

      <div
        className="flex flex-col gap-1.5 text-sm mb-4"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <div className="flex items-center gap-2">
          <span>📍</span>
          <span>{event.location_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>📅</span>
          <span>{format_date(event.start_time, locale)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🕐</span>
          <span>
            {format_time(event.start_time, locale)} –{" "}
            {format_time(event.end_time, locale)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary text-sm no-underline"
        >
          🧭 {t("directions")}
        </a>
        {event._count.rsvps > 0 && (
          <span
            className="text-xs ml-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {t("rsvp_count", { count: event._count.rsvps })}
          </span>
        )}
      </div>
    </div>
  );
}
