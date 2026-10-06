"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
    plugins: [inferAdditionalFields<typeof auth>()],
});

export const { signIn, signOut, signUp } = authClient;

// Wrap Better Auth's useSession to also expose a NextAuth-style `status`
// ("loading" | "authenticated" | "unauthenticated") used by a few pages.
export function useSession() {
    const result = authClient.useSession();
    const status = result.isPending
        ? "loading"
        : result.data
          ? "authenticated"
          : "unauthenticated";
    return { ...result, status };
}
