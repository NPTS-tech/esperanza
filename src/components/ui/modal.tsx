"use client";

import { useEffect, useCallback } from "react";
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

export function Modal({ open, onClose, title, children, footer, size = "md" }: ModalProps) {
    const handle_key = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (open) {
            document.addEventListener("keydown", handle_key);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handle_key);
            document.body.style.overflow = "";
        };
    }, [open, handle_key]);

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            aria-modal="true"
            role="dialog"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={cn(
                    "card relative w-full p-6 shadow-lg",
                    SIZE_CLASS[size]
                )}
                style={{ zIndex: 1 }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    {title && (
                        <h2
                            className="text-lg font-semibold"
                            style={{ color: "var(--color-text)" }}
                        >
                            {title}
                        </h2>
                    )}
                    <button
                        onClick={onClose}
                        className="ml-auto p-1 rounded-md transition-colors hover:bg-[var(--color-surface-hover)]"
                        style={{ color: "var(--color-text-secondary)" }}
                        aria-label="Close"
                        autoFocus
                    >
                        <X size={18} />
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
