import { getSession } from "@/lib/auth";
import { redirect } from "@/i18n/routing";
import { getLocale, getTranslations } from "next-intl/server";
import { ProfileClient } from "./profile_client";
import { SignOutButton } from "./sign_out_button";
import { ProviderSettings } from "../provider/settings/provider_settings";

export default async function ProfilePage() {
    const [session, locale, t, nav_t, ps_t] = await Promise.all([
        getSession(),
        getLocale(),
        getTranslations("Profile"),
        getTranslations("Nav"),
        getTranslations("ProviderSettings"),
    ]);

    if (!session?.user) {
        redirect({ href: "/auth/login", locale });
        return null;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("heading")}
                </h1>
                <SignOutButton label={nav_t("sign_out")} />
            </div>
            <ProfileClient
                vapid_public_key={process.env.VAPID_PUBLIC_KEY ?? null}
                org_section={
                    session.user.role === "PROVIDER" ? (
                        <ProviderSettings
                            provider_id={session.user.id}
                            title={ps_t("heading")}
                            subtitle={ps_t("subtitle")}
                            label_org_name={ps_t("org_name")}
                            placeholder_org_name={ps_t("org_name_placeholder")}
                            label_bio={ps_t("bio")}
                            placeholder_bio={ps_t("bio_placeholder")}
                            label_logo_url={ps_t("logo_url")}
                            placeholder_logo_url={ps_t("logo_url_placeholder")}
                            label_website_url={ps_t("website_url")}
                            placeholder_website_url={ps_t("website_url_placeholder")}
                            label_contact_email={ps_t("contact_email")}
                            placeholder_contact_email={ps_t("contact_email_placeholder")}
                            label_contact_phone={ps_t("contact_phone")}
                            placeholder_contact_phone={ps_t("contact_phone_placeholder")}
                            label_programs={ps_t("programs")}
                            help_programs={ps_t("programs_help")}
                            msg_programs_unavailable={ps_t("programs_unavailable")}
                            label_beneficiaries={ps_t("beneficiaries")}
                            placeholder_beneficiaries={ps_t("beneficiaries_placeholder")}
                            label_save={ps_t("save")}
                            label_saving={ps_t("saving")}
                            msg_saved={ps_t("saved")}
                            msg_error_saving={ps_t("error_saving")}
                            msg_error_loading={ps_t("error_loading")}
                            label_view_public={ps_t("view_public_profile")}
                            label_back={ps_t("back")}
                        />
                    ) : undefined
                }
            />
        </div>
    );
}
