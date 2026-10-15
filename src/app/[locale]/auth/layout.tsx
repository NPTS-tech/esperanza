import { Sprout } from "lucide-react";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSession } from "@/lib/auth";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    // Signed-in users skip the auth pages. Checked against the real session, not just
    // cookie presence: a stale cookie used to bounce between here and / forever.
    if (await getSession()) redirect(`/${await getLocale()}`);

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
            style={{ background: "var(--color-bg)" }}
        >
            {/* Branding */}
            <div className="flex flex-col items-center mb-8">
                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
                    style={{ background: "var(--color-primary)" }}
                >
                    <Sprout size={28} color="white" />
                </div>
                <span
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: "var(--color-primary)" }}
                >
                    Esperanza
                </span>
                <span
                    className="text-sm mt-1"
                    style={{ color: "var(--color-text-secondary)" }}
                >
                    Community Services Portal
                </span>
            </div>

            {/* Page content */}
            <main className="w-full max-w-md">{children}</main>

            {/* Footer */}
            <footer className="mt-10 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            © 2026 Esperanza Community Services
            </footer>
        </div>
    );
}
