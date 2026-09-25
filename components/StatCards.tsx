"use client";

import { Sprout, Wheat, Scale, Users, Calendar, ArrowRight } from "lucide-react";
import { usePrivacy } from "@/lib/privacy";

interface StatCardsProps {
  stats: {
    toplamBorc: number;
    toplamTahsilat: number;
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
  const { isPrivacyMode } = usePrivacy();
  const isToday = selectedDate === todayStr;

  // Dünün tarihi (YYYY-MM-DD)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(yesterday);

  return (
    <div className="space-y-3">
      {/* Tarih Hasılat Filtre Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2D4C3A] text-white">
            <Calendar className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#1F2937]">
              Hasılat Tarihi:{" "}
              <span className="text-[#2D4C3A] font-extrabold underline decoration-[#2D4C3A]/30">
                {isToday ? `Bugün (${formatDateTurkish(selectedDate)})` : formatDateTurkish(selectedDate)}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => onSelectDate(todayStr)}
            className={`rounded-full px-3 py-1 font-semibold transition-all ${
              isToday
                ? "bg-[#2D4C3A] text-white shadow-xs"
                : "border border-[#D1D5DB] bg-white text-[#4B5563] hover:bg-[#FAF8F5]"
            }`}
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(yesterdayStr)}
            className={`rounded-full px-3 py-1 font-semibold transition-all ${
              selectedDate === yesterdayStr
                ? "bg-[#2D4C3A] text-white shadow-xs"
                : "border border-[#D1D5DB] bg-white text-[#4B5563] hover:bg-[#FAF8F5]"
            }`}
          >
            Dün
          </button>
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) onSelectDate(e.target.value);
              }}
              className="rounded-full border border-[#D1D5DB] bg-white px-3 py-1 font-semibold text-xs text-[#1F2937] hover:border-[#2D4C3A] focus:outline-none focus:border-[#2D4C3A] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4 Ana Kart */}
      <div className="w-full rounded-2xl border border-[#E5E0D8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="grid grid-cols-1 divide-y divide-[#E5E0D8] sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
          {/* 1. Kalan Net Alacak */}
          <div className="p-6 transition-colors hover:bg-[#FAF8F5]/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                Kalan Net Alacak
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF3EB] text-[#8D5B28] border border-[#E8DCCB]">
                <Scale className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2D4C3A] tabular-nums">
                {isPrivacyMode ? "•••••• ₺" : formatCurrency(stats.kalanAlacak)}
              </div>
              <p className="mt-1 text-xs font-medium text-[#4B5563]">
                Tahsil edilmeyi bekleyen toplam bakiye
              </p>
            </div>
          </div>

          {/* 2. Toplam Verilen Borç */}
          <div className="p-6 transition-colors hover:bg-[#FAF8F5]/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                Toplam Verilen Borç
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF3EB] text-[#B88E48] border border-[#E8DCCB]">
                <Wheat className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#8D5B28] tabular-nums">
                {isPrivacyMode ? "•••••• ₺" : formatCurrency(stats.toplamBorc)}
              </div>
              <p className="mt-1 text-xs font-medium text-[#4B5563]">
                Tohum, gübre, ilaç &amp; fide vadeli satışlar
              </p>
            </div>
          </div>

          {/* 3. O Gün Alınan Hasılat (Tarih Tarih) */}
          <div className="p-6 transition-colors bg-[#FAFDFB] hover:bg-[#F2FAF4]/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2D4C3A]">
                  {isToday ? "Günün Hasılatı" : "Seçilen Gün Hasılatı"}
                </span>
                <span className="rounded-full bg-[#2D4C3A]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#2D4C3A]">
                  {isToday ? "Bugün" : formatDateTurkish(selectedDate)}
                </span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF4F0] text-[#2D4C3A] border border-[#D0E0D4]">
                <Sprout className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2D4C3A] tabular-nums">
                {isPrivacyMode ? "•••••• ₺" : formatCurrency(selectedRevenue)}
              </div>
              <p className="mt-1 text-xs font-medium text-[#4B5563]">
                {selectedCount > 0
                  ? `${selectedCount} işlem ile alınan tahsilat`
                  : "Bu tarihte henüz tahsilat kaydı yok"}
              </p>
            </div>
          </div>

          {/* 4. Müşteri Durumu */}
          <div className="p-6 transition-colors hover:bg-[#FAF8F5]/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                Kayıtlı Çiftçi &amp; Müşteri
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF8F5] text-[#2D4C3A] border border-[#E5E0D8]">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111827] tabular-nums">
                  {stats.toplamMusteriSayisi}
                </span>
                <span className="text-sm font-semibold text-[#4B5563]">Aktif Cari</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#8D5B28]" />
                <p className="text-xs font-bold text-[#8D5B28]">
                  {stats.borcluMusteriSayisi} müşteride açık bakiye mevcut
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
