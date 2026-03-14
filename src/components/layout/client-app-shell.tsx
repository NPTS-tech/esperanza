"use client";

import dynamic from "next/dynamic";

const AppShell = dynamic(
    () => import("@/components/layout/app-shell").then((m) => m.AppShell),
    {
        ssr: false,
        loading: () => (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: "var(--color-bg)" }}
            >
                <div
                    className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{
                        borderColor: "var(--color-border)",
                        borderTopColor: "var(--color-primary)",
                    }}
                />
            </div>
        ),
    },
);

export { AppShell as ClientAppShell };
