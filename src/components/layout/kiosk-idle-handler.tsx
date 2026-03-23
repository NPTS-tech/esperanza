"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { use_idle_timeout } from "@/lib/use_idle_timeout";
import { sign_out_action } from "@/app/actions/sign_out_action";

type KioskIdleHandlerProps = {
    role: string;
    locale: string;
};

const KIOSK_IDLE_CONFIG = {
    IDLE_MS: 3 * 60 * 1000, // 3 minutes before showing modal
    MODAL_IDLE_MS: 2 * 60 * 1000, // additional 2 minutes before forced logout
} as const;

export function KioskIdleHandler({ role, locale }: KioskIdleHandlerProps) {
    const t = useTranslations("Kiosk");
    const search_params = useSearchParams();
    const is_kiosk = search_params.get("kiosk") === "true";
    const [show_idle_modal, set_show_idle_modal] = useState(false);
    const modal_timeout_id_ref = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handle_idle = useCallback(() => {
        if (is_kiosk && role === "USER") {
            set_show_idle_modal(true);
        }
    }, [is_kiosk, role]);

    use_idle_timeout(is_kiosk && role === "USER" ? KIOSK_IDLE_CONFIG.IDLE_MS : Infinity, handle_idle);

    useEffect(() => {
        const should_start_modal_timer = is_kiosk && role === "USER" && show_idle_modal;

        if (!should_start_modal_timer) {
            if (modal_timeout_id_ref.current !== null) {
                clearTimeout(modal_timeout_id_ref.current);
                modal_timeout_id_ref.current = null;
            }
            return;
        }

        modal_timeout_id_ref.current = setTimeout(() => {
            // If the modal is still visible and we're still in kiosk user mode, auto log out.
            if (is_kiosk && role === "USER") {
                // Fire and forget; navigation happens inside.
                void handle_idle_confirm();
            }
        }, KIOSK_IDLE_CONFIG.MODAL_IDLE_MS);

        return () => {
            if (modal_timeout_id_ref.current !== null) {
                clearTimeout(modal_timeout_id_ref.current);
                modal_timeout_id_ref.current = null;
            }
        };
    }, [is_kiosk, role, show_idle_modal]);

    function handle_idle_dismiss() {
        set_show_idle_modal(false);
    }

    async function handle_idle_confirm() {
        set_show_idle_modal(false);
        try {
            await sign_out_action();
        } finally {
            window.location.replace(`/${locale}/auth/login?kiosk=true`);
        }
    }

    if (!show_idle_modal) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            role="dialog"
            aria-modal="true"
            aria-label={t("idle_title")}
        >
            <div className="card p-6 max-w-md w-full space-y-4">
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    {t("idle_title")}
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {t("idle_body")}
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handle_idle_dismiss}
                    >
                        {t("idle_stay_signed_in")}
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handle_idle_confirm}
                    >
                        {t("idle_log_out")}
                    </button>
                </div>
            </div>
        </div>
    );
}
