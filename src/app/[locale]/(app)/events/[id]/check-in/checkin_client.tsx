"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, CheckCircle2, Clock, Link2, LogIn, MapPin, QrCode } from "lucide-react";
import { Link } from "@/i18n/routing";

type WindowState = "open" | "ended";

type CheckInClientProps = {
    event_id: string;
    token: string;
    title: string;
    title_alt: string;
    location_name: string;
    start_time: string;
    end_time: string;
    category_name_en: string;
    category_name_es: string;
    category_color: string;
    category_emoji: string;
    window_state: WindowState;
    checked_in_at: string | null;
    logged_in: boolean;
};

type Result = {
    already: boolean;
    rsvp_created: boolean;
    checked_in_at: string;
};

function format_date(date_string: string, locale: string) {
    return new Date(date_string).toLocaleDateString(locale === "es" ? "es-US" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function format_time(date_string: string, locale: string) {
    return new Date(date_string).toLocaleTimeString(locale === "es" ? "es-US" : "en-US", {
        hour: "numeric",
        minute: "2-digit",
    });
}

export function CheckInClient(props: CheckInClientProps) {
    const t = useTranslations("CheckIn");
    const locale = useLocale();

    const [result, set_result] = useState<Result | null>(
        props.checked_in_at ? { already: true, rsvp_created: false, checked_in_at: props.checked_in_at } : null,
    );
    const [submitting, set_submitting] = useState(false);
    const [error_code, set_error_code] = useState<string | null>(null);

    const title = locale === "es" ? props.title_alt : props.title;
    const title_alt = locale === "es" ? props.title : props.title_alt;
    const category_name = locale === "es" ? props.category_name_es : props.category_name_en;

    async function handle_check_in() {
        set_submitting(true);
        set_error_code(null);
        try {
            const res = await fetch(`/api/events/${props.event_id}/check-in`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: props.token }),
            });

            if (res.ok) {
                const data: { already_checked_in: boolean; rsvp_created: boolean } = await res.json();
                set_result({
                    already: data.already_checked_in,
                    rsvp_created: data.rsvp_created,
                    checked_in_at: new Date().toISOString(),
                });
                return;
            }

            const data = await res.json().catch(() => null);
            set_error_code(typeof data?.error === "string" ? data.error : "unknown");
        } catch {
            set_error_code("network");
        } finally {
            set_submitting(false);
        }
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-8">
            <div className="card card-no-hover overflow-hidden">
                {/* Category banner */}
                <div
                    className="flex items-center justify-center"
                    style={{
                        height: 96,
                        background: `linear-gradient(135deg, ${props.category_color} 0%, rgba(0,0,0,0.25) 100%)`,
                    }}
                >
                    <span aria-hidden="true" style={{ fontSize: "2.5rem", lineHeight: 1 }}>
                        {props.category_emoji}
                    </span>
                </div>

                <div className="p-6">
                    <p
                        className="text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-1.5"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        <QrCode size={13} />
                        {t("title")}
                    </p>

                    <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--color-text)" }}>
                        {title}
                    </h1>
                    {title_alt && title_alt !== title && (
                        <p className="text-sm italic mt-1" style={{ color: "var(--color-text-secondary)", opacity: 0.65 }}>
                            {title_alt}
                        </p>
                    )}

                    <span
                        className="inline-block mt-3"
                        style={{
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
                        {category_name}
                    </span>

                    <div className="mt-5 space-y-2.5 text-sm" style={{ color: "var(--color-text)" }}>
                        <p className="flex items-center gap-2.5">
                            <CalendarDays size={15} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                            {format_date(props.start_time, locale)}
                        </p>
                        <p className="flex items-center gap-2.5">
                            <Clock size={15} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                            {format_time(props.start_time, locale)} – {format_time(props.end_time, locale)}
                        </p>
                        <p className="flex items-center gap-2.5">
                            <MapPin size={15} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                            {props.location_name}
                        </p>
                    </div>

                    <div style={{ height: 1, background: "var(--color-border)", margin: "20px 0" }} />

                    {!props.logged_in ? (
                        <div className="text-center space-y-3">
                            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                {t("login_required")}
                            </p>
                            <Link
                                href={`/auth/login?next=${encodeURIComponent(`/events/${props.event_id}/check-in?token=${props.token}`)}`}
                                className="btn btn-primary no-underline inline-flex items-center gap-2"
                            >
                                <LogIn size={15} />
                                {t("log_in")}
                            </Link>
                        </div>
                    ) : result ? (
                        <div className="text-center space-y-3">
                            <CheckCircle2 size={44} style={{ color: "var(--color-success)", margin: "0 auto" }} />
                            <p className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
                                {result.already ? t("already") : t("success")}
                            </p>
                            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                                {t("checked_in_at", { time: format_time(result.checked_in_at, locale) })}
                            </p>
                            {result.rsvp_created && (
                                <p className="text-sm" style={{ color: "var(--color-primary)" }}>
                                    {t("rsvp_created_note")}
                                </p>
                            )}
                            <Link
                                href={`/events/${props.event_id}`}
                                className="btn btn-secondary no-underline inline-flex items-center gap-2 mt-2"
                            >
                                <Link2 size={15} />
                                {t("view_event")}
                            </Link>
                        </div>
                    ) : error_code ? (
                        <div className="text-center space-y-3">
                            <p className="text-sm p-3 rounded-lg" style={{ background: "#fef2f2", color: "var(--color-danger)" }}>
                                {error_code === "ended"
                                    ? t("ended")
                                    : error_code === "invalid_token"
                                      ? t("invalid_qr")
                                      : t("error")}
                            </p>
                            {error_code !== "invalid_token" && (
                                <button
                                    type="button"
                                    onClick={handle_check_in}
                                    disabled={submitting}
                                    className="btn btn-primary"
                                >
                                    {submitting ? t("checking_in") : t("check_in")}
                                </button>
                            )}
                        </div>
                    ) : props.window_state === "open" ? (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handle_check_in}
                                disabled={submitting}
                                className="btn btn-primary w-full text-base"
                            >
                                {submitting ? t("checking_in") : t("check_in")}
                            </button>
                            <p className="text-xs mt-3" style={{ color: "var(--color-text-secondary)" }}>
                                {t("checkin_until", { end: format_time(props.end_time, locale) })}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                                {t("ended")}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
