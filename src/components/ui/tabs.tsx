"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

export type Tab = { key: string; label: string };

type TabsProps = {
    tabs: Tab[];
    activeTab: string;
    onChange: (key: string) => void;
    variant?: "underline" | "chips";
    className?: string;
};

export function Tabs({ tabs, activeTab, onChange, variant = "underline", className }: TabsProps) {
    const list_ref = useRef<HTMLDivElement>(null);

    function handle_keydown(e: React.KeyboardEvent, index: number) {
        const buttons = list_ref.current?.querySelectorAll<HTMLButtonElement>("button");
        if (!buttons) return;
        let next = index;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            next = (index + 1) % tabs.length;
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            next = (index - 1 + tabs.length) % tabs.length;
        } else if (e.key === "Home") {
            e.preventDefault();
            next = 0;
        } else if (e.key === "End") {
            e.preventDefault();
            next = tabs.length - 1;
        } else {
            return;
        }
        onChange(tabs[next].key);
        buttons[next]?.focus();
    }

    if (variant === "chips") {
        return (
            <div
                ref={list_ref}
                className={cn("flex flex-wrap gap-2", className)}
                role="group"
                aria-label="Filter by category"
            >
                {tabs.map((tab, i) => (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        onKeyDown={(e) => handle_keydown(e, i)}
                        aria-pressed={tab.key === activeTab}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2",
                            tab.key === activeTab
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary-light)]"
                        )}
                        style={{ outlineColor: "var(--color-primary)" }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div
            ref={list_ref}
            className={cn("flex border-b border-[var(--color-border)]", className)}
            role="tablist"
        >
            {tabs.map((tab, i) => (
                <button
                    key={tab.key}
                    role="tab"
                    onClick={() => onChange(tab.key)}
                    onKeyDown={(e) => handle_keydown(e, i)}
                    aria-selected={tab.key === activeTab}
                    tabIndex={tab.key === activeTab ? 0 : -1}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition-all -mb-px border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2",
                        tab.key === activeTab
                            ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                            : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    )}
                    style={{ outlineColor: "var(--color-primary)" }}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
