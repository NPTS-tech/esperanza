"use client";

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
    if (variant === "chips") {
        return (
            <div className={cn("flex flex-wrap gap-2", className)}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={cn(
                            "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                            tab.key === activeTab
                                ? "bg-[var(--color-primary)] text-white"
                                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:border-[var(--color-primary-light)]"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        );
    }

    return (
        <div className={cn("flex border-b border-[var(--color-border)]", className)}>
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onChange(tab.key)}
                    className={cn(
                        "px-4 py-2 text-sm font-medium transition-all -mb-px border-b-2",
                        tab.key === activeTab
                            ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                            : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    )}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}
