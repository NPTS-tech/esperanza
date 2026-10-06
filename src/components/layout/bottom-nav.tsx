"use client";

import type { ComponentProps } from "react";
import { Home, CalendarDays, Map, User, Plus, Bookmark } from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type BottomNavProps = {
    role: string;
    currentPath: string;
    nav_home: string;
    nav_events: string;
    nav_map: string;
    nav_profile: string;
    nav_my_events: string;
    nav_submit_event: string;
};

type NavItem = {
    key: string;
    label: string;
    href: ComponentProps<typeof Link>["href"];
    icon: React.ReactNode;
};

function get_nav_items(role: string, labels: BottomNavProps): NavItem[] {
    const SZ = 22;
    if (role === "ADMIN") {
        return [
            { key: "home", label: labels.nav_home, href: "/", icon: <Home size={SZ} /> },
            { key: "events", label: labels.nav_events, href: "/admin", icon: <CalendarDays size={SZ} /> },
            { key: "profile", label: labels.nav_profile, href: "/profile", icon: <User size={SZ} /> },
        ];
    }
    if (role === "PROVIDER") {
        return [
            { key: "home", label: labels.nav_home, href: "/", icon: <Home size={SZ} /> },
            { key: "my_events", label: labels.nav_my_events, href: "/provider", icon: <CalendarDays size={SZ} /> },
            { key: "submit", label: labels.nav_submit_event, href: "/events/create", icon: <Plus size={SZ} /> },
            { key: "profile", label: labels.nav_profile, href: "/profile", icon: <User size={SZ} /> },
        ];
    }
    return [
        { key: "events", label: labels.nav_events, href: "/events", icon: <CalendarDays size={SZ} /> },
        { key: "map", label: labels.nav_map, href: "/map", icon: <Map size={SZ} /> },
        { key: "reservations", label: "Reservations", href: "/reservations", icon: <Bookmark size={SZ} /> },
        { key: "profile", label: labels.nav_profile, href: "/profile", icon: <User size={SZ} /> },
    ];
}

export function BottomNav(props: BottomNavProps) {
    const items = get_nav_items(props.role, props);

    return (
        <nav
            className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 h-16"
            style={{
                background: "var(--color-surface)",
                borderTop: "1px solid var(--color-border)",
                boxShadow: "0 -2px 8px rgba(44,24,16,0.08)",
                paddingBottom: "var(--safe-area-bottom)",
            }}
            aria-label="Mobile navigation"
        >
            {items.map((item) => {
                const is_active =
                    item.href === "/"
                        ? props.currentPath === "/"
                        : props.currentPath.startsWith(item.href as string);
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
                        style={{
                            color: is_active ? "var(--color-primary)" : "var(--color-text-secondary)",
                            textDecoration: "none",
                            outlineColor: "var(--color-primary)",
                        }}
                        aria-label={item.label}
                        aria-current={is_active ? "page" : undefined}
                    >
                        <span
                            className={cn("transition-transform", is_active && "scale-110")}
                            aria-hidden="true"
                        >
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
