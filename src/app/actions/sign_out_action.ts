"use server";

import { signOut } from "@/lib/auth";

export async function sign_out_action() {
    await signOut({ redirect: false });
}
