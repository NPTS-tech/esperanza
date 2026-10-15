"use client";

import { Suspense } from "react";
import { usePathname } from "@/i18n/routing";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { KioskIdleHandler } from "@/components/layout/kiosk-idle-handler";
import type { NavLabels } from "@/components/layout/nav-items";

type AppShellProps = NavLabels & {
    children: React.ReactNode;
    role: string;
    email: string;
    locale: string;
    app_name: string;
    sign_out_label: string;
    language_toggle_label: string;
};

export function AppShell({ children, ...props }: AppShellProps) {
    const currentPath = usePathname();
    const nav_props = { ...props, currentPath };


    return (
        <div className="h-dvh flex flex-col overflow-hidden" style={{ background: "var(--color-bg)" }}>
            <a href="#main-content" className="skip-link">
                Skip to main content
            </a>

            {/* Header — phone + tablet rail. At lg+ the full sidebar carries logo + language. */}
            <div className="shrink-0 lg:hidden">
                <Header locale={props.locale} app_name={props.app_name} />
            </div>

            {/* Shell is pinned to the viewport; only <main> scrolls (no iOS whole-page bounce). */}
            <div className="flex flex-1 min-h-0">
                <Sidebar {...nav_props} />

                <main
                    id="main-content"
                    className="@container flex-1 min-w-0 overflow-y-auto overscroll-contain px-4 py-6 md:px-6 md:pb-[calc(1.5rem+var(--safe-area-bottom))]"
                    tabIndex={-1}
                    aria-label="Main content"
                >
                    {children}
                </main>
            </div>

            <BottomNav {...nav_props} />
            <Suspense fallback={null}>
                <KioskIdleHandler role={props.role} locale={props.locale} />
            </Suspense>
        </div>
    );
}
