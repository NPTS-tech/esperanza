import { defineConfig } from "prisma/config";

// Prisma 7 moves the Migrate connection URL out of schema.prisma into here.
// The runtime client uses the better-sqlite3 driver adapter (see src/lib/db.ts).
// Local dev falls back to a file DB; prod/stage set DATABASE_URL (e.g.
// file:/efs/prod.db) in the environment.
export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "tsx prisma/seed.ts",
    },
    datasource: {
        url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
    },
});
