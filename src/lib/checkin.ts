import { createHmac, timingSafeEqual } from "node:crypto";

// QR check-in tokens.
//
// A token is an HMAC-SHA256 over the event ID, keyed by a server secret. The
// signature proves the scanned link is genuine for this event; the user's
// session proves who is checking in. Tokens never expire on their own —
// validity is enforced by the check-in window ([start_time, end_time]) at
// check-in time, so printed QRs keep working until the event ends and
// rescheduling moves the window for free.
//
// Rotating CHECKIN_SECRET invalidates every QR at once. Per-event revocation
// would need a version counter mixed into the HMAC input; not needed today.

function checkin_secret(): string {
    const secret =
        process.env.CHECKIN_SECRET ??
        process.env.BETTER_AUTH_SECRET ??
        process.env.AUTH_SECRET;
    if (!secret) {
        throw new Error("Missing CHECKIN_SECRET (or BETTER_AUTH_SECRET/AUTH_SECRET) for QR check-in tokens");
    }
    return secret;
}

export function generate_checkin_token(event_id: string): string {
    return createHmac("sha256", checkin_secret())
        .update(`checkin:${event_id}`)
        .digest("base64url");
}

export function verify_checkin_token(event_id: string, token: string): boolean {
    const expected = Buffer.from(generate_checkin_token(event_id));
    const provided = Buffer.from(token);
    if (expected.length !== provided.length) return false;
    return timingSafeEqual(expected, provided);
}

/** Locale-less path encoded into the QR; middleware adds the locale prefix. */
export function checkin_path(event_id: string, token: string): string {
    return `/events/${event_id}/check-in?token=${encodeURIComponent(token)}`;
}

/** Absolute check-in URL encoded into the QR, built from the configured app origin. */
export function checkin_url(event_id: string, token: string): string {
    const base =
        process.env.NEXT_PUBLIC_APP_URL ??
        process.env.BETTER_AUTH_URL ??
        "https://esperanza.local";
    return `${base.replace(/\/+$/, "")}${checkin_path(event_id, token)}`;
}
