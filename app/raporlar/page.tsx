import type { Metadata } from "next";
import ReportsClient from "@/components/ReportsClient";
import { getDashboardStats } from "@/lib/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Raporlar — Akınoğlu Tarım",
  description: "Günlük hasılat ve açık müşteri hesapları raporları",
};

export default async function ReportsPage() {
  const stats = await getDashboardStats();
  return <ReportsClient initialStats={stats} />;
}
