"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, set_email] = useState("");
    const [password, set_password] = useState("");
    const [error, set_error] = useState("");
    const [loading, set_loading] = useState(false);

    async function handle_submit(e: React.FormEvent) {
        e.preventDefault();
        set_error("");
        set_loading(true);

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        set_loading(false);

        if (result?.error) {
            set_error("Invalid email or password");
            return;
        }

        router.push("/");
        router.refresh();
    }

    return (
        <div className="max-w-md mx-auto mt-12 px-4">
            <div className="text-center mb-8">
                <span className="text-5xl">🌿</span>
                <h1 className="text-2xl font-bold text-slate-900 mt-3">Welcome Back</h1>
                <p className="text-slate-500 text-sm mt-1">Sign in to your Esperanza account</p>
            </div>

            <div className="card p-6">
                <form onSubmit={handle_submit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => set_email(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
                        <input
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => set_password(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-500">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/register" className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
