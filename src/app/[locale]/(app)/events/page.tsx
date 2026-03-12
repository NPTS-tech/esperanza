import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { EventsListClient } from "./events_list";
import { mock_events } from "@/lib/mock_data";

export default async function EventsPage() {
    const session = await auth();
    if (!session) redirect("/auth/login");

    const locale = (await getLocale()) as "en" | "es";
    const t = await getTranslations("Events");

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("heading")}
                </h1>
            </div>
            <EventsListClient
                events={mock_events}
                locale={locale}
                role={session.user.role}
                search_placeholder={t("search_placeholder")}
                all_categories={t("all_categories")}
                no_results={t("no_results")}
                view_details={t("view_details")}
                rsvps={t("rsvps")}
            />
        </div>
    );
}
