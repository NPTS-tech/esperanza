import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface User extends DefaultUser {
        username: string | null;
        role: string;
        language_pref: string;
    }

    interface Session {
        user: {
            id: string;
            username: string | null;
            email: string;
            role: string;
            language_pref: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        username: string | null;
        role: string;
        language_pref: string;
    }
}
