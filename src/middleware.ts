import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

// Edge-safe: getSessionCookie only inspects the cookie (no DB, no Prisma import).
// This is an optimistic presence check — actual auth + role authorization are
// enforced server-side in getSession() and the admin/provider page guards.
export default function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const locale = routing.locales.includes(pathname.split("/")[1] as "en" | "es")
        ? pathname.split("/")[1]
        : routing.defaultLocale;

    const pathWithoutLocale = pathname.replace(
        new RegExp(`^/(${routing.locales.join("|")})/?`),
        "/",
    );
    const normalizedPathname = pathWithoutLocale.startsWith("/")
        ? pathWithoutLocale
        : `/${pathWithoutLocale}`;

    const is_auth_route = normalizedPathname.startsWith("/auth");
    const has_session = Boolean(getSessionCookie(req));

    if (!has_session && !is_auth_route) {
        const login_url = new URL(`/${locale}/auth/login`, req.nextUrl.origin);
        // Preserve the destination so post-login redirects return the user to
        // where they were headed (e.g. a QR check-in link scanned before
        // signing in). Only relative, app-internal paths are forwarded.
        const destination = req.nextUrl.pathname + req.nextUrl.search;
        if (
            destination.startsWith("/") &&
            !destination.startsWith("//") &&
            !destination.startsWith("/api")
        ) {
            login_url.searchParams.set("next", destination);
        }
        return NextResponse.redirect(login_url);
    }

    return handleI18nRouting(req);
}

export const config = {
    // Match only internationalized pathnames, skipping API routes, _next, and static files
    matcher: ["/", "/(es|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
