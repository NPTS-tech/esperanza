"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/routing";
import dynamic from "next/dynamic";
import type { EventData } from "@/components/event_card";

const EventMap = dynamic(() => import("@/components/event_map"), {
  ssr: false,
});

function format_date(date_string: string, locale: string) {
  return new Date(date_string).toLocaleDateString(
    locale === "es" ? "es-US" : "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
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

export default function EventDetailPage() {
  const t = useTranslations("Events");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const params = useParams();
  const event_id = params.id as string;

  const [event, set_event] = useState<EventData | null>(null);
  const [loading, set_loading] = useState(true);
  const [error, set_error] = useState<string | null>(null);
  const [deleting, set_deleting] = useState(false);
  const [rsvped, set_rsvped] = useState(false);
  const [rsvp_loading, set_rsvp_loading] = useState(false);

  const fetch_event = useCallback(async () => {
    set_loading(true);
    set_error(null);
    try {
      const res = await fetch(`/api/events/${event_id}`);
      if (res.status === 404) {
        set_error(t("error_not_found"));
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const data: EventData = await res.json();
      set_event(data);

      if (!session?.user) {
        set_rsvped(false);
      } else {
        const rsvp_res = await fetch(`/api/events/${event_id}/rsvp`);
        if (rsvp_res.ok) {
          const rsvp_data: { hasRsvp: boolean } = await rsvp_res.json();
          set_rsvped(rsvp_data.hasRsvp);
        } else {
          set_rsvped(false);
        }
      }
    } catch {
      set_error(t("error_loading"));
    } finally {
      set_loading(false);
    }
  }, [event_id, session?.user?.id, t]);

  useEffect(() => {
    fetch_event();
  }, [fetch_event]);

  async function handle_delete() {
    if (!window.confirm(t("delete_confirm"))) return;
    set_deleting(true);
    try {
      const res = await fetch(`/api/events/${event_id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        set_error(data.error || t("error_loading"));
        set_deleting(false);
        return;
      }
      router.push("/events");
    } catch {
      set_error(t("error_loading"));
      set_deleting(false);
    }
  }

  async function handle_rsvp() {
    set_rsvp_loading(true);
    try {
      const method = rsvped ? "DELETE" : "POST";
      const res = await fetch(`/api/events/${event_id}/rsvp`, { method });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        set_error(data?.error || t("error_loading"));
        return;
      }

      const data: { hasRsvp: boolean; rsvp_count: number } = await res.json();
      set_rsvped(data.hasRsvp);
      set_event((prev) =>
        prev
          ? {
              ...prev,
              _count: { ...prev._count, rsvps: data.rsvp_count },
            }
          : prev,
      );
    } catch {
      set_error(t("error_loading"));
    } finally {
      set_rsvp_loading(false);
    }
  }

  // Loading
  if (loading) {
    return (
      <div
        className="max-w-3xl mx-auto px-4 py-8 text-center"
        style={{ color: "var(--color-text-secondary)" }}
      >
        <p className="text-lg">{t("loading")}</p>
      </div>
    );
  }

  // Error / not found
  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <h2
          className="text-xl font-bold"
          style={{ color: "var(--color-text)" }}
        >
          {error || t("error_not_found")}
        </h2>
        <Link
          href="/events"
          className="text-sm mt-2 inline-block"
          style={{ color: "var(--color-primary)" }}
        >
          ← {t("back_to_events")}
        </Link>
      </div>
    );
  }

  const title = locale === "es" ? event.title_es : event.title_en;
  const title_alt = locale === "es" ? event.title_en : event.title_es;
  const description =
    locale === "es" ? event.description_es : event.description_en;
  const description_alt =
    locale === "es" ? event.description_en : event.description_es;
  const category_class = `badge badge-${event.category.toLowerCase().replace(/\s+/g, "")}`;

  const is_own = session?.user?.id === event.provider_id;
  const is_admin = session?.user?.role === "ADMIN";
  const can_edit = is_own || is_admin;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/events"
        className="text-sm mb-4 inline-block no-underline"
        style={{ color: "var(--color-primary)" }}
      >
        ← {t("back_to_events")}
      </Link>

      <div className="card p-6 sm:p-8">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className={category_class}>
            {t(
              `cat_${event.category.toLowerCase().replace(/\s+/g, "_")}` as any,
            )}
          </span>
          <span className={`badge badge-${event.status.toLowerCase()}`}>
            {t(`status_${event.status.toLowerCase()}` as any)}
          </span>
          {event._count.rsvps > 0 && (
            <span
              className="badge"
              style={{
                background: "var(--color-surface-hover)",
                color: "var(--color-text-secondary)",
              }}
            >
              {t("rsvp_count", { count: event._count.rsvps })}
            </span>
          )}
        </div>

        {/* Title */}
        <h1
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: "var(--color-text)" }}
        >
          {title}
        </h1>
        <p
          className="text-sm mb-6 italic"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {title_alt}
        </p>

        {/* Info box */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 rounded-xl"
          style={{ background: "var(--color-surface-hover)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📅</span>
            <div>
              <p
                className="text-xs uppercase font-semibold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t("date")}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                {format_date(event.start_time, locale)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl">🕐</span>
            <div>
              <p
                className="text-xs uppercase font-semibold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t("time")}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                {format_time(event.start_time, locale)} –{" "}
                {format_time(event.end_time, locale)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <span className="text-xl">📍</span>
            <div>
              <p
                className="text-xs uppercase font-semibold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {t("location")}
              </p>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text)" }}
              >
                {event.location_name}
                {event.location_address ? (
                  <>
                    <br />
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {event.location_address}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--color-text)" }}
          >
            {t("about_event")}
          </h2>
          <p
            className="leading-relaxed"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {description}
          </p>
          <p
            className="text-sm mt-3 italic"
            style={{ color: "var(--color-text-secondary)", opacity: 0.7 }}
          >
            {description_alt}
          </p>
        </div>

        {/* Map */}
        <div className="mb-6">
          <EventMap
            latitude={event.latitude}
            longitude={event.longitude}
            locationName={event.location_name}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {session?.user && (
            <button
              onClick={handle_rsvp}
              disabled={rsvp_loading}
              className={`btn ${rsvped ? "btn-secondary" : "btn-primary"}`}
            >
              {rsvp_loading
                ? t("rsvp_loading")
                : rsvped
                  ? `✅ ${t("rsvped")}`
                  : `🤝 ${t("rsvp")}`}
            </button>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary no-underline"
          >
            🧭 {t("get_directions")}
          </a>

          {can_edit && (
            <Link
              href={`/events/${event.id}/edit`}
              className="btn btn-accent no-underline"
            >
              ✏️ {t("edit_event")}
            </Link>
          )}

          {can_edit && (
            <button
              onClick={handle_delete}
              disabled={deleting}
              className="btn btn-danger"
            >
              {deleting ? t("deleting") : `🗑️ ${t("delete_event")}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
