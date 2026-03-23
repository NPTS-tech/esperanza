import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import { ProfileClient } from "./profile_client";

export default async function ProfilePage() {
    const session = (await auth())!;

    const t = await getTranslations("Profile");

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                    {t("heading")}
                </h1>
            </div>
            <ProfileClient
                email={session.user.email ?? ""}
                role={session.user.role}
                language_pref={session.user.language_pref ?? "en"}
                label_email={t("email")}
                label_role={t("role")}
                label_language={t("language_pref")}
                label_lang_en={t("lang_english")}
                label_lang_es={t("lang_spanish")}
                label_change_password={t("change_password")}
                label_current_password={t("current_password")}
                label_new_password={t("new_password")}
                label_confirm_password={t("confirm_new_password")}
                label_save={t("save")}
                label_cancel={t("cancel")}
                msg_password_updated={t("password_updated")}
                msg_password_error={t("password_error")}
                msg_language_updated={t("language_updated")}
                msg_language_error={t("language_error")}
                label_rsvp_history={t("rsvp_history")}
                label_no_rsvps={t("no_rsvps")}
            />
        </div>
    );
}
