"use client";

import { useState } from "react";
import { Sprout, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Link } from "@/i18n/routing";
import { LanguageToggle } from "@/components/ui/language-toggle";

type HeaderProps = {
    role: string;
    email: string;
    locale: string;
    app_name: string;
    sign_out_label: string;
    language_toggle_label: string;
};

export function Header({ email, locale, app_name, sign_out_label }: HeaderProps) {
    const initials = email ? email[0].toUpperCase() : "?";
    const [signing_out, set_signing_out] = useState(false);

    async function handle_sign_out() {
        if (signing_out) return;
        set_signing_out(true);
        try {
            await signOut({ callbackUrl: "/auth/login" });
        } catch {
            set_signing_out(false);
        }
    }

    return (
        <header
            className="fixed left-0 right-0 z-40 flex items-center px-4 md:px-6"
            style={{
                top: 0,
                height: "var(--header-h)",
                paddingTop: "var(--safe-area-top)",
                background: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
            }}
            role="banner"
        >
            {/* Logo */}
            <Link
                href="/"
                className="flex items-center gap-2 font-bold text-lg focus-visible:outline-2 focus-visible:rounded-sm"
                style={{ color: "var(--color-primary)", textDecoration: "none", outlineColor: "var(--color-primary)" }}
                aria-label={`${app_name} — go to home`}
            >
                <Sprout size={22} aria-hidden="true" />
                <span className="hidden sm:inline">{app_name}</span>
            </Link>

            <div className="flex-1" aria-hidden="true" />

            {/* Right controls */}
            <div className="flex items-center gap-2">
                <LanguageToggle locale={locale} variant="dropdown" />

                {/* Profile avatar */}
                <Link
                    href="/profile"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{ background: "var(--color-primary)", outlineColor: "var(--color-primary)" }}
                    aria-label={`Profile — signed in as ${email}`}
                >
                    <span aria-hidden="true">{initials}</span>
                </Link>

                {/* Sign out */}
                <button
                    onClick={handle_sign_out}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                        outlineColor: "var(--color-primary)",
                    }}
                    aria-label={sign_out_label}
                    aria-busy={signing_out}
                    disabled={signing_out}
                >
                    <LogOut size={13} aria-hidden="true" />
                    <span className="hidden sm:inline">
                        {signing_out ? `${sign_out_label}...` : sign_out_label}
                    </span>
                </button>
            </div>
        </header>
    );
}
