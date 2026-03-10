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

    const is_auth_route = normalizedPathname.startsWith("/auth");

    // Auth route protection handling first
    if (!req.auth && !is_auth_route) {
        const url = new URL("/auth/login", req.nextUrl.origin);
        return NextResponse.redirect(url);
    }

    if (req.auth && is_auth_route) {
        const url = new URL("/", req.nextUrl.origin);
        return NextResponse.redirect(url);
    }

    // Role-based protection
    if (req.auth) {
        const role = req.auth.user?.role;
        const is_admin_route = normalizedPathname.startsWith("/admin");
        const is_provider_route = normalizedPathname.startsWith("/provider");

        if (is_admin_route && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.nextUrl.origin));
        }

        if (is_provider_route && role !== "PROVIDER" && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/", req.nextUrl.origin));
        }
    }

    // Pass to i18n middleware for prefixing and negotiation
    const response = handleI18nRouting(req);

    // If user is authenticated, force their preferred language cookie
    // Next-intl middleware will read this NEXT_LOCALE cookie to set the active language
    if (req.auth?.user?.language_pref) {
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
