"use client";

import { useEffect } from "react";

/**
 * PWA service worker registration.
 * Kill-switch / rollback: set NEXT_PUBLIC_DISABLE_PWA_SW=true (and redeploy) to disable
 * the service worker instantly (e.g. Phase 0 baseline testing or production rollback).
 */
const DISABLE_SW = process.env.NEXT_PUBLIC_DISABLE_PWA_SW === "true";

export default function PWASetup() {
    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const run = async () => {
            if (DISABLE_SW) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.unregister()));
                return;
            }

            const isProd = process.env.NODE_ENV === "production";
            if (!isProd) {
                const regs = await navigator.serviceWorker.getRegistrations();
                await Promise.all(regs.map((r) => r.unregister()));
                return;
            }

            const register = () => {
                navigator.serviceWorker
                    .register("/sw.js", { updateViaCache: "none" })
                    .then(
                        (registration) => {
                            console.log("Service Worker registration successful with scope: ", registration.scope);
                        },
                        (err) => {
                            console.log("Service Worker registration failed: ", err);
                        }
                    );
            };
            if (document.readyState === "complete") register();
            else window.addEventListener("load", register);
        };

        run();
    }, []);

    return null;
}
