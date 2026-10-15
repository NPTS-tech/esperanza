"use client";

import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronRight, Sprout } from "lucide-react";
import { Link } from "@/i18n/routing";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { sign_out_action } from "@/app/actions/sign_out_action";
import { cn } from "@/lib/utils";
import { get_nav_items, get_active_href, type NavItem, type NavLabels } from "@/components/layout/nav-items";

// ─── Types ────────────────────────────────────────────────────

type SidebarProps = NavLabels & {
    role: string;
    email: string;
    locale: string;
    currentPath: string;
    app_name: string;
    sign_out_label: string;
    language_toggle_label: string;
};

// ─── NavLink ──────────────────────────────────────────────────

function NavLink({ item, is_active }: { item: NavItem; is_active: boolean }) {
    const Icon = item.icon;
    return (
        <Link
            href={item.href}
            className={cn(
                // rail (md): icon over 10px label, centered. full (lg): icon beside 14px label.
                "flex flex-col lg:flex-row items-center lg:items-center gap-1 lg:gap-3 px-1 lg:px-3 py-2 lg:py-2.5 min-h-11 rounded-lg text-[10px] lg:text-sm leading-tight text-center lg:text-left font-medium transition-colors w-full focus-visible:outline-2 focus-visible:outline-offset-2",
                is_active ? "bg-[var(--color-surface-hover)]" : "hover:bg-[var(--color-surface-hover)]",
            )}
            style={{
                color: is_active ? "var(--color-primary)" : "var(--color-text-secondary)",
                textDecoration: "none",
                outlineColor: "var(--color-primary)",
            }}
            aria-current={is_active ? "page" : undefined}
        >
            <span className="shrink-0" aria-hidden="true">
                <Icon size={20} className="lg:hidden" />
                <Icon size={18} className="hidden lg:block" />
            </span>
            <span className="line-clamp-2 lg:line-clamp-none">{item.label}</span>
        </Link>
    );
}

// ─── My Account popover ───────────────────────────────────────

function MyAccount({
    email,
    locale,
    sign_out_label,
    profile_label,
}: {
    email: string;
    locale: string;
    sign_out_label: string;
    profile_label: string;
}) {
    const [open, set_open]       = useState(false);
    const [signing_out, set_so]  = useState(false);
    const ref                    = useRef<HTMLDivElement>(null);
    const initial                = email ? email[0].toUpperCase() : "?";

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        function on_click(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                set_open(false);
            }
        }
        document.addEventListener("mousedown", on_click);
        return () => document.removeEventListener("mousedown", on_click);
    }, [open]);

    async function handle_sign_out() {
        if (signing_out) return;
        set_so(true);
        const login_url = `/${locale}/auth/login`;
        const redirect  = () => window.location.replace(login_url);
        const timeout   = window.setTimeout(redirect, 3000);
        try {
            await sign_out_action();
        } finally {
            window.clearTimeout(timeout);
            redirect();
        }
    }

    return (
        <div ref={ref} className="relative">
            {/* Popover */}
            {open && (
                <div
                    className="absolute bottom-full left-0 w-52 lg:w-auto lg:right-0 mb-2 rounded-xl overflow-hidden"
                    style={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        boxShadow: "var(--shadow-md, 0 4px 16px rgba(0,0,0,0.12))",
                        zIndex: 50,
                    }}
                    role="menu"
                    aria-label="Account menu"
                >
                    <Link
                        href="/profile"
                        onClick={() => set_open(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-[var(--color-surface-hover)]"
                        style={{ color: "var(--color-text)", textDecoration: "none" }}
                        role="menuitem"
                    >
                        <User size={15} aria-hidden="true" />
                        {profile_label}
                    </Link>

                    <div
                        style={{
                            height: 1,
                            background: "var(--color-border)",
                            margin: "0 12px",
                        }}
                    />

                    <button
                        onClick={handle_sign_out}
                        disabled={signing_out}
                        className="flex items-center gap-3 px-4 py-3 text-sm w-full text-left transition-colors hover:bg-[var(--color-surface-hover)]"
                        style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}
                        role="menuitem"
                    >
                        <LogOut size={15} aria-hidden="true" />
                        {signing_out ? `${sign_out_label}…` : sign_out_label}
                    </button>
                </div>
            )}

            {/* Trigger card */}
            <button
                onClick={() => set_open(o => !o)}
                className="flex items-center justify-center lg:justify-start gap-3 w-full px-2 lg:px-3 py-2 lg:py-2.5 min-h-11 rounded-xl transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                    background: "var(--color-surface-hover)",
                    border: "1px solid var(--color-border)",
                    cursor: "pointer",
                    outlineColor: "var(--color-primary)",
                    textAlign: "left",
                }}
                aria-label="Open account menu"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                {/* Avatar */}
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: "var(--color-primary)" }}
                    aria-hidden="true"
                >
                    {initial}
                </div>

                {/* Label */}
                <span
                    className="hidden lg:block flex-1 text-sm font-medium"
                    style={{ color: "var(--color-text)" }}
                >
                    My Account
                </span>

                {/* Chevron */}
                <ChevronRight
                    size={14}
                    className="hidden lg:block"
                    aria-hidden="true"
                    style={{
                        color: "var(--color-text-secondary)",
                        transform: open ? "rotate(90deg)" : "none",
                        transition: "transform .15s",
                    }}
                />
            </button>
        </div>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────

export function Sidebar(props: SidebarProps) {
    const items = get_nav_items(props.role, props);
    const active_href = get_active_href(items, props.currentPath);

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col shrink-0 border-r overflow-y-auto",
                // rail: 72px under the header. full: 220px, pads iOS status bar. Height comes from the shell row.
                "w-[72px] lg:w-[220px]",
                "lg:pt-[var(--safe-area-top)]",
            )}
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            aria-label="Sidebar navigation"
        >
            {/* Logo — full sidebar only (rail users see it in the header) */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-6">
                <Sprout size={22} aria-hidden="true" style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                <span className="font-bold text-base" style={{ color: "var(--color-primary)" }}>
                    {props.app_name}
                </span>
            </div>

            <nav className="flex flex-col gap-1 lg:gap-0.5 flex-1 px-2 lg:px-3 pt-3 lg:pt-0" aria-label="Main navigation">
                {items.map((item) => (
                    <NavLink key={item.key} item={item} is_active={item.href === active_href} />
                ))}
            </nav>

            <div className="flex flex-col gap-3 px-2 lg:px-3 pb-5 pt-4" style={{ paddingBottom: "calc(1.25rem + var(--safe-area-bottom))" }}>
                <div className="hidden lg:block px-1">
                    <LanguageToggle locale={props.locale} variant="dropdown" />
                </div>
                <div className="hidden lg:block" style={{ height: 1, background: "var(--color-border)" }} />
                <MyAccount
                    email={props.email}
                    locale={props.locale}
                    sign_out_label={props.sign_out_label}
                    profile_label={props.nav_profile}
                />
            </div>
        </aside>
    );
}
