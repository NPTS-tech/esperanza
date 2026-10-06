import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// Prisma 7 uses a driver adapter (no native query engine). libsql opens the
// SQLite file at DATABASE_URL — e.g. file:./prisma/dev.db locally or
// file:/efs/prod.db on NPTS infra. libsql ships prebuilt native binaries per
// platform (no node-gyp build step), which keeps pnpm installs reproducible.
const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaLibSql({ url });

// prevent multiple prisma clients during hot-reload in dev
const global_for_prisma = globalThis as unknown as { prisma: PrismaClient };

export const db = global_for_prisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
    global_for_prisma.prisma = db;
}
