import webpush from "web-push";
import { db } from "@/lib/db";

// Web Push sender (VAPID). Payload shape matches what public/sw.js displays.
// Disabled (returns 0) when the VAPID env vars are unset, e.g. local dev.
export type PushPayload = {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    icon?: string;
};

const public_key = process.env.VAPID_PUBLIC_KEY;
const private_key = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@npts.tech";

export const push_enabled = Boolean(public_key && private_key);

if (push_enabled) {
    webpush.setVapidDetails(subject, public_key!, private_key!);
}

// Sends to every subscription the user has. Returns how many were delivered.
export async function send_push(user_id: string, payload: PushPayload): Promise<number> {
    if (!push_enabled) return 0;

    const subs = await db.pushSubscription.findMany({ where: { user_id } });
    let delivered = 0;

    await Promise.all(
        subs.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    JSON.stringify(payload),
                );
                delivered++;
            } catch (error) {
                const status = (error as { statusCode?: number }).statusCode;
                // Endpoint is gone (unsubscribed / expired) — prune it.
                if (status === 404 || status === 410) {
                    await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                } else {
                    console.error("send_push error:", status, error);
                }
            }
        }),
    );

    return delivered;
}
