import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function AdminPage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/login");
    }

    if (session.user.role !== "ADMIN") {
        redirect("/");
    }

    const t = await getTranslations("Dashboard");

    return (
        <div className="max-w-2xl mx-auto mt-12 px-4">
            <div className="text-center mb-8">
                <Shield size={48} className="mx-auto" style={{ color: "var(--color-primary)" }} />
                <h1 className="text-2xl font-bold mt-3" style={{ color: "var(--color-text)" }}>
                    {t("admin_title")}
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    {t("admin_subtitle")}
                </p>
            </div>

            <div className="card p-6">
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {t("signed_in_as")} <span className="font-medium" style={{ color: "var(--color-text)" }}>{session.user.email}</span>
                </p>
                <form
                    action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/auth/login" });
                    }}
                    className="mt-4"
                >
                    <button type="submit" className="btn btn-secondary">
                        {t("sign_out")}
                    </button>
                </form>
            </div>
        </div>
    );
}
