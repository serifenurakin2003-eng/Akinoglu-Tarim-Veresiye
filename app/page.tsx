import { getDashboardStats, getCustomers, getNeighborhoods, getCurrentUser } from "@/lib/actions";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

/** Bağlantı hatalarında otomatik yeniden dene (max 2 kez) */
async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    const isConnectionError =
      msg.includes("Connection terminated") ||
      msg.includes("Server has closed the connection") ||
      msg.includes("ConnectionClosed") ||
      msg.includes("ECONNRESET") ||
      msg.includes("ETIMEDOUT") ||
      msg.includes("Connection refused") ||
      msg.includes("P1017") ||
      msg.includes("P2024") ||
      msg.includes("P2010");

    if (retries > 0 && isConnectionError) {
      // Kısa bekleme sonrası tekrar dene
      await new Promise((r) => setTimeout(r, 500));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

export default async function Home() {
  const [stats, customers, neighborhoods, currentUser] = await withRetry(() =>
    Promise.all([
      getDashboardStats(),
      getCustomers(),
      getNeighborhoods(),
      getCurrentUser(),
    ])
  );

  return (
    <DashboardClient
      initialStats={stats}
      initialCustomers={customers}
      neighborhoods={neighborhoods}
      currentUser={currentUser}
    />
  );
}
