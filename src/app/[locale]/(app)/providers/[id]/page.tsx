"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { Globe, Mail, Phone, ExternalLink } from "lucide-react";
import EventCard, { type EventData } from "@/components/event_card";

type ProgramCategory = {
    id: string;
    slug: string;
    name_en: string;
    name_es: string;
    color: string;
    emoji: string;
};

type ProviderProfile = {
    user_id: string;
    email: string;
    org_name: string | null;
    bio: string | null;
    logo_url: string | null;
    website_url: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    beneficiaries: string | null;
    programs: ProgramCategory[];
};

export default function ProviderProfilePage() {
    const t = useTranslations("ProviderProfile");
    const locale = useLocale();
    const router = useRouter();
    const params = useParams();
    const provider_id = params.id as string;

    const [profile, set_profile] = useState<ProviderProfile | null>(null);
    const [events, set_events] = useState<EventData[]>([]);
    const [loading, set_loading] = useState(true);
    const [error, set_error] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            set_loading(true);
            set_error(null);
            try {
                const [profile_res, events_res] = await Promise.all([
                    fetch(`/api/providers/${provider_id}/profile`),
                    fetch(`/api/events?provider_id=${provider_id}&status=APPROVED&limit=50`),
                ]);

                if (profile_res.status === 404) {
                    set_error(t("not_found"));
                    return;
                }
                if (!profile_res.ok) throw new Error("Failed to fetch profile");

                const profile_data: ProviderProfile = await profile_res.json();
                set_profile(profile_data);

                if (events_res.ok) {
                    const events_data: { events: EventData[] } = await events_res.json();
                    // Only show upcoming events (start_time in the future)
                    const now = new Date();
                    set_events(
                        events_data.events.filter((e) => new Date(e.start_time) >= now),
                    );
                }
            } catch {
                set_error(t("error_loading"));
            } finally {
                set_loading(false);
            }
        }
        load();
    }, [provider_id, t]);

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 text-center" style={{ color: "var(--color-text-secondary)" }}>
                <p>{t("loading")}</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                    {error || t("not_found")}
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

    const display_name = profile.org_name ?? profile.email;
    const initials = display_name.charAt(0).toUpperCase();

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

            {/* Profile header card */}
            <div className="card card-no-hover overflow-hidden mb-6">
                {/* Top color band */}
                <div
                    style={{
                        height: 8,
                        background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                    }}
                />

                <div className="p-6 sm:p-8">
                    <div className="flex items-start gap-5">
                        {/* Avatar */}
                        <div
                            style={{
                                width: 80,
                                height: 80,
                                borderRadius: "50%",
                                flexShrink: 0,
                                overflow: "hidden",
                                background: "var(--color-primary-light)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "3px solid var(--color-border)",
                            }}
                        >
                            {profile.logo_url ? (
                                <img
                                    src={profile.logo_url}
                                    alt={display_name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            ) : (
                                <span style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1 }}>
                                    {initials}
                                </span>
                            )}
                        </div>

                        {/* Name + bio */}
                        <div className="flex-1 min-w-0">
                            <h1
                                className="text-2xl font-bold leading-tight"
                                style={{ color: "var(--color-text)" }}
                            >
                                {display_name}
                            </h1>

                            {profile.bio && (
                                <p
                                    className="text-sm mt-2 leading-relaxed"
                                    style={{ color: "var(--color-text-secondary)" }}
                                >
                                    {profile.bio}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Contact / links row */}
                    {(profile.website_url || profile.contact_email || profile.contact_phone) && (
                        <div
                            className="flex flex-wrap gap-4 mt-5 pt-5"
                            style={{ borderTop: "1px solid var(--color-border)" }}
                        >
                            {profile.website_url && (
                                <a
                                    href={profile.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-sm no-underline"
                                    style={{ color: "var(--color-primary)" }}
                                >
                                    <Globe size={14} />
                                    {t("website")}
                                    <ExternalLink size={11} style={{ opacity: 0.6 }} />
                                </a>
                            )}
                            {profile.contact_email && (
                                <a
                                    href={`mailto:${profile.contact_email}`}
                                    className="flex items-center gap-1.5 text-sm no-underline"
                                    style={{ color: "var(--color-primary)" }}
                                >
                                    <Mail size={14} />
                                    {profile.contact_email}
                                </a>
                            )}
                            {profile.contact_phone && (
                                <a
                                    href={`tel:${profile.contact_phone}`}
                                    className="flex items-center gap-1.5 text-sm no-underline"
                                    style={{ color: "var(--color-primary)" }}
                                >
                                    <Phone size={14} />
                                    {profile.contact_phone}
                                </a>
                            )}
                        </div>
                    )}

                    {/* Programs + intended beneficiaries */}
                    {(profile.programs?.length > 0 || profile.beneficiaries) && (
                        <div
                            className="mt-5 pt-5 space-y-3"
                            style={{ borderTop: "1px solid var(--color-border)" }}
                        >
                            {profile.programs?.length > 0 && (
                                <div>
                                    <h2 className="text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--color-text-secondary)" }}>
                                        {t("programs")}
                                    </h2>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.programs.map((cat) => (
                                            <span
                                                key={cat.id}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                    padding: "5px 11px",
                                                    borderRadius: 999,
                                                    fontSize: 13,
                                                    border: `1.5px solid ${cat.color}`,
                                                    background: `${cat.color}18`,
                                                    color: cat.color,
                                                }}
                                            >
                                                <span aria-hidden="true">{cat.emoji}</span>
                                                {locale === "es" ? cat.name_es : cat.name_en}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {profile.beneficiaries && (
                                <div>
                                    <h2 className="text-xs font-medium uppercase tracking-wide mb-1" style={{ color: "var(--color-text-secondary)" }}>
                                        {t("beneficiaries")}
                                    </h2>
                                    <p className="text-sm leading-relaxed" style={{ color: "var(--color-text)" }}>
                                        {profile.beneficiaries}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Upcoming events */}
            <h2
                className="text-base font-semibold mb-4"
                style={{ color: "var(--color-text)" }}
            >
                {t("upcoming_events")}
            </h2>

            {events.length === 0 ? (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {t("no_events")}
                </p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            )}
        </div>
    );
}
