"use client";

import { Sprout, Globe, LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "@/i18n/routing";
import { Link } from "@/i18n/routing";

type HeaderProps = {
    role: string;
    email: string;
    locale: string;
    app_name: string;
    sign_out_label: string;
    language_toggle_label: string;
};

export function Header({
    email,
    locale,
    app_name,
    sign_out_label,
    language_toggle_label,
}: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();

    function toggle_lang() {
        const next_lang = locale === "en" ? "es" : "en";
        router.replace(pathname, { locale: next_lang });
    }

    const initials = email ? email[0].toUpperCase() : "?";

    return (
        <header
            className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 md:px-6"
            style={{
                background: "var(--color-surface)",
                borderBottom: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
            }}
        >
            {/* Logo */}
            <Link
                href="/"
                className="flex items-center gap-2 font-bold text-lg"
                style={{ color: "var(--color-primary)", textDecoration: "none" }}
            >
                <Sprout size={22} />
                <span className="hidden sm:inline">{app_name}</span>
            </Link>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right controls */}
            <div className="flex items-center gap-2">
                {/* Language toggle */}
                <button
                    onClick={toggle_lang}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors"
                    style={{
                        color: "var(--color-text-secondary)",
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                    }}
                >
                    <Globe size={13} />
                    {language_toggle_label}
                </button>

                {/* Profile link */}
                <Link
                    href="/profile"
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white transition-opacity hover:opacity-80"
                    style={{ background: "var(--color-primary)" }}
                    title={email}
                >
                    {initials}
                </Link>

                {/* Sign out */}
                <button
                    onClick={() => signOut({ callbackUrl: "/auth/login" })}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                    }}
                    title={sign_out_label}
                >
                    <LogOut size={13} />
                    <span className="hidden sm:inline">{sign_out_label}</span>
                </button>
            </div>
        </header>
    );
}
