"use client";

import { useState } from "react";
import {
    Home,
    CalendarDays,
    Map,
    User,
    Users,
    BarChart3,
    Plus,
    ChevronLeft,
    ChevronRight,
    Sprout,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type NavItem = {
    key: string;
    label: string;
    href: string;
    icon: React.ReactNode;
};

type SidebarProps = {
    role: string;
    currentPath: string;
    nav_home: string;
    nav_events: string;
    nav_map: string;
    nav_profile: string;
    nav_my_events: string;
    nav_submit_event: string;
    nav_users: string;
    nav_analytics: string;
    app_name: string;
};

function get_nav_items(role: string, labels: SidebarProps): NavItem[] {
    const ICON_SIZE = 20;
    if (role === "ADMIN") {
        return [
            { key: "home", label: labels.nav_home, href: "/", icon: <Home size={ICON_SIZE} /> },
            { key: "events", label: labels.nav_events, href: "/admin", icon: <CalendarDays size={ICON_SIZE} /> },
            { key: "users", label: labels.nav_users, href: "/admin", icon: <Users size={ICON_SIZE} /> },
            { key: "profile", label: labels.nav_profile, href: "/profile", icon: <User size={ICON_SIZE} /> },
        ];
    }
    if (role === "PROVIDER") {
        return [
            { key: "home", label: labels.nav_home, href: "/", icon: <Home size={ICON_SIZE} /> },
            { key: "my_events", label: labels.nav_my_events, href: "/provider", icon: <CalendarDays size={ICON_SIZE} /> },
            { key: "submit", label: labels.nav_submit_event, href: "/provider", icon: <Plus size={ICON_SIZE} /> },
            { key: "profile", label: labels.nav_profile, href: "/profile", icon: <User size={ICON_SIZE} /> },
        ];
    }
    return [
        { key: "home", label: labels.nav_home, href: "/", icon: <Home size={ICON_SIZE} /> },
        { key: "events", label: labels.nav_events, href: "/events", icon: <CalendarDays size={ICON_SIZE} /> },
        { key: "map", label: labels.nav_map, href: "/map", icon: <Map size={ICON_SIZE} /> },
        { key: "profile", label: labels.nav_profile, href: "/profile", icon: <User size={ICON_SIZE} /> },
    ];
}

export function Sidebar(props: SidebarProps) {
    const [collapsed, set_collapsed] = useState(false);
    const items = get_nav_items(props.role, props);

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 transition-all duration-200 border-r",
                collapsed ? "w-16" : "w-60"
            )}
            style={{
                background: "var(--sidebar)",
                borderColor: "var(--color-border)",
            }}
        >
            {/* Nav items */}
            <nav className="flex flex-col gap-1 p-2 flex-1 mt-2">
                {items.map((item) => {
                    const is_active =
                        item.href === "/"
                            ? props.currentPath === "/"
                            : props.currentPath.startsWith(item.href);
                    return (
                        <Link
                            key={item.key}
                            href={item.href as any}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                is_active
                                    ? "bg-[var(--color-surface-hover)] border-l-2 border-[var(--color-primary)] pl-[10px]"
                                    : "hover:bg-[var(--color-surface-hover)] border-l-2 border-transparent pl-[10px]"
                            )}
                            style={{
                                color: is_active
                                    ? "var(--color-primary)"
                                    : "var(--color-text-secondary)",
                                textDecoration: "none",
                            }}
                            title={collapsed ? item.label : undefined}
                        >
                            <span className="shrink-0">{item.icon}</span>
                            {!collapsed && <span className="truncate">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={() => set_collapsed((v) => !v)}
                className="flex items-center justify-center p-3 border-t transition-colors hover:bg-[var(--color-surface-hover)]"
                style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-secondary)",
                }}
                title={collapsed ? "Expand" : "Collapse"}
            >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
        </aside>
    );
}
