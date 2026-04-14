"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ChevronRight } from "lucide-react";
import { getCategoryPlaceholderStyle } from "@/lib/event_category_assets";
import { format_date } from "@/lib/utils";

type RsvpItem = {
    id: string;
    created_at: string;
    event: {
        id: string;
        title_en: string;
        title_es: string;
        start_time: string;
        category: string;
        image_url: string | null;
        location_name: string;
        location_address: string | null;
    };
};

type MeResponse = {
    rsvps: RsvpItem[];
};

export function ReservationsClient() {
    const t = useTranslations("Profile");
    const locale = useLocale();

    const [rsvps, set_rsvps] = useState<RsvpItem[]>([]);
    const [loading, set_loading] = useState(true);
    const [error, set_error] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetch_rsvps() {
            set_loading(true);
            set_error(null);
            try {
                const res = await fetch("/api/users/me", { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to load reservations");
                const data: MeResponse = await res.json();
                if (!cancelled) {
                    set_rsvps(Array.isArray(data.rsvps) ? data.rsvps : []);
                }
            } catch {
                if (!cancelled) {
                    set_error(t("profile_load_error"));
                }
            } finally {
                if (!cancelled) {
                    set_loading(false);
                }
            }
        }

        fetch_rsvps();
        return () => {
            cancelled = true;
        };
    }, [t]);

    if (loading) {
        return (
            <div className="card p-6">
                <p style={{ color: "var(--color-text-secondary)" }}>{t("loading_profile")}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card p-6">
                <p style={{ color: "#991b1b" }}>{error}</p>
            </div>
        );
    }

    return (
        <div className="card p-6">
            {rsvps.length === 0 ? (
                <p style={{ color: "var(--color-text-secondary)" }}>{t("no_rsvps")}</p>
            ) : (
                <div className="space-y-3">
                    {rsvps.map((rsvp) => (
                        <Link
                            key={rsvp.id}
                            href={`/events/${rsvp.event.id}` as any}
                            className="block rounded-xl p-4 transition-colors hover:bg-(--color-surface-hover)"
                            style={{
                                background: "var(--color-surface-hover)",
                                color: "inherit",
                                textDecoration: "none",
                            }}
                            aria-label={locale === "es" ? rsvp.event.title_es : rsvp.event.title_en}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div
                                        className="shrink-0 rounded-lg overflow-hidden"
                                        style={{
                                            width: 88,
                                            height: 60,
                                            border: "1px solid var(--color-border)",
                                            background: "var(--color-surface)",
                                        }}
                                    >
                                        {rsvp.event.image_url ? (
                                            <img
                                                src={rsvp.event.image_url}
                                                alt={locale === "es" ? rsvp.event.title_es : rsvp.event.title_en}
                                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                            />
                                        ) : (
                                            (() => {
                                                const cfg = getCategoryPlaceholderStyle(rsvp.event.category);
                                                return (
                                                    <div
                                                        className="w-full h-full flex items-center justify-center"
                                                        style={{
                                                            background: `linear-gradient(135deg, ${cfg.color} 0%, rgba(0,0,0,0.2) 100%)`,
                                                        }}
                                                        aria-hidden="true"
                                                    >
                                                        <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>
                                                            {cfg.emoji}
                                                        </span>
                                                    </div>
                                                );
                                            })()
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <p className="font-medium truncate" style={{ color: "var(--color-text)" }}>
                                            {locale === "es" ? rsvp.event.title_es : rsvp.event.title_en}
                                        </p>
                                        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                                            {format_date(rsvp.event.start_time)}
                                        </p>
                                        <p className="text-sm truncate" style={{ color: "var(--color-text-secondary)" }}>
                                            {rsvp.event.location_name}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={18} style={{ color: "var(--color-text-secondary)" }} />
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
