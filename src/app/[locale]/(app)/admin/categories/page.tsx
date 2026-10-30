import { requireRole } from "@/lib/auth";
import { Tags as TagsIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AdminCategoriesDashboard } from "../admin_categories_dashboard";

export default async function AdminCategoriesPage() {
    const session = await requireRole(["ADMIN"]);

    const t_admin = await getTranslations("Admin");
    const t_dashboard = await getTranslations("Dashboard");

    return (
        <div className="max-w-6xl mx-auto pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <TagsIcon size={48} style={{ color: "var(--color-primary)" }} />
                    <div>
                        <h1
                            className="text-2xl font-bold"
                            style={{ color: "var(--color-text)" }}
                        >
                            {t_admin("categories_title")}
                        </h1>
                        <p
                            className="text-sm"
                            style={{ color: "var(--color-text-secondary)" }}
                        >
                            {t_admin("categories_subtitle")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <p
                        className="text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                    >
                        {t_dashboard("signed_in_as")}{" "}
                        <span
                            className="font-medium"
                            style={{ color: "var(--color-text)" }}
                        >
                            {session.user.email}
                        </span>
                    </p>
                </div>
            </div>

            <AdminCategoriesDashboard
                title={t_admin("categories_title")}
                subtitle={t_admin("categories_subtitle")}
                total_categories={t_admin("total_categories")}
                create_category={t_admin("create_category")}
                name_en_label={t_admin("name_en_label")}
                name_es_label={t_admin("name_es_label")}
                emoji_label={t_admin("emoji_label")}
                color_label={t_admin("color_label")}
                slug_label={t_admin("slug_label")}
                slug_hint={t_admin("slug_hint")}
                creating={t_admin("creating")}
                create={t_admin("create")}
                create_success={t_admin("category_create_success")}
                create_error={t_admin("category_create_error")}
                delete_category={t_admin("delete")}
                delete_category_confirm={t_admin("category_delete_confirm")}
                delete_category_success={t_admin("category_delete_success")}
                delete_category_error={t_admin("category_delete_error")}
                deleting={t_admin("deleting")}
                loading_categories={t_admin("loading_categories")}
                error_loading_categories={t_admin("error_loading_categories")}
                retry={t_admin("retry")}
                events_count={t_admin("events_count")}
                default_category_hint={t_admin("default_category_hint")}
                actions={t_admin("actions")}
            />
        </div>
    );
}
