import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// PROTOTYPE MODE: tanpa backend/DB — Prisma dinonaktifkan agar tidak crash.
const IS_PROTOTYPE_MODE = process.env.NEXT_PUBLIC_PROTOTYPE_MODE === "true";
const connectionString = process.env.DATABASE_URL;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prismaInstance: PrismaClient | null = null;

if (!IS_PROTOTYPE_MODE && connectionString) {
  const pool = new Pool({
    connectionString,
  });
  const adapter = new PrismaPg(pool);

  prismaInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      adapter,
      log: ["error"],
    });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaInstance;
}

export const prisma = prismaInstance as unknown as PrismaClient;

