import { ShieldX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function UnauthorizedPage() {
    const t = await getTranslations("Unauthorized");

    return (
        <div
            className="max-w-md mx-auto px-4 py-16 text-center"
            role="alert"
            aria-live="polite"
        >
            <ShieldX
                size={64}
                className="mx-auto mb-4"
                style={{ color: "var(--color-danger)" }}
                aria-hidden
            />
            <h1
                className="text-2xl font-bold mb-3"
                style={{ color: "var(--color-text)" }}
            >
                {t("title")}
            </h1>
            <p
                className="text-sm mb-6"
                style={{ color: "var(--color-text-secondary)" }}
            >
                {t("message")}
            </p>
            <Link
                href="/"
                className="btn btn-primary no-underline inline-block"
            >
                {t("go_home")}
            </Link>
        </div>
    );
}
