import { PrismaClient } from "@prisma/client";

// prevent multiple prisma clients during hot-reload in dev
const global_for_prisma = globalThis as unknown as { prisma: PrismaClient };

export const db = global_for_prisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    global_for_prisma.prisma = db;
}
