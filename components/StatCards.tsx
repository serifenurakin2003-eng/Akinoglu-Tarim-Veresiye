"use client";

import { Calendar, Scale, Sprout, Wheat } from "lucide-react";

interface StatCardsProps {
  stats: {
    toplamBorc: number;
    kalanAlacak: number;
    toplamMusteriSayisi: number;
    borcluMusteriSayisi: number;
  };
  selectedDate: string;
  selectedRevenue: number;
  selectedCount: number;
  todayStr: string;
  onSelectDate: (date: string) => void;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTurkish(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  }).format(date);
}

export default function StatCards({
  stats,
  selectedDate,
  selectedRevenue,
  selectedCount,
  todayStr,
  onSelectDate,
}: StatCardsProps) {
  const isToday = selectedDate === todayStr;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(yesterday);

  const metrics = [
    {
      label: "Kalan net alacak",
      value: formatCurrency(stats.kalanAlacak),
      detail: "Tahsil edilmeyi bekleyen bakiye",
      icon: Scale,
      color: "text-[#2D4C3A]",
    },
    {
      label: "Toplam verilen borç",
      value: formatCurrency(stats.toplamBorc),
      detail: "Vadeli satışların toplamı",
      icon: Wheat,
      color: "text-[#8D5B28]",
    },
    {
      label: isToday ? "Günün hasılatı" : "Seçilen gün hasılatı",
      value: formatCurrency(selectedRevenue),
      detail: `${selectedCount} tahsilat işlemi`,
      icon: Sprout,
      color: "text-[#2D4C3A]",
    },
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-[#E5E0D8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D8] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
          <Calendar className="h-4 w-4 text-[#2D4C3A]" />
          <span>Hasılat tarihi</span>
          <span className="text-[#6B7280]">{isToday ? "Bugün" : formatDateTurkish(selectedDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => onSelectDate(todayStr)}
            className={`rounded-full px-3 py-1.5 font-semibold transition ${isToday ? "bg-[#2D4C3A] text-white" : "border border-[#D1D5DB] bg-white text-[#4B5563] hover:bg-[#FAF8F5]"}`}
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(yesterdayStr)}
            className={`rounded-full px-3 py-1.5 font-semibold transition ${selectedDate === yesterdayStr ? "bg-[#2D4C3A] text-white" : "border border-[#D1D5DB] bg-white text-[#4B5563] hover:bg-[#FAF8F5]"}`}
          >
            Dün
          </button>
          <input
            aria-label="Hasılat tarihi seç"
            type="date"
            value={selectedDate}
            onChange={(event) => {
              if (event.target.value) onSelectDate(event.target.value);
            }}
            className="rounded-full border border-[#D1D5DB] bg-white px-3 py-1.5 font-semibold text-xs text-[#1F2937] focus:border-[#2D4C3A] focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-y divide-[#E5E0D8] sm:grid-cols-3 sm:divide-y-0">
        {metrics.map(({ label, value, detail, icon: Icon, color }) => (
          <div key={label} className="min-w-0 px-4 py-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
              <Icon className="h-3.5 w-3.5 shrink-0 text-[#8D5B28]" />
              <span className="truncate">{label}</span>
            </div>
            <p className={`mt-1.5 truncate text-xl font-extrabold tabular-nums ${color}`} title={value}>
              {value}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#6B7280]" title={detail}>
              {detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
