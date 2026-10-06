"use client";

import { useEffect } from "react";
import { initInstallCapture } from "@/components/pwa/install-button";

/**
 * PWA service worker registration.
 * Kill-switch / rollback: set NEXT_PUBLIC_DISABLE_PWA_SW=true (and redeploy) to disable
 * the service worker instantly (e.g. Phase 0 baseline testing or production rollback).
 */
const DISABLE_SW = process.env.NEXT_PUBLIC_DISABLE_PWA_SW === "true";

export default function PWASetup() {
    useEffect(() => {
        // Start listening for the install prompt ASAP — it can fire before the
        // header (and its Install button) mounts. Independent of the SW below.
        initInstallCapture();

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
