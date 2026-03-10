import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// routes that don't require authentication
const public_routes = [
    "/auth/login",
    "/auth/register",
    "/api/auth",
];

// routes restricted to admin role
const admin_routes = ["/admin"];

// routes restricted to provider or admin role
const provider_routes = ["/provider"];

export default auth((req) => {
    const { pathname } = req.nextUrl;

    // allow public routes
    const is_public = public_routes.some((route) => pathname.startsWith(route));
    if (is_public) return NextResponse.next();

    // allow static files and internal next.js routes
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // redirect unauthenticated users to login
    if (!req.auth) {
        const login_url = new URL("/auth/login", req.nextUrl.origin);
        login_url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(login_url);
    }

    const user_role = req.auth.user?.role;

    // admin route protection
    const is_admin_route = admin_routes.some((route) => pathname.startsWith(route));
    if (is_admin_route && user_role !== "ADMIN") {
        return NextResponse.json(
            { error: "Forbidden: Admin access required" },
            { status: 403 },
        );
    }

    // provider route protection
    const is_provider_route = provider_routes.some((route) => pathname.startsWith(route));
    if (is_provider_route && user_role !== "PROVIDER" && user_role !== "ADMIN") {
        return NextResponse.json(
            { error: "Forbidden: Provider access required" },
            { status: 403 },
        );
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // match all routes except static files
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
