import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { Home } from "lucide-react";

export default async function HomePage() {
    const session = await auth();

    if (!session) {
        redirect("/auth/login");
    }

    // redirect to role-specific dashboard
    if (session.user.role === "ADMIN") {
        redirect("/admin");
    }
    if (session.user.role === "PROVIDER") {
        redirect("/provider");
    }

    return (
        <div className="max-w-2xl mx-auto mt-12 px-4">
            <div className="text-center mb-8">
                <Home size={48} className="mx-auto" style={{ color: "var(--color-primary)" }} />
                <h1 className="text-2xl font-bold mt-3" style={{ color: "var(--color-text)" }}>
                    Esperanza
                </h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                    Community Services Portal
                </p>
            </div>

            <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--color-text)" }}>
                    Welcome back!
                </h2>
                <div className="space-y-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <p>
                        <span className="font-medium" style={{ color: "var(--color-text)" }}>Email:</span> {session.user.email}
                    </p>
                    <p>
                        <span className="font-medium" style={{ color: "var(--color-text)" }}>Language:</span>{" "}
                        {session.user.language_pref === "es" ? "Español" : "English"}
                    </p>
                </div>
                <form
                    action={async () => {
                        "use server";
                        await signOut({ redirectTo: "/auth/login" });
                    }}
                    className="mt-6"
                >
                    <button type="submit" className="btn btn-secondary">
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    );
}
