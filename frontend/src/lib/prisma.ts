import { PrismaClient } from "@prisma/client";

// PROTOTYPE MODE: tanpa backend/DB — Prisma dinonaktifkan agar tidak crash.
const IS_PROTOTYPE_MODE = process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma: PrismaClient | null = IS_PROTOTYPE_MODE
  ? null
  : (globalForPrisma.prisma ?? new PrismaClient());

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma as PrismaClient;

