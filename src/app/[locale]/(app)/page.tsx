import { getSession } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { CalendarDays, Map, User } from "lucide-react";
import { Link } from "@/i18n/routing";
import { redirect } from "@/i18n/routing";
import { getLocale } from "next-intl/server";

export default async function HomePage() {
    const [session, t, locale] = await Promise.all([
        getSession(),
        getTranslations("Home"),
        getLocale(),
    ]);

    if (!session?.user) {
        redirect({ href: "/auth/login", locale });
        return null;
    }

    const display_name =
        session.user.username?.trim() ||
        session.user.email?.split("@")[0] ||
        session.user.email;

    const quick_links = [
        {
            href: "/events",
            icon: <CalendarDays size={28} style={{ color: "var(--color-primary)" }} />,
            label: t("browse_events"),
            desc: t("browse_events_desc"),
        },
        {
            href: "/map",
            icon: <Map size={28} style={{ color: "var(--color-secondary)" }} />,
            label: t("view_map"),
            desc: t("view_map_desc"),
        },
        {
            href: "/profile",
            icon: <User size={28} style={{ color: "var(--color-accent)" }} />,
            label: t("my_profile"),
            desc: t("my_profile_desc"),
        },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Welcome card */}
            <div className="card p-6">
                <p className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    {t("welcome")},
                </p>
                <h1 className="text-2xl font-bold mt-1" style={{ color: "var(--color-text)" }}>
                    {display_name}
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("subtitle")}
                </p>
            </div>

            {/* Quick links */}
            <div>
                <h2
                    className="text-sm font-semibold uppercase tracking-wider mb-3"
                    style={{ color: "var(--color-text-secondary)" }}
                >
                    {t("quick_links")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {quick_links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href as any}
                            className="card p-4 flex flex-col gap-2 no-underline hover:no-underline"
                            style={{ textDecoration: "none" }}
                        >
                            {link.icon}
                            <span className="font-semibold text-sm" style={{ color: "var(--color-text)" }}>
                                {link.label}
                            </span>
                            <span className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                                {link.desc}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
