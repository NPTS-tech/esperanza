"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { PushNotifications } from "@capacitor/push-notifications";

export default function NativeMobileBridge() {
    const router = useRouter();

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let back_listener_remover: (() => void) | undefined;
        let url_listener_remover: (() => void) | undefined;
        let push_reg_remover: (() => void) | undefined;
        let push_action_remover: (() => void) | undefined;

        const init = async () => {
            try {
                await StatusBar.setStyle({ style: Style.Light });
                if (Capacitor.getPlatform() === "android") {
                    await StatusBar.setBackgroundColor({ color: "#FAF7F2" });
                }
            } catch (err) {
                console.warn("[NativeBridge] StatusBar setup failed:", err);
            }

            try {
                await SplashScreen.hide({ fadeOutDuration: 250 });
            } catch (err) {
                console.warn("[NativeBridge] SplashScreen hide failed:", err);
            }

            // Android Hardware Back Button navigation handling
            try {
                const backHandle = await CapApp.addListener("backButton", ({ canGoBack }) => {
                    if (canGoBack && window.history.length > 1) {
                        window.history.back();
                    } else {
                        void CapApp.exitApp();
                    }
                });
                back_listener_remover = () => void backHandle.remove();
            } catch (err) {
                console.warn("[NativeBridge] Back button listener failed:", err);
            }

            // Deep link URL listener (custom schemes & universal links)
            try {
                const urlHandle = await CapApp.addListener("appUrlOpen", (data) => {
                    try {
                        const parsed = new URL(data.url);
                        const target = parsed.pathname + parsed.search + parsed.hash;
                        if (target) {
                            router.push(target);
                        }
                    } catch {
                        const clean = data.url.replace(/^.*:\/\/[^/]+/, "");
                        if (clean.startsWith("/")) {
                            router.push(clean);
                        }
                    }
                });
                url_listener_remover = () => void urlHandle.remove();
            } catch (err) {
                console.warn("[NativeBridge] App URL listener failed:", err);
            }

            // Push Notifications setup for native platform
            try {
                const perm = await PushNotifications.checkPermissions();
                if (perm.receive === "granted") {
                    await PushNotifications.register();
                }

                const regHandle = await PushNotifications.addListener("registration", (token) => {
                    void fetch("/api/push/native", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            token: token.value,
                            platform: Capacitor.getPlatform(),
                        }),
                    }).catch((e) => console.warn("[NativeBridge] Failed to register native push token:", e));
                });
                push_reg_remover = () => void regHandle.remove();

                const actionHandle = await PushNotifications.addListener(
                    "pushNotificationActionPerformed",
                    (notification) => {
                        const targetUrl = notification.notification.data?.url;
                        if (typeof targetUrl === "string" && targetUrl.startsWith("/")) {
                            router.push(targetUrl);
                        }
                    }
                );
                push_action_remover = () => void actionHandle.remove();
            } catch (err) {
                console.warn("[NativeBridge] Push notifications setup skipped or failed:", err);
            }
        };

        void init();

        return () => {
            back_listener_remover?.();
            url_listener_remover?.();
            push_reg_remover?.();
            push_action_remover?.();
        };
    }, [router]);

    return null;
}
