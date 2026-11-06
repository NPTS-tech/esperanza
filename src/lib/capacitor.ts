import { Capacitor } from "@capacitor/core";

export function is_native_platform(): boolean {
    return typeof window !== "undefined" && Capacitor.isNativePlatform();
}

export function get_native_platform(): "ios" | "android" | "web" {
    if (typeof window === "undefined") return "web";
    const p = Capacitor.getPlatform();
    if (p === "ios") return "ios";
    if (p === "android") return "android";
    return "web";
}
