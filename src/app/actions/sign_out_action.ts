"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function sign_out_action() {
    await auth.api.signOut({ headers: await headers() });
}
