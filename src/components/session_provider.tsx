"use client";

// Better Auth's useSession() reads state from its own store and needs no provider.
// Kept as a passthrough so the root layout import stays unchanged.
export default function AuthSessionProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
