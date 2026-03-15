"use client";

import { useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { use_idle_timeout } from "@/lib/use_idle_timeout";
import { sign_out_action } from "@/app/actions/sign_out_action";

type KioskIdleHandlerProps = {
    role: string;
    locale: string;
};

const IDLE_MS = 3 * 60 * 1000; // 3 minutes

export function KioskIdleHandler({ role, locale }: KioskIdleHandlerProps) {
    const search_params = useSearchParams();
    const is_kiosk = search_params.get("kiosk") === "true";
    const [show_idle_modal, set_show_idle_modal] = useState(false);

    const handle_idle = useCallback(() => {
        if (is_kiosk && role === "USER") {
            set_show_idle_modal(true);
        }
    }, [is_kiosk, role]);

    use_idle_timeout(is_kiosk && role === "USER" ? IDLE_MS : Infinity, handle_idle);

    function handle_idle_dismiss() {
        set_show_idle_modal(false);
    }

    async function handle_idle_confirm() {
        set_show_idle_modal(false);
        await sign_out_action();
        window.location.replace(`/${locale}/auth/login?kiosk=true`);
    }

    if (!show_idle_modal) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Session timeout"
        >
            <div className="card p-6 max-w-md w-full space-y-4">
                <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                    Session Expired
                </h2>
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Your session has timed out due to inactivity. Continue to stay signed in or log out.
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handle_idle_dismiss}
                    >
                        Continue
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handle_idle_confirm}
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}
