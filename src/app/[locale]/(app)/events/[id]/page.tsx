"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, useRouter } from "@/i18n/routing";
import dynamic from "next/dynamic";
import { CalendarDays, Clock, MapPin, Navigation, Pencil, CheckCircle2, CalendarPlus, Trash2, Check, X, BarChart3, ChevronRight } from "lucide-react";
import type { EventData } from "@/components/event_card";
import { getCategoryPlaceholderStyle } from "@/lib/event_category_assets";

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
  const [rsvped, set_rsvped] = useState(false);
  const [rsvp_loading, set_rsvp_loading] = useState(false);
  const [admin_status_loading, set_admin_status_loading] = useState(false);
  const [admin_delete_loading, set_admin_delete_loading] = useState(false);

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

  async function handle_admin_status_update(status: "APPROVED" | "REJECTED") {
    set_admin_status_loading(true);
    set_error(null);
    try {
      const res = await fetch(`/api/events/${event_id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Status update failed");

      const updated: EventData = await res.json();
      set_event(updated);
    } catch {
      set_error(t("error_loading"));
    } finally {
      set_admin_status_loading(false);
    }
  }

  async function handle_admin_delete() {
    const confirm_text =
      locale === "es"
        ? "¿Seguro que deseas eliminar este evento?"
        : "Are you sure you want to delete this event?";

    if (!window.confirm(confirm_text)) return;

    set_admin_delete_loading(true);
    set_error(null);
    try {
      const res = await fetch(`/api/events/${event_id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/events");
    } catch {
      set_error(t("error_loading"));
      set_admin_delete_loading(false);
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
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm mt-2 inline-block"
          style={{ color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer" }}
        >
          ← {t("back")}
        </button>
      </div>
    );
  }

  const title = locale === "es" ? event.title_es : event.title_en;
  const title_alt = locale === "es" ? event.title_en : event.title_es;
  const description =
    locale === "es" ? event.description_es : event.description_en;
  const description_alt =
    locale === "es" ? event.description_en : event.description_es;
  const category_label = t(`cat_${event.category.toLowerCase().replace(/\s+/g, "_")}` as any);
  const manage_event_label = locale === "es" ? "Gestionar evento" : "Manage event";

  const is_own = session?.user?.id === event.provider_id;
  const is_admin = session?.user?.role === "ADMIN";
  const can_edit = is_own || is_admin;
  const approve_label = locale === "es" ? "Aprobar" : "Approve";
  const reject_label = locale === "es" ? "Rechazar" : "Reject";
  const delete_label = locale === "es" ? "Eliminar" : "Delete";
  const admin_options_label = locale === "es" ? "Opciones de admin" : "Admin options";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm font-medium no-underline mb-5"
        style={{ color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>‹</span>
        {t("back")}
      </button>

      <div className="card card-no-hover overflow-hidden">

        {/* Hero image or category placeholder */}
        {event.image_url ? (
          <div style={{ height: 240, overflow: "hidden" }}>
            <img
              src={event.image_url}
              alt={title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>
        ) : (
          (() => {
            const cfg = getCategoryPlaceholderStyle(event.category);
            return (
              <div
                className="flex items-center justify-center"
                style={{
                  height: 240,
                  background: `linear-gradient(135deg, ${cfg.color} 0%, rgba(0,0,0,0.2) 100%)`,
                }}
              >
                <span aria-hidden="true" style={{ fontSize: "4rem", lineHeight: 1 }}>
                  {cfg.emoji}
                </span>
              </div>
            );
          })()
        )}

        <div className="p-6 sm:p-8">
          {/* Category pill */}
          <div className="mb-4">
            <span
              style={{
                display: "inline-block",
                padding: "3px 10px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                borderRadius: 999,
                background: "var(--color-primary-light)",
                color: "#fff",
              }}
            >
              {category_label}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-2xl sm:text-3xl font-bold leading-tight mb-1"
            style={{ color: "var(--color-text)" }}
          >
            {title}
          </h1>
          {title_alt && title_alt !== title && (
            <p
              className="text-sm italic mb-6"
              style={{ color: "var(--color-text-secondary)", opacity: 0.65 }}
            >
              {title_alt}
            </p>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "var(--color-border)", margin: "20px 0" }} />

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="flex items-start gap-3">
              <div
                style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: "var(--color-surface-hover)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <CalendarDays size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
                  {t("date")}
                </p>
                <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-text)" }}>
                  {format_date(event.start_time, locale)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: "var(--color-surface-hover)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Clock size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
                  {t("time")}
                </p>
                <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-text)" }}>
                  {format_time(event.start_time, locale)} – {format_time(event.end_time, locale)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div
                style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: "var(--color-surface-hover)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <MapPin size={16} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-secondary)" }}>
                  {t("location")}
                </p>
                <p className="text-sm font-medium mt-0.5" style={{ color: "var(--color-text)" }}>
                  {event.location_name}
                </p>
                {event.location_address && (
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                    {event.location_address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--color-border)", margin: "20px 0" }} />

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-base font-semibold mb-3" style={{ color: "var(--color-text)" }}>
              {t("about_event")}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              {description}
            </p>
            {description_alt && description_alt !== description && (
              <p
                className="text-sm mt-3 italic leading-relaxed"
                style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}
              >
                {description_alt}
              </p>
            )}
          </div>

          {/* Hosted by */}
          <Link
            href={`/providers/${event.provider.id}`}
            className="flex items-center gap-3 mb-6 p-3 rounded-xl no-underline group"
            style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)" }}
          >
            <div
              style={{
                width: 44, height: 44, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
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
                <span style={{ fontSize: 18, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                  {(event.provider.provider_profile?.org_name ?? event.provider.email)
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--color-text-secondary)" }}>
                {locale === "es" ? "Organizado por" : "Hosted by"}
              </p>
              <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                {event.provider.provider_profile?.org_name ?? event.provider.email}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
          </Link>

          {/* Map */}
          <div className="mb-6 rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-border)" }}>
            <EventMap
              latitude={event.latitude}
              longitude={event.longitude}
              locationName={event.location_name}
            />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "var(--color-border)", margin: "20px 0" }} />

          {/* Admin moderation */}
          {is_admin && (
            <>
              <div
                className="mb-6 p-4 rounded-xl"
                style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)" }}
              >
                <p className="text-xs uppercase font-semibold tracking-wider mb-3" style={{ color: "var(--color-text-secondary)" }}>
                  {admin_options_label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {event.status !== "APPROVED" && (
                    <button
                      onClick={() => handle_admin_status_update("APPROVED")}
                      disabled={admin_status_loading || admin_delete_loading}
                      className="btn btn-primary"
                    >
                      <Check size={15} />
                      {approve_label}
                    </button>
                  )}
                  {event.status === "PENDING" && (
                    <button
                      onClick={() => handle_admin_status_update("REJECTED")}
                      disabled={admin_status_loading || admin_delete_loading}
                      className="btn btn-secondary"
                    >
                      <X size={15} />
                      {reject_label}
                    </button>
                  )}
                  <Link
                    href={`/events/${event.id}/edit`}
                    className="btn btn-accent no-underline"
                  >
                    <Pencil size={15} />
                    {manage_event_label}
                  </Link>
                  <button
                    onClick={handle_admin_delete}
                    disabled={admin_status_loading || admin_delete_loading}
                    className="btn btn-danger"
                  >
                    <Trash2 size={15} />
                    {admin_delete_loading ? t("loading") : delete_label}
                  </button>
                </div>
              </div>

              <div style={{ height: 1, background: "var(--color-border)", margin: "20px 0" }} />
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left side buttons */}
            <div className="flex flex-wrap gap-2">
              {/* For providers: show Event Analytics */}
              {is_own && !is_admin && (
                <Link
                  href={`/analytics/${event.id}`}
                  className="btn btn-primary no-underline"
                >
                  <BarChart3 size={15} />
                  {locale === "es" ? "Analíticas" : "Event Analytics"}
                </Link>
              )}
              
              {/* For regular users: show RSVP + Get Directions + Add to Calendar */}
              {!is_own && session?.user && (
                <>
                  <button
                    onClick={handle_rsvp}
                    disabled={rsvp_loading}
                    className={`btn ${rsvped ? "btn-secondary" : "btn-primary"}`}
                  >
                    {rsvped ? <CheckCircle2 size={15} /> : <CalendarPlus size={15} />}
                    {rsvp_loading ? t("rsvp_loading") : rsvped ? t("rsvped") : t("rsvp")}
                  </button>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary no-underline"
                  >
                    <Navigation size={15} />
                    {t("get_directions")}
                  </a>
                  <a
                    href={`/api/events/${event.id}/ics?locale=${locale}`}
                    className="btn btn-secondary no-underline"
                    download
                  >
                    <CalendarDays size={15} />
                    {t("add_to_calendar")}
                  </a>
                </>
              )}

              {/* For providers viewing own event: Add to Calendar + Get Directions (no RSVP) */}
              {is_own && (
                <>
                  <a
                    href={`/api/events/${event.id}/ics?locale=${locale}`}
                    className="btn btn-secondary no-underline"
                    download
                  >
                    <CalendarDays size={15} />
                    {t("add_to_calendar")}
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary no-underline"
                  >
                    <Navigation size={15} />
                    {t("get_directions")}
                  </a>
                </>
              )}

              {/* For unauthenticated users: just Get Directions */}
              {!session?.user && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary no-underline"
                >
                  <Navigation size={15} />
                  {t("get_directions")}
                </a>
              )}
            </div>

            {/* Right side: Manage Event button */}
            {can_edit && !is_admin && (
              <Link
                href={`/events/${event.id}/edit`}
                className="btn btn-accent no-underline"
              >
                <Pencil size={15} />
                {manage_event_label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
