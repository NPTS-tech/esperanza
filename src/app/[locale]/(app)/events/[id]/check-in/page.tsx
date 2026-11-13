import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { verify_checkin_token } from "@/lib/checkin";
import { CheckInClient } from "./checkin_client";

type PageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string | string[] }>;
};

// Landing page encoded in the event's QR code. The GET is side-effect free —
// camera apps and link unfurlers prefetch URLs, so the actual check-in is a
// POST the attendee confirms from here. The token proves the link is genuine;
// the session (enforced by middleware + layout) proves who is checking in.
export default async function CheckInPage({ params, searchParams }: PageProps) {
    const t = await getTranslations("CheckIn");
    const { id } = await params;
    const token_param = await searchParams;
    const token = typeof token_param.token === "string" ? token_param.token : "";

    if (!token || !verify_checkin_token(id, token)) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 text-center">
                <p className="text-4xl mb-3">⚠️</p>
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("invalid_qr")}
                </h2>
            </div>
        );
    }

    const event = await db.event.findUnique({
        where: { id },
        select: {
            id: true,
            title_en: true,
            title_es: true,
            location_name: true,
            start_time: true,
            end_time: true,
            status: true,
            category: { select: { name_en: true, name_es: true, color: true, emoji: true } },
        },
    });

    if (!event || event.status !== "APPROVED") {
        return (
            <div className="max-w-3xl mx-auto px-4 py-8 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("not_found")}
                </h2>
            </div>
        );
    }

    const now = new Date();
    const window_state = now > event.end_time ? "ended" : "open";

    const session = await getSession();
    const rsvp = session
        ? await db.rsvp.findUnique({
              where: { user_id_event_id: { user_id: session.user.id, event_id: id } },
              select: { checked_in_at: true },
          })
        : null;

    return (
        <CheckInClient
            event_id={event.id}
            token={token}
            title={event.title_en}
            title_alt={event.title_es}
            location_name={event.location_name}
            start_time={event.start_time.toISOString()}
            end_time={event.end_time.toISOString()}
            category_name_en={event.category.name_en}
            category_name_es={event.category.name_es}
            category_color={event.category.color}
            category_emoji={event.category.emoji}
            window_state={window_state}
            checked_in_at={rsvp?.checked_in_at?.toISOString() ?? null}
            logged_in={Boolean(session)}
        />
    );
}
