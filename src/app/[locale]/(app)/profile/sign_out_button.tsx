"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { LogOut } from "lucide-react";
import { sign_out_action } from "@/app/actions/sign_out_action";

export function SignOutButton({ label }: { label: string }) {
    const locale = useLocale();
    const [signing_out, set_signing_out] = useState(false);

    async function handle_sign_out() {
        if (signing_out) return;
        set_signing_out(true);
        const redirect = () => window.location.replace(`/${locale}/auth/login`);
        const timeout = window.setTimeout(redirect, 3000);
        try {
            await sign_out_action();
        } catch {
            // still redirect so the UI never stays stuck
        } finally {
            window.clearTimeout(timeout);
            redirect();
        }
    }

    return (
        <button
            type="button"
            onClick={() => void handle_sign_out()}
            disabled={signing_out}
            className="btn btn-secondary text-sm whitespace-nowrap"
            style={{ color: "#ef4444" }}
        >
            <LogOut size={16} aria-hidden="true" />
            {signing_out ? `${label}…` : label}
        </button>
    );
}
