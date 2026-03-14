import { getTranslations, getLocale } from "next-intl/server";
import { MapPageClient } from "./map_page";

export default async function MapPage() {

    const locale = (await getLocale()) as "en" | "es";
    const t = await getTranslations("Map");
    const t_events = await getTranslations("Events");

    // Events will be fetched client-side
    const events: any[] = [];

    return (
        <div className="max-w-full">
            <div className="mb-4">
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("heading")}
                </h1>
            </div>
            <MapPageClient
                events={events}
                locale={locale}
                sidebar_count_label={t("sidebar_count")}
                placeholder_title={t("placeholder_title")}
                placeholder_subtitle={t("placeholder_subtitle")}
                placeholder_area={t("placeholder_area")}
                filter_all={t("filter_all")}
                view_details={t_events("view_details")}
            />
        </div>
    );
}
