"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RecentActivities from "@/components/RecentActivities";
import StatCards from "@/components/StatCards";
import type { DashboardStats } from "@/lib/actions";
import { getDailyCollections } from "@/lib/actions";

export default function ReportsClient({
  initialStats,
}: {
  initialStats: DashboardStats;
}) {
  const todayStr =
    initialStats.bugunTarih ||
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [customDailyData, setCustomDailyData] = useState<
    Record<string, { revenue: number; count: number }>
  >({});

  const { selectedRevenue, selectedCount } = useMemo(() => {
    const custom = customDailyData[selectedDate];
    if (custom) {
      return { selectedRevenue: custom.revenue, selectedCount: custom.count };
    }

    const daily = initialStats.gunlukHasilatGecmisi.find(
      (item) => item.tarih === selectedDate
    );
    if (daily) {
      return {
        selectedRevenue: daily.toplamHasilat,
        selectedCount: daily.islemSayisi,
      };
    }

    if (selectedDate === todayStr) {
      return {
        selectedRevenue: initialStats.bugunHasilat,
        selectedCount: initialStats.bugunIslemSayisi,
      };
    }
    return { selectedRevenue: 0, selectedCount: 0 };
  }, [customDailyData, initialStats, selectedDate, todayStr]);

  useEffect(() => {
    const existsInInitialData = initialStats.gunlukHasilatGecmisi.some(
      (item) => item.tarih === selectedDate
    );
    if (
      existsInInitialData ||
      selectedDate === todayStr ||
      customDailyData[selectedDate]
    ) {
      return;
    }

    getDailyCollections(selectedDate)
      .then((items) => {
        const revenue = items.reduce((sum, item) => sum + item.odenen_tutar, 0);
        setCustomDailyData((previous) => ({
          ...previous,
          [selectedDate]: { revenue, count: items.length },
        }));
      })
      .catch(() => {});
  }, [customDailyData, initialStats.gunlukHasilatGecmisi, selectedDate, todayStr]);

  return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1F2922]">
        <header className="border-b border-[#E5E0D8] bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-xl font-bold text-[#2D4C3A]">Raporlar</h1>
              <p className="text-xs text-[#6B776D]">Günlük kasa ve açık müşteri hesapları</p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-semibold text-[#2D4C3A] hover:bg-[#F4EFEA]"
            >
              Ana Sayfa
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
          <StatCards
            stats={initialStats}
            selectedDate={selectedDate}
            selectedRevenue={selectedRevenue}
            selectedCount={selectedCount}
            todayStr={todayStr}
            onSelectDate={setSelectedDate}
          />
          <RecentActivities
            dailyRevenues={initialStats.gunlukHasilatGecmisi}
            selectedDate={selectedDate}
            selectedRevenue={selectedRevenue}
            selectedCount={selectedCount}
            todayStr={todayStr}
            onSelectDate={setSelectedDate}
            enCokBorclular={initialStats.enCokBorclular}
          />
        </main>
      </div>
  );
}
