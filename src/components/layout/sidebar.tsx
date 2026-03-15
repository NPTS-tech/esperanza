"use client";

import { useState, useRef, useEffect } from "react";
import {
    Home,
    CalendarDays,
    Map,
    Bookmark,
    Users,
    BarChart3,
    Plus,
    Settings,
    LogOut,
    ChevronRight,
    Sprout,
    ClipboardList,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { sign_out_action } from "@/app/actions/sign_out_action";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────

type NavItem = {
    key: string;
    label: string;
    href: string;
    icon: React.ReactNode;
};

type NavSection = {
    section_label?: string;
    items: NavItem[];
};

type SidebarProps = {
    role: string;
    email: string;
    locale: string;
    currentPath: string;
    app_name: string;
    sign_out_label: string;
    language_toggle_label: string;
    nav_home: string;
    nav_events: string;
    nav_map: string;
    nav_profile: string;
    nav_my_events: string;
    nav_submit_event: string;
    nav_users: string;
    nav_analytics: string;
};

const SZ = 18;

// ─── Nav config per role ──────────────────────────────────────

function get_nav_sections(role: string, labels: SidebarProps): NavSection[] {
    if (role === "ADMIN") {
        return [
            {
                items: [
                    { key: "events",    label: labels.nav_events,    href: "/admin/events",    icon: <CalendarDays size={SZ} /> },
                    { key: "analytics", label: labels.nav_analytics, href: "/admin/analytics", icon: <BarChart3 size={SZ} /> },
                    { key: "users",     label: labels.nav_users,     href: "/admin/users",   icon: <Users size={SZ} /> },
                ],
            },
        ];
    }

    if (role === "PROVIDER") {
        return [
            {
                section_label: "PLATFORM",
                items: [
                    { key: "home",   label: labels.nav_home,         href: "/",         icon: <Home size={SZ} /> },
                    { key: "events", label: labels.nav_my_events,    href: "/provider", icon: <CalendarDays size={SZ} /> },
                    { key: "submit", label: labels.nav_submit_event, href: "/provider", icon: <Plus size={SZ} /> },
                ],
            },
        ];
    }

    // USER (default)
    return [
        {
            items: [
                { key: "home",         label: "Dashboard",    href: "/",       icon: <Home size={SZ} /> },
                { key: "events",       label: labels.nav_events, href: "/events", icon: <CalendarDays size={SZ} /> },
                { key: "map",          label: labels.nav_map, href: "/map",    icon: <Map size={SZ} /> },
                { key: "reservations", label: "Reservations", href: "#",       icon: <Bookmark size={SZ} /> },
            ],
        },
    ];
}

// ─── NavLink ──────────────────────────────────────────────────

function NavLink({
    item,
    currentPath,
}: {
    item: NavItem;
    currentPath: string;
}) {
    let is_active: boolean;
    if (item.href === "/") {
        is_active = currentPath === "/";
    } else if (item.href === "/admin/users") {
        is_active = currentPath.startsWith("/admin/users");
    } else if (item.href === "/admin/events") {
        is_active = currentPath.startsWith("/admin/events");
    } else if (item.href === "/admin/analytics") {
        is_active = currentPath.startsWith("/admin/analytics");
    } else if (item.href === "/admin") {
        is_active = currentPath === "/admin" || (currentPath.startsWith("/admin") && !currentPath.startsWith("/admin/events") && !currentPath.startsWith("/admin/analytics") && !currentPath.startsWith("/admin/users"));
    } else {
        is_active = item.href !== "#" && currentPath.startsWith(item.href);
    }

    return (
        <Link
            href={item.href as any}
            className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full focus-visible:outline-2 focus-visible:outline-offset-2",
                is_active
                    ? "bg-[var(--color-surface-hover)]"
                    : "hover:bg-[var(--color-surface-hover)]",
            )}
            style={{
                color: is_active
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                textDecoration: "none",
                outlineColor: "var(--color-primary)",
            }}
            aria-current={is_active ? "page" : undefined}
        >
            <span
                className="shrink-0"
                aria-hidden="true"
                style={{ color: is_active ? "var(--color-primary)" : "var(--color-text-secondary)" }}
            >
                {item.icon}
            </span>
            <span>{item.label}</span>
        </Link>
    );
}

// ─── My Account popover ───────────────────────────────────────

function MyAccount({
    email,
    locale,
    sign_out_label,
}: {
    email: string;
    locale: string;
    sign_out_label: string;
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
                    className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden"
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
                        <Settings size={15} aria-hidden="true" />
                        Settings
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
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2"
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
                    className="flex-1 text-sm font-medium"
                    style={{ color: "var(--color-text)" }}
                >
                    My Account
                </span>

                {/* Chevron */}
                <ChevronRight
                    size={14}
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
    const sections = get_nav_sections(props.role, props);

    return (
        <aside
            className="hidden md:flex flex-col shrink-0 border-r"
            style={{
                width: 220,
                height: "100vh",
                position: "sticky",
                top: 0,
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                overflowY: "auto",
            }}
            aria-label="Sidebar navigation"
        >
            {/* ── Logo ── */}
            <div
                className="flex items-center gap-2.5 px-4"
                style={{ paddingTop: 24, paddingBottom: 24 }}
            >
                <Sprout
                    size={22}
                    aria-hidden="true"
                    style={{ color: "var(--color-primary)", flexShrink: 0 }}
                />
                <span
                    className="font-bold text-base"
                    style={{ color: "var(--color-primary)" }}
                >
                    {props.app_name}
                </span>
            </div>

            {/* ── Nav sections ── */}
            <nav
                className="flex flex-col gap-5 flex-1 px-3"
                aria-label="Main navigation"
            >
                {sections.map((section, si) => (
                    <div key={si} className="flex flex-col gap-0.5">
                        {section.section_label && (
                            <p
                                className="text-[10px] font-semibold tracking-widest px-3 mb-1"
                                style={{ color: "var(--color-text-secondary)", opacity: 0.6 }}
                            >
                                {section.section_label}
                            </p>
                        )}
                        {section.items.map(item => (
                            <NavLink
                                key={item.key}
                                item={item}
                                currentPath={props.currentPath}
                            />
                        ))}
                    </div>
                ))}
            </nav>

            {/* ── Bottom ── */}
            <div
                className="flex flex-col gap-3 px-3"
                style={{ paddingBottom: 20, paddingTop: 16 }}
            >
                {/* Language toggle */}
                <div className="px-1">
                    <LanguageToggle locale={props.locale} variant="dropdown" />
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: "var(--color-border)" }} />

                {/* My Account */}
                <MyAccount
                    email={props.email}
                    locale={props.locale}
                    sign_out_label={props.sign_out_label}
                />
            </div>
        </aside>
    );
}