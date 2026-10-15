"use client";

import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";

const LANGUAGES = [
    { code: "en", label: "English", short: "EN" },
    { code: "es", label: "Español", short: "ES" },
] as const;

type LanguageToggleProps = {
    locale: string;
    /**
     * "dropdown" — globe + current locale chip that opens a menu (header default)
     * "segmented" — inline EN | ES toggle bar (auth pages)
     */
    variant?: "dropdown" | "segmented";
};

export function LanguageToggle({ locale, variant = "dropdown" }: LanguageToggleProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [open, set_open] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    function switch_to(code: string) {
        if (code !== locale) router.replace(pathname, { locale: code });
        set_open(false);
    }

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function handle(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) set_open(false);
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [open]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        function handle(e: KeyboardEvent) {
            if (e.key === "Escape") set_open(false);
        }
        document.addEventListener("keydown", handle);
        return () => document.removeEventListener("keydown", handle);
    }, [open]);

    const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

    if (variant === "segmented") {
        return (
            <div
                className="inline-flex rounded-full overflow-hidden border"
                style={{ borderColor: "var(--color-border)" }}
                role="group"
                aria-label="Language selector"
            >
                {LANGUAGES.map((lang) => {
                    const active = locale === lang.code;
                    return (
                        <button
                            key={lang.code}
                            onClick={() => switch_to(lang.code)}
                            aria-pressed={active}
                            aria-label={`Switch to ${lang.label}`}
                            className="min-h-9 pointer-coarse:min-h-11 px-4 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{
                                background: active ? "var(--color-primary)" : "var(--color-surface)",
                                color: active ? "white" : "var(--color-text-secondary)",
                                outlineColor: "var(--color-primary)",
                            }}
                        >
                            {lang.short}
                        </button>
                    );
                })}
            </div>
        );
    }

    // dropdown variant
    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <button
                onClick={() => set_open((v) => !v)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Language: ${current.label}. Click to change`}
                className="min-h-9 pointer-coarse:min-h-11 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                    color: "var(--color-text-secondary)",
                    border: "1px solid var(--color-border)",
                    outlineColor: "var(--color-primary)",
                }}
            >
                {/* Globe icon */}
                <svg
                    width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                </svg>
                <span>{current.short}</span>
                {/* Chevron */}
                <svg
                    width="10" height="10" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    aria-hidden="true"
                    className="transition-transform duration-150"
                    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown panel */}
            {open && (
                <div
                    className="absolute right-0 mt-1.5 w-36 rounded-[var(--radius)] shadow-lg overflow-hidden"
                    style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        boxShadow: "var(--shadow-md)",
                        zIndex: 50,
                    }}
                    role="listbox"
                    aria-label="Select language"
                >
                    {LANGUAGES.map((lang) => {
                        const active = locale === lang.code;
                        return (
                            <button
                                key={lang.code}
                                role="option"
                                aria-selected={active}
                                onClick={() => switch_to(lang.code)}
                                className="min-h-11 w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:bg-[var(--color-surface-hover)]"
                                style={{
                                    color: active ? "var(--color-primary)" : "var(--color-text)",
                                    fontWeight: active ? 600 : 400,
                                }}
                            >
                                <span>{lang.label}</span>
                                {active && (
                                    <Check
                                        size={14}
                                        aria-hidden="true"
                                        style={{ color: "var(--color-primary)" }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
