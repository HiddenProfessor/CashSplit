import path from "node:path";

import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function resolveDatabaseUrl() {
  const raw = process.env.DATABASE_URL ?? "file:./data/cashsplit.db";
  const match = raw.match(/^file:(.+)$/);
  if (!match) return raw;
  const filePath = match[1]!;
  if (path.isAbsolute(filePath)) return raw;
  // Resolve relative to project root (cwd), not the prisma directory
  return `file:${path.resolve(/* turbopackIgnore: true */ process.cwd(), filePath)}`;
}

function buildPrismaClient() {
  const adapter = new PrismaLibSQL({
    url: resolveDatabaseUrl(),
    encryptionKey: process.env.ENCRYPTION_KEY || undefined,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}