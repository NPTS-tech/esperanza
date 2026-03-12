import { auth } from "@/lib/auth";
import { redirect, Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { mock_events } from "@/lib/mock_data";
import { EventDetailClient } from "./event_detail";

export default async function EventDetailPage({
    params,
}: {
    params: Promise<{ locale: string; id: string }>;
}) {
    const session = await auth();
    if (!session) redirect({ href: "/auth/login", locale: (await params).locale });

    const { id, locale: locale_param } = await params;
    const locale = (await getLocale()) as "en" | "es";
    const t = await getTranslations("Events");

    const event = mock_events.find((e) => e.id === id);
    if (!event) notFound();

    return (
        <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <Link
                href="/events"
                className="inline-flex items-center gap-1.5 text-sm mb-4"
                style={{ color: "var(--color-primary)", textDecoration: "none" }}
            >
                ← {t("back_to_events")}
            </Link>

            <EventDetailClient
                event={event}
                locale={locale}
                rsvp_event={t("rsvp_event")}
                cancel_rsvp={t("cancel_rsvp")}
                location_label={t("location")}
                map_coming_soon={t("map_coming_soon")}
                description_label={t("description")}
                provider_label={t("provider_label")}
            />
        </div>
    );
}
