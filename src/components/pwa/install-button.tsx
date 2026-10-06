"use client";

import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Chrome fires `beforeinstallprompt` once, usually before the header mounts
// (we redirect through /auth/login first). Capture it at the app root — see
// initInstallCapture(), called from pwa_setup — into this module-level store so
// the button can read it whenever it later mounts, and refresh if it arrives.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
let captureStarted = false;

function notify() {
    listeners.forEach((l) => l());
}

export function initInstallCapture() {
    if (captureStarted || typeof window === "undefined") return;
    captureStarted = true;
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        notify();
    });
    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        notify();
    });
}

function isStandalone() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
}

function detectIOS() {
    const ua = navigator.userAgent.toLowerCase();
    // iPadOS 13+ reports a desktop (Macintosh) UA but is touch-capable.
    const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return /iphone|ipod|ipad/.test(ua) || iPadOS;
}

function isMobile() {
    return /android|iphone|ipod|ipad/i.test(navigator.userAgent) || detectIOS();
}

export function InstallButton() {
    const t = useTranslations("Install");
    const [canPrompt, setCanPrompt] = useState(false);
    const [ios, setIos] = useState(false);
    const [showSheet, setShowSheet] = useState(false);

    useEffect(() => {
        if (isStandalone() || !isMobile()) return; // already installed, or desktop

        if (detectIOS()) {
            setIos(true); // iOS has no prompt event; the button opens instructions
            return;
        }

        // Android/Chromium: reflect the captured prompt, update if it lands later.
        const sync = () => setCanPrompt(!!deferredPrompt);
        sync();
        listeners.add(sync);
        return () => {
            listeners.delete(sync);
        };
    }, []);

    if (!ios && !canPrompt) return null;

    const handleClick = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
            setCanPrompt(false);
        } else if (ios) {
            setShowSheet(true);
        }
    };

    // Renders nothing on desktop / when already installed, so it leaves no empty
    // card behind — the card wrapper lives here, not at the call site.
    return (
        <>
            <div className="card p-4">
                <button
                    type="button"
                    onClick={handleClick}
                    aria-label={t("button")}
                    className="btn btn-primary w-full"
                >
                    <Download size={18} aria-hidden="true" />
                    {t("button")}
                </button>
            </div>

            {showSheet && <IOSInstructions onClose={() => setShowSheet(false)} />}
        </>
    );
}

function IOSInstructions({ onClose }: { onClose: () => void }) {
    const t = useTranslations("Install");
    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ background: "rgba(44,24,16,0.45)" }}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={t("ios_title")}
        >
            <div
                className="w-full max-w-md m-3 p-5"
                style={{
                    background: "var(--color-surface)",
                    borderRadius: "var(--radius)",
                    boxShadow: "var(--shadow-lg)",
                    paddingBottom: "calc(1.25rem + var(--safe-area-bottom))",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <h2 className="font-bold text-lg" style={{ color: "var(--color-primary)" }}>
                        {t("ios_title")}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={t("ios_done")}
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        <X size={20} />
                    </button>
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {t("ios_intro")}
                </p>
                <ol className="mt-4 space-y-3 text-sm">
                    <li className="flex items-center gap-3">
                        <Share size={20} aria-hidden="true" style={{ color: "var(--color-primary)" }} />
                        <span>{t("ios_step1")}</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Plus size={20} aria-hidden="true" style={{ color: "var(--color-primary)" }} />
                        <span>{t("ios_step2")}</span>
                    </li>
                </ol>
                <button type="button" onClick={onClose} className="btn btn-primary mt-5 w-full">
                    {t("ios_done")}
                </button>
            </div>
        </div>
    );
}
