"use client";

import { usePathname } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";

type AppShellProps = {
    children: React.ReactNode;
    role: string;
    email: string;
    locale: string;
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

export function AppShell({
    children,
    role,
    email,
    locale,
    app_name,
    sign_out_label,
    language_toggle_label,
    nav_home,
    nav_events,
    nav_map,
    nav_profile,
    nav_my_events,
    nav_submit_event,
    nav_users,
    nav_analytics,
}: AppShellProps) {
    const currentPath = usePathname();

    const nav_props = {
        role,
        email,
        locale,
        currentPath,
        app_name,
        sign_out_label,
        language_toggle_label,
        nav_home,
        nav_events,
        nav_map,
        nav_profile,
        nav_my_events,
        nav_submit_event,
        nav_users,
        nav_analytics,
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ background: "var(--color-bg)" }}>
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            {/* Header — mobile only. Desktop navigation lives entirely in the sidebar. */}
            <div className="md:hidden">
                <Header
                    role={role}
                    email={email}
                    locale={locale}
                    app_name={app_name}
                    sign_out_label={sign_out_label}
                    language_toggle_label={language_toggle_label}
                />
            </div>

            {/*
                Mobile:  paddingTop clears the fixed header.
                Desktop: no header → no padding needed (md:pt-0).
            */}
            <div
                className="flex flex-1 [padding-top:var(--header-h)] md:pt-0"
            >
                <Sidebar {...nav_props} />

                <main
                    id="main-content"
                    className="flex-1 min-w-0 overflow-auto pb-16 md:pb-0 px-4 py-6 md:px-6"
                    tabIndex={-1}
                    aria-label="Main content"
                >
                    {children}
                </main>
            </div>

            <BottomNav {...nav_props} />
        </div>
    );
}