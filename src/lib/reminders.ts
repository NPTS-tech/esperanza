import { db } from "@/lib/db";
import { email_enabled, send_email } from "@/lib/email";
import { push_enabled, send_push } from "@/lib/push";
import { REMINDER_LEAD_OPTIONS } from "@/lib/constants";

// Event reminders: RSVP'd users get a push and/or email `reminder_lead_min`
// minutes before an approved event starts. Rsvp.reminder_sent_at dedupes; the
// event PATCH route clears it when start_time changes.

const INTERVAL_MS = 5 * 60 * 1000;
const MAX_LEAD_MS = Math.max(...REMINDER_LEAD_OPTIONS) * 60 * 1000;
const TIME_ZONE = process.env.APP_TIME_ZONE ?? "America/Chicago";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "";

const COPY = {
    en: {
        title: (t: string) => `Reminder: ${t}`,
        body: (time: string, place: string) => `Starts ${time} at ${place}`,
        details: "Event details",
        settings: "Change your reminder settings",
        intl: "en-US",
    },
    es: {
        title: (t: string) => `Recordatorio: ${t}`,
        body: (time: string, place: string) => `Comienza ${time} en ${place}`,
        details: "Detalles del evento",
        settings: "Cambia tu configuración de recordatorios",
        intl: "es-US",
    },
};

export async function send_due_reminders(now = new Date()): Promise<number> {
    const candidates = await db.rsvp.findMany({
        where: {
            reminder_sent_at: null,
            event: {
                status: "APPROVED",
                start_time: { gt: now, lte: new Date(now.getTime() + MAX_LEAD_MS) },
            },
            user: { OR: [{ reminder_push: true }, { reminder_email: true }] },
        },
        select: {
            id: true,
            user: {
                select: {
                    id: true,
                    email: true,
                    language_pref: true,
                    reminder_push: true,
                    reminder_email: true,
                    reminder_lead_min: true,
                },
            },
            event: {
                select: {
                    id: true,
                    title_en: true,
                    title_es: true,
                    start_time: true,
                    location_name: true,
                },
            },
        },
    });

    let sent = 0;
    for (const { id, user, event } of candidates) {
        if (event.start_time.getTime() - now.getTime() > user.reminder_lead_min * 60 * 1000) continue;

        // Claim before sending so an overlapping task (e.g. during a rolling
        // deploy) can't send the same reminder twice.
        const claim = await db.rsvp.updateMany({
            where: { id, reminder_sent_at: null },
            data: { reminder_sent_at: now },
        });
        if (claim.count === 0) continue;

        const lang = user.language_pref === "es" ? "es" : "en";
        const copy = COPY[lang];
        const event_title = lang === "es" ? event.title_es : event.title_en;
        const time = new Intl.DateTimeFormat(copy.intl, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            timeZone: TIME_ZONE,
            timeZoneName: "short",
        }).format(event.start_time);
        const title = copy.title(event_title);
        const body = copy.body(time, event.location_name);
        const path = `/${lang}/events/${event.id}`;

        if (user.reminder_push) {
            await send_push(user.id, { title, body, url: path, tag: `event-${event.id}` });
        }
        if (user.reminder_email) {
            const text = `${body}\n\n${copy.details}: ${APP_URL}${path}\n\n${copy.settings}: ${APP_URL}/${lang}/profile\n`;
            await send_email(user.email, title, text).catch((error) =>
                console.error("reminder email error:", user.id, error),
            );
        }
        sent++;
    }
    return sent;
}

// Called once from src/instrumentation.ts when the Node server boots.
// ponytail: in-process timer assumes one ECS task (SQLite on EFS already does);
// the claim above keeps overlapping tasks safe. Move to EventBridge if we scale out.
export function start_reminder_scheduler() {
    const g = globalThis as unknown as { reminder_timer?: NodeJS.Timeout };
    if (g.reminder_timer) return;

    if (!push_enabled && !email_enabled) {
        console.log("Reminders: no push (VAPID_*) or email (EMAIL_FROM) configured; scheduler off");
        return;
    }

    const tick = () =>
        send_due_reminders()
            .then((n) => n > 0 && console.log(`Reminders: sent ${n}`))
            .catch((error) => console.error("Reminders tick failed:", error));

    g.reminder_timer = setInterval(tick, INTERVAL_MS);
    setTimeout(tick, 10_000);
    console.log(`Reminders: scheduler on (push=${push_enabled}, email=${email_enabled})`);
}
