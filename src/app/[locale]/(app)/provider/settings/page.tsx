import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { ProviderSettings } from "./provider_settings";

export default async function ProviderSettingsPage() {
    const session = (await auth())!;
    const t = await getTranslations("ProviderSettings");

    return (
        <div className="max-w-2xl mx-auto">
            <Link
                href="/"
                className="inline-block text-sm mb-4"
                style={{ color: "var(--color-text-secondary)" }}
            >
                {t("back")}
            </Link>

            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("heading")}
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("subtitle")}
                </p>
            </div>

            <ProviderSettings
                provider_id={session.user.id ?? ""}
                label_org_name={t("org_name")}
                placeholder_org_name={t("org_name_placeholder")}
                label_bio={t("bio")}
                placeholder_bio={t("bio_placeholder")}
                label_logo_url={t("logo_url")}
                placeholder_logo_url={t("logo_url_placeholder")}
                label_website_url={t("website_url")}
                placeholder_website_url={t("website_url_placeholder")}
                label_contact_email={t("contact_email")}
                placeholder_contact_email={t("contact_email_placeholder")}
                label_contact_phone={t("contact_phone")}
                placeholder_contact_phone={t("contact_phone_placeholder")}
                label_save={t("save")}
                label_saving={t("saving")}
                msg_saved={t("saved")}
                msg_error_saving={t("error_saving")}
                msg_error_loading={t("error_loading")}
                label_view_public={t("view_public_profile")}
                label_back={t("back")}
            />
        </div>
    );
}
