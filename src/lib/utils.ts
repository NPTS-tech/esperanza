import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Date and time as separate strings, for two-line table cells that never wrap mid-date. */
export function format_date_parts(iso_string: string, locale = "en"): { date: string; time: string } {
    const d = new Date(iso_string);
    const tag = locale === "es" ? "es-US" : "en-US";
    return {
        date: d.toLocaleDateString(tag, { year: "numeric", month: "short", day: "numeric" }),
        time: d.toLocaleTimeString(tag, { hour: "numeric", minute: "2-digit" }),
    };
}

export function format_date(iso_string: string): string {
    const d = new Date(iso_string);
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}
