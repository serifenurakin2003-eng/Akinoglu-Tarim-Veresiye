import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

// Transaction mode (port 6543) bağlantısı — session limit yok
// DIRECT_URL sadece migration için, app sorgularında DATABASE_URL kullan
const connectionString =
  process.env.DATABASE_URL || process.env.DIRECT_URL || "";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPool() {
  const p = new Pool({
    connectionString,
    ssl:
      process.env.NODE_ENV === "production" ||
      connectionString.includes("supabase.com")
        ? { rejectUnauthorized: false }
        : undefined,
    max: 3,                          // Supabase transaction pool için yeterli
    idleTimeoutMillis: 10_000,       // 10sn boşta kalırsa bağlantıyı kapat
    connectionTimeoutMillis: 15_000, // 15sn içinde bağlanamazsa hata ver
    // keepAlive: KAPALI — transaction mode'da her sorgu yeni connection alır
  });

  // Kopan bağlantı hatalarını yakala — process'i çökertme
  p.on("error", (err) => {
    console.error("[pg pool] idle client error:", err.message);
  });

  return p;
}

const pool = globalForPrisma.pool ?? createPool();

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

export default prisma;
