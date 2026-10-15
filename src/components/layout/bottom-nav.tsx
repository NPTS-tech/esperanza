"use client";

import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { get_nav_items, get_active_href, type NavLabels } from "@/components/layout/nav-items";

type BottomNavProps = NavLabels & {
    role: string;
    currentPath: string;
};

export function BottomNav(props: BottomNavProps) {
    const items = get_nav_items(props.role, props);
    const active_href = get_active_href(items, props.currentPath);

    return (
        <nav
            className="flex md:hidden shrink-0 z-40 h-[calc(4rem+var(--safe-area-bottom))]"
            style={{
                background: "var(--color-surface)",
                borderTop: "1px solid var(--color-border)",
                boxShadow: "0 -2px 8px rgba(44,24,16,0.08)",
                paddingBottom: "var(--safe-area-bottom)",
            }}
            aria-label="Mobile navigation"
        >
            {items.map((item) => {
                const is_active = item.href === active_href;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                        style={{
                            color: is_active ? "var(--color-primary)" : "var(--color-text-secondary)",
                            textDecoration: "none",
                            outlineColor: "var(--color-primary)",
                        }}
                        aria-label={item.label}
                        aria-current={is_active ? "page" : undefined}
                    >
                        <span className={cn("transition-transform", is_active && "scale-110")} aria-hidden="true">
                            <Icon size={22} />
                        </span>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
