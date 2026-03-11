import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { login_schema } from "@/lib/validators/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/auth/login",
    },
    providers: [
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            async authorize(credentials) {
                const parsed = login_schema.safeParse(credentials);
                if (!parsed.success) return null;

                const user = await db.user.findUnique({
                    where: { email: parsed.data.email },
                });

                if (!user) return null;

                const password_valid = await bcrypt.compare(
                    parsed.data.password,
                    user.password_hash,
                );

                if (!password_valid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    language_pref: user.language_pref,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            // on initial sign-in, add role and language to the token
            if (user) {
                token.id = user.id as string;
                token.role = user.role;
                token.language_pref = user.language_pref;
            }
            return token;
        },
        async session({ session, token }) {
            // expose role and id on the client-side session
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.language_pref = token.language_pref;
            }
            return session;
        },
    },
});
