"use client";

import { useEffect, useCallback, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: "sm" | "md" | "lg";
};

const SIZE_CLASS = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
};

const FOCUSABLE =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
    const panel_ref = useRef<HTMLDivElement>(null);
    const title_id = useId();

    // Focus trap — keep Tab/Shift+Tab cycling inside the panel
    const trap_focus = useCallback((e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const panel = panel_ref.current;
        if (!panel) return;
        const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }, []);

    // Keep the key handler stable so the open/close effect below doesn't
    // re-run (and re-focus) on every render — callers pass inline onClose
    // closures, which would otherwise re-trigger it on each keystroke.
    const on_close_ref = useRef(onClose);

    useEffect(() => {
        on_close_ref.current = onClose;
    });

    const handle_key = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") on_close_ref.current();
            trap_focus(e);
        },
        [trap_focus]
    );

    useEffect(() => {
        if (!open) return;
        document.addEventListener("keydown", handle_key);
        document.body.style.overflow = "hidden";

        // Move focus into the panel on open. Prefer the first real input over
        // the close button so typing can start immediately.
        const raf = requestAnimationFrame(() => {
            const panel = panel_ref.current;
            if (!panel) return;
            const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
            const first_input = focusable.find(
                (el) =>
                    el.tagName === "INPUT" ||
                    el.tagName === "TEXTAREA" ||
                    el.tagName === "SELECT",
            );
            (first_input ?? focusable[0])?.focus();
        });

        return () => {
            document.removeEventListener("keydown", handle_key);
            document.body.style.overflow = "";
            cancelAnimationFrame(raf);
        };
    }, [open, handle_key]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? title_id : undefined}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Panel */}
            <div
                ref={panel_ref}
                className={cn("card card-no-hover relative w-full p-6 shadow-lg max-h-[calc(100dvh-2rem)] overflow-y-auto", SIZE_CLASS[size])}
                style={{ zIndex: 1 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    {title && (
                        <h2
                            id={title_id}
                            className="text-lg font-semibold"
                            style={{ color: "var(--color-text)" }}
                        >
                            {title}
                        </h2>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-auto p-2 pointer-coarse:p-3 rounded-md transition-colors hover:bg-[var(--color-surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{ color: "var(--color-text-secondary)", outlineColor: "var(--color-primary)" }}
                        aria-label="Close dialog"
                    >
                        <X size={18} aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div>{children}</div>

                {/* Footer */}
                {footer && (
                    <div
                        className="flex items-center justify-end gap-2 mt-6 pt-4 border-t"
                        style={{ borderColor: "var(--color-border)" }}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
