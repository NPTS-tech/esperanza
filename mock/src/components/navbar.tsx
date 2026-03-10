"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
    { href: "/", label: "Home", icon: "🏠" },
    { href: "/events", label: "Events", icon: "📅" },
    { href: "/services", label: "Services", icon: "🤝" },
    { href: "/resources", label: "Resources", icon: "📚" },
    { href: "/map", label: "Map", icon: "🗺️" },
];

const ADMIN_ITEMS = [
    { href: "/admin", label: "Admin", icon: "⚙️" },
    { href: "/provider", label: "Provider", icon: "📊" },
];

export default function Navbar() {
    const pathname = usePathname();
    const [mobile_open, set_mobile_open] = useState(false);
    const [lang, set_lang] = useState<"en" | "es">("en");

    function toggle_lang() {
        set_lang(lang === "en" ? "es" : "en");
    }

    return (
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* logo */}
                    <Link href="/" className="flex items-center gap-2 no-underline">
                        <span className="text-2xl">🌿</span>
                        <span className="text-xl font-bold text-blue-600">Esperanza</span>
                    </Link>

                    {/* desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${pathname === item.href
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                <span className="mr-1">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}

                        <div className="w-px h-6 bg-slate-200 mx-2" />

                        {ADMIN_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`px-3 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${pathname.startsWith(item.href)
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }`}
                            >
                                <span className="mr-1">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* right side */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggle_lang}
                            className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                            {lang === "en" ? "ES 🇲🇽" : "EN 🇺🇸"}
                        </button>

                        <Link
                            href="/profile"
                            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 no-underline"
                        >
                            👤 Profile
                        </Link>

                        {/* mobile menu toggle */}
                        <button
                            onClick={() => set_mobile_open(!mobile_open)}
                            className="md:hidden p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                            {mobile_open ? "✕" : "☰"}
                        </button>
                    </div>
                </div>
            </div>

            {/* mobile menu */}
            {mobile_open && (
                <div className="md:hidden border-t border-slate-200 bg-white pb-3">
                    {[...NAV_ITEMS, ...ADMIN_ITEMS].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => set_mobile_open(false)}
                            className={`block px-4 py-3 text-sm font-medium no-underline ${pathname === item.href
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            <span className="mr-2">{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                    <Link
                        href="/profile"
                        onClick={() => set_mobile_open(false)}
                        className="block px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 no-underline"
                    >
                        👤 Profile
                    </Link>
                </div>
            )}
        </nav>
    );
}
