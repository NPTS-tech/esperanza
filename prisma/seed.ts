import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

const seed_accounts = [
    {
        email: "admin@esperanza.app",
        password: "admin123",
        role: "ADMIN" as const,
        language_pref: "en",
    },
    {
        email: "provider@esperanza.app",
        password: "provider123",
        role: "PROVIDER" as const,
        language_pref: "en",
    },
    {
        email: "user@esperanza.app",
        password: "user123",
        role: "USER" as const,
        language_pref: "en",
    },
];

async function main() {
    console.log("\n🌿 Esperanza — Seeding database...\n");

    for (const account of seed_accounts) {
        const existing = await db.user.findUnique({
            where: { email: account.email },
        });

        if (existing) {
            console.log(`   ⏭️  ${account.role.padEnd(8)} ${account.email} (already exists)`);
            continue;
        }

        const password_hash = await bcrypt.hash(account.password, 12);

        await db.user.create({
            data: {
                email: account.email,
                password_hash,
                role: account.role,
                language_pref: account.language_pref,
                consented_at: new Date(),
            },
        });

        console.log(`   ✅ ${account.role.padEnd(8)} ${account.email}`);
    }

    console.log("\n   ─────────────────────────────────────");
    console.log("   Dev credentials:");
    console.log("   ─────────────────────────────────────");
    for (const account of seed_accounts) {
        console.log(`   ${account.role.padEnd(8)} ${account.email} / ${account.password}`);
    }
    console.log("   ─────────────────────────────────────\n");
}

main()
    .catch((e) => {
        console.error("Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
