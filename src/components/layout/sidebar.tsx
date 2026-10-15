"use client";

import { Sprout } from "lucide-react";
import { Link } from "@/i18n/routing";
import { LanguageToggle } from "@/components/ui/language-toggle";
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

            <div className="hidden lg:flex flex-col gap-3 px-2 lg:px-3 pb-5 pt-4" style={{ paddingBottom: "calc(1.25rem + var(--safe-area-bottom))" }}>
                <div className="hidden lg:block px-1">
                    <LanguageToggle locale={props.locale} variant="dropdown" placement="up" />
                </div>
            </div>
        </aside>
    );
}
