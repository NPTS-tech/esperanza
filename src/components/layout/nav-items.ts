import {
    Home,
    CalendarDays,
    Map,
    Bookmark,
    User,
    Users,
    BarChart3,
    Plus,
    Tags,
    type LucideIcon,
} from "lucide-react";

export type NavLabels = {
    nav_home: string;
    nav_events: string;
    nav_map: string;
    nav_profile: string;
    nav_my_events: string;
    nav_submit_event: string;
    nav_users: string;
    nav_analytics: string;
    nav_reservations: string;
    nav_categories: string;
};

export type NavItem = {
    key: string;
    href: string;
    label: string;
    icon: LucideIcon;
};

/** Single source of truth for role navigation. Sidebar (rail + full) and BottomNav both render this list. */
export function get_nav_items(role: string, l: NavLabels): NavItem[] {
    if (role === "ADMIN") {
        return [
            { key: "events",    href: "/admin/events",    label: l.nav_events,    icon: CalendarDays },
            { key: "analytics", href: "/admin/analytics", label: l.nav_analytics, icon: BarChart3 },
            { key: "users",     href: "/admin/users",     label: l.nav_users,     icon: Users },
            { key: "categories", href: "/admin/categories", label: l.nav_categories, icon: Tags },
            { key: "profile",   href: "/profile",         label: l.nav_profile,   icon: User },
        ];
    }
    if (role === "PROVIDER") {
        return [
            { key: "home",      href: "/",              label: l.nav_home,         icon: Home },
            { key: "my_events", href: "/provider",      label: l.nav_my_events,    icon: CalendarDays },
            { key: "submit",    href: "/events/create", label: l.nav_submit_event, icon: Plus },
            { key: "analytics", href: "/analytics",     label: l.nav_analytics,    icon: BarChart3 },
            { key: "profile",   href: "/profile",       label: l.nav_profile,      icon: User },
        ];
    }
    return [
        { key: "home",         href: "/",             label: l.nav_home,         icon: Home },
        { key: "events",       href: "/events",       label: l.nav_events,       icon: CalendarDays },
        { key: "map",          href: "/map",          label: l.nav_map,          icon: Map },
        { key: "reservations", href: "/reservations", label: l.nav_reservations, icon: Bookmark },
        { key: "profile",      href: "/profile",      label: l.nav_profile,      icon: User },
    ];
}

/** Longest matching href wins, so "/admin" never lights up on "/admin/analytics". "/" matches only exactly. */
export function get_active_href(items: NavItem[], current_path: string): string | undefined {
    return items
        .map((i) => i.href)
        .filter((href) => (href === "/" ? current_path === "/" : current_path.startsWith(href)))
        .sort((a, b) => b.length - a.length)[0];
}
