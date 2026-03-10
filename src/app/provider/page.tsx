import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Briefcase } from "lucide-react";

export default async function ProviderPage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/login");
    }

    if (session.user.role !== "PROVIDER" && session.user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="max-w-2xl mx-auto mt-12 px-4">
            <div className="text-center mb-8">
                <Briefcase size={48} className="mx-auto" style={{ color: "var(--color-secondary)" }} />
                <h1 className="text-2xl font-bold mt-3" style={{ color: "var(--color-text)" }}>
                    Provider Dashboard
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    Manage your events and services
                </p>
            </div>

            <div className="card p-6">
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    Signed in as <span className="font-medium" style={{ color: "var(--color-text)" }}>{session.user.email}</span>
                </p>
                <form
                    action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/auth/login" });
                    }}
                    className="mt-4"
                >
                    <button type="submit" className="btn btn-secondary">
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    );
}
