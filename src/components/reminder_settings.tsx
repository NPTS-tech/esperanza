"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { REMINDER_LEAD_OPTIONS } from "@/lib/constants";

export type ReminderPrefs = {
    reminder_push: boolean;
    reminder_email: boolean;
    reminder_lead_min: number;
};

// "unsupported" covers iOS Safari tabs: PushManager only exists in the installed PWA.
type DeviceState = "loading" | "unsupported" | "blocked" | "off" | "on";

function url_base64_to_uint8(base64: string) {
    const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4))
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

async function get_registration() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        return null;
    }
    return (await navigator.serviceWorker.getRegistration()) ?? null;
}

async function post_subscription(sub: PushSubscription) {
    const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
    });
    if (!res.ok) throw new Error("subscribe failed");
}

export function ReminderSettings({
    initial,
    vapid_public_key,
    on_result,
}: {
    initial: ReminderPrefs;
    vapid_public_key: string | null;
    on_result: (ok: boolean) => void;
}) {
    const t = useTranslations("Profile");
    const [prefs, set_prefs] = useState(initial);
    const [saving, set_saving] = useState(false);
    const [device, set_device] = useState<DeviceState>("loading");

    useEffect(() => {
        void (async () => {
            const reg = vapid_public_key ? await get_registration() : null;
            if (!reg) return set_device("unsupported");
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                // Re-sync in case the browser rotated the subscription.
                await post_subscription(sub).catch(() => {});
                return set_device("on");
            }
            set_device(Notification.permission === "denied" ? "blocked" : "off");
        })();
    }, [vapid_public_key]);

    async function save(patch: Partial<ReminderPrefs>) {
        const previous = prefs;
        set_prefs({ ...prefs, ...patch });
        set_saving(true);
        try {
            const res = await fetch("/api/users/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });
            if (!res.ok) throw new Error();
            on_result(true);
        } catch {
            set_prefs(previous);
            on_result(false);
        } finally {
            set_saving(false);
        }
    }

    async function enable_device() {
        const reg = await get_registration();
        if (!reg || !vapid_public_key) return;
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                set_device(permission === "denied" ? "blocked" : "off");
                return;
            }
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: url_base64_to_uint8(vapid_public_key),
            });
            await post_subscription(sub);
            set_device("on");
            on_result(true);
        } catch {
            on_result(false);
        }
    }

    const device_status = {
        loading: null,
        unsupported: <span>{t("reminder_push_unsupported")}</span>,
        blocked: <span>{t("reminder_push_blocked")}</span>,
        on: <span>{t("reminder_push_on_device")}</span>,
        off: (
            <button type="button" className="btn btn-secondary mt-2" onClick={() => void enable_device()}>
                {t("reminder_push_enable_device")}
            </button>
        ),
    }[device];

    return (
        <div className="card p-6 space-y-4">
            <div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {t("reminders_section")}
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("reminders_section_help")}
                </p>
            </div>

            <label className="flex items-start gap-3 text-sm" style={{ color: "var(--color-text)" }}>
                <input
                    type="checkbox"
                    className="mt-1"
                    checked={prefs.reminder_push}
                    onChange={(e) => void save({ reminder_push: e.target.checked })}
                    disabled={saving}
                />
                <span>
                    <span className="font-medium">{t("reminder_push")}</span>
                    {prefs.reminder_push && device_status && (
                        <span className="block text-xs mt-1" style={{ color: "var(--color-text-secondary)" }}>
                            {device_status}
                        </span>
                    )}
                </span>
            </label>

            <label className="flex items-start gap-3 text-sm" style={{ color: "var(--color-text)" }}>
                <input
                    type="checkbox"
                    className="mt-1"
                    checked={prefs.reminder_email}
                    onChange={(e) => void save({ reminder_email: e.target.checked })}
                    disabled={saving}
                />
                <span className="font-medium">{t("reminder_email")}</span>
            </label>

            <label className="block text-sm" style={{ color: "var(--color-text)" }}>
                <span className="font-medium">{t("reminder_lead")}</span>
                <select
                    className="select mt-2"
                    value={prefs.reminder_lead_min}
                    onChange={(e) => void save({ reminder_lead_min: Number(e.target.value) })}
                    disabled={saving || (!prefs.reminder_push && !prefs.reminder_email)}
                >
                    {REMINDER_LEAD_OPTIONS.map((min) => (
                        <option key={min} value={min}>
                            {t(`reminder_lead_${min}`)}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
