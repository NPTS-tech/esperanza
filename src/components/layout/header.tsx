"use client";

import { Sprout } from "lucide-react";
import { Link } from "@/i18n/routing";
import { LanguageToggle } from "@/components/ui/language-toggle";

type HeaderProps = {
    locale: string;
    app_name: string;
};

export function Header({ locale, app_name }: HeaderProps) {
    return (
        <header
            className="shrink-0 z-40 flex items-center px-4 md:px-6"
            style={{
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
            </div>
        </header>
    );
}
