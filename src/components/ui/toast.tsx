"use client";

import { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

type ToastItem = {
    id: string;
    message: string;
    variant: ToastVariant;
};

const VARIANT_STYLES: Record<ToastVariant, string> = {
    success: "bg-[rgba(124,144,112,0.15)] border-l-4 border-[var(--color-success)]",
    error: "bg-[#fef2f2] border-l-4 border-[var(--color-danger)]",
    warning: "bg-[rgba(212,168,83,0.15)] border-l-4 border-[var(--color-warning)]",
    info: "bg-[rgba(183,113,74,0.08)] border-l-4 border-[var(--color-primary)]",
};

const VARIANT_ICONS: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle size={16} style={{ color: "var(--color-success)" }} />,
    error: <AlertCircle size={16} style={{ color: "var(--color-danger)" }} />,
    warning: <AlertTriangle size={16} style={{ color: "var(--color-warning)" }} />,
    info: <Info size={16} style={{ color: "var(--color-primary)" }} />,
};

function Toast({
    message,
    variant = "info",
    duration = 4000,
    onDismiss,
}: {
    message: string;
    variant?: ToastVariant;
    duration?: number;
    onDismiss: () => void;
}) {
    useEffect(() => {
        const t = setTimeout(onDismiss, duration);
        return () => clearTimeout(t);
    }, [duration, onDismiss]);

    return (
        <div
            className={cn(
                "flex items-start gap-3 px-4 py-3 rounded-lg shadow-md min-w-[260px] max-w-sm",
                VARIANT_STYLES[variant]
            )}
            role={variant === "error" ? "alert" : "status"}
            aria-live={variant === "error" ? "assertive" : "polite"}
            aria-atomic="true"
        >
            <div className="mt-0.5 flex-shrink-0" aria-hidden="true">{VARIANT_ICONS[variant]}</div>
            <p className="text-sm flex-1" style={{ color: "var(--color-text)" }}>
                {message}
            </p>
            <button
                onClick={onDismiss}
                className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ outlineColor: "var(--color-primary)" }}
                aria-label="Dismiss notification"
            >
                <X size={14} style={{ color: "var(--color-text-secondary)" }} aria-hidden="true" />
            </button>
        </div>
    );
}

export function ToastContainer({ toasts, dismiss }: { toasts: ToastItem[]; dismiss: (id: string) => void }) {
    // Always render the region so the live region is in the DOM when toasts arrive
    return (
        <div
            className="fixed bottom-20 right-4 md:bottom-[calc(1.5rem+var(--safe-area-bottom))] md:right-6 z-50 flex flex-col gap-2"
            aria-label="Notifications"
        >
            {toasts.map((t) => (
                <Toast
                    key={t.id}
                    message={t.message}
                    variant={t.variant}
                    onDismiss={() => dismiss(t.id)}
                />
            ))}
        </div>
    );
}

export function useToast() {
    const [toasts, set_toasts] = useState<ToastItem[]>([]);

    const show_toast = useCallback((message: string, variant: ToastVariant = "info") => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        set_toasts((prev) => [...prev, { id, message, variant }]);
    }, []);

    const dismiss = useCallback((id: string) => {
        set_toasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return { toasts, show_toast, dismiss };
}
