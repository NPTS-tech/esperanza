"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
    const [email, set_email] = useState("");
    const [password, set_password] = useState("");

    function handle_submit(e: React.FormEvent) {
        e.preventDefault();
        alert(`Mock login: ${email}`);
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="text-center mb-8">
                <span className="text-5xl">🌿</span>
                <h1 className="text-2xl font-bold text-slate-900 mt-3">Welcome Back</h1>
                <p className="text-slate-500 text-sm mt-1">Sign in to your Esperanza account</p>
            </div>

            <div className="card p-6">
                <form onSubmit={handle_submit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => set_email(e.target.value)}
                            required
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
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">
                        Sign In
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <p className="text-sm text-slate-500">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
