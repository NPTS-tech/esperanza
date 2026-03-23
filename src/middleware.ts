import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

export default auth((req) => {
    // Strip locale from the pathname for reliable route matching
    const pathname = req.nextUrl.pathname;
    const pathWithoutLocale = pathname.replace(
        new RegExp(`^/(${routing.locales.join('|')})/?`),
        '/'
    );
    // Ensure leading slash if empty string
    const normalizedPathname = pathWithoutLocale.startsWith('/') ? pathWithoutLocale : `/${pathWithoutLocale}`;
    const locale = routing.locales.includes(pathname.split("/")[1] as "en" | "es") ? pathname.split("/")[1] : routing.defaultLocale;

    const is_auth_route = normalizedPathname.startsWith("/auth");

    // Auth route protection handling first — redirect to locale-aware public auth page
    if (!req.auth && !is_auth_route) {
        const url = new URL(`/${locale}/auth/login`, req.nextUrl.origin);
        const response = NextResponse.redirect(url);
        // nuke all stale auth cookies to prevent redirect loops and CSRF mismatches
        const stale_cookies = [
            "authjs.session-token",
            "__Secure-authjs.session-token",
            "next-auth.session-token",
            "__Secure-next-auth.session-token",
            "authjs.csrf-token",
            "__Host-authjs.csrf-token",
            "next-auth.csrf-token",
            "__Host-next-auth.csrf-token",
            "authjs.callback-url",
            "__Secure-authjs.callback-url",
            "next-auth.callback-url",
            "__Secure-next-auth.callback-url",
        ];
        for (const name of stale_cookies) {
            response.cookies.delete(name);
        }
        return response;
    }

    if (req.auth && is_auth_route) {
        const url = new URL(`/${locale}`, req.nextUrl.origin);
        return NextResponse.redirect(url);
    }

    // Role-based protection — redirect to locale-aware unauthorized page
    if (req.auth) {
        const role = req.auth.user?.role;
        const is_admin_route = normalizedPathname.startsWith("/admin");
        const is_provider_route = normalizedPathname.startsWith("/provider");

        if (is_admin_route && role !== "ADMIN") {
            return NextResponse.redirect(new URL(`/${locale}/unauthorized`, req.nextUrl.origin));
        }

        if (is_provider_route && role !== "PROVIDER" && role !== "ADMIN") {
            return NextResponse.redirect(new URL(`/${locale}/unauthorized`, req.nextUrl.origin));
        }
    }

    // Pass to i18n middleware for prefixing and negotiation
    const response = handleI18nRouting(req);

    // If user is authenticated, set preferred language cookie from session.
    // Skip if request already has NEXT_LOCALE (e.g. user just changed language in profile).
    const existingLocale = req.cookies.get("NEXT_LOCALE")?.value;
    if (req.auth?.user?.language_pref && !existingLocale) {
        response.cookies.set("NEXT_LOCALE", req.auth.user.language_pref, {
            path: '/',
            sameSite: 'lax',
        });
    }

    return response;
});

export const config = {
    // Match only internationalized pathnames, skipping API routes, _next, and static files
    matcher: ['/', '/(es|en)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};
