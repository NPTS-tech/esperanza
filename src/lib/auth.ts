import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { db } from "@/lib/db";

export const auth = betterAuth({
    // Falls back to the request origin if unset; set BETTER_AUTH_URL in prod
    // (e.g. https://esperanza.npts.tech) so callbacks/redirects are correct.
    baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    secret: process.env.BETTER_AUTH_SECRET ?? process.env.AUTH_SECRET,
    database: prismaAdapter(db, { provider: "sqlite" }),
    emailAndPassword: {
        enabled: true,
    },
    // App-specific columns kept on the Better Auth user table. `role` is not
    // user-settable at signup (input: false) — it's assigned server-side.
    user: {
        // Keep the app's snake_case created_at column name.
        fields: { createdAt: "created_at" },
        additionalFields: {
            username: { type: "string", required: false, input: true },
            role: { type: "string", required: false, defaultValue: "USER", input: false },
            language_pref: { type: "string", required: false, defaultValue: "en", input: true },
            share_with_providers: { type: "boolean", required: false, defaultValue: true, input: true },
            consented_at: { type: "date", required: false, input: true },
        },
    },
    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        // Cache the session (incl. role) in a signed cookie so edge middleware can
        // do role checks without a DB round-trip. See src/middleware.ts.
        cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    plugins: [nextCookies()], // must be last
});

export type AppSession = {
    user: {
        id: string;
        username: string | null;
        email: string;
        role: string;
        language_pref: string;
    };
} | null;

type BAUser = {
    id: string;
    email: string;
    username?: string | null;
    role?: string | null;
    language_pref?: string | null;
};

// NextAuth-compatible session accessor so existing server call sites keep working.
export async function getSession(): Promise<AppSession> {
    const result = await auth.api.getSession({ headers: await headers() });
    if (!result?.user) return null;
    const u = result.user as BAUser;
    return {
        user: {
            id: u.id,
            username: u.username ?? null,
            email: u.email,
            role: u.role ?? "USER",
            language_pref: u.language_pref ?? "en",
        },
    };
}

// Role authorization for server components (middleware only checks auth presence).
// Redirects to login if unauthenticated, or /unauthorized if the role is wrong.
export async function requireRole(allowed: string[]): Promise<NonNullable<AppSession>> {
    const session = await getSession();
    const locale = await getLocale();
    if (!session) redirect(`/${locale}/auth/login`);
    if (!allowed.includes(session.user.role)) redirect(`/${locale}/unauthorized`);
    return session;
}
