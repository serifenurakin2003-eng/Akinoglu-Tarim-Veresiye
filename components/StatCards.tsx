"use client";

import { Sprout, Wheat, Scale, Users } from "lucide-react";

interface StatCardsProps {
  stats: {
    toplamBorc: number;
    toplamTahsilat: number;
    kalanAlacak: number;
    toplamMusteriSayisi: number;
    borcluMusteriSayisi: number;
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function StatCards({ stats }: StatCardsProps) {
  return (
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
              {formatCurrency(stats.kalanAlacak)}
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
              {formatCurrency(stats.toplamBorc)}
            </div>
            <p className="mt-1 text-xs font-medium text-[#4B5563]">
              Tohum, gübre, ilaç & fide vadeli kayıtlar
            </p>
          </div>
        </div>

        {/* 3. Toplam Tahsilat */}
        <div className="p-6 transition-colors hover:bg-[#FAF8F5]/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
              Toplam Tahsilat
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF4F0] text-[#2D4C3A] border border-[#D0E0D4]">
              <Sprout className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#2D4C3A] tabular-nums">
              {formatCurrency(stats.toplamTahsilat)}
            </div>
            <p className="mt-1 text-xs font-medium text-[#4B5563]">
              Alınan nakit ve banka ödemeleri
            </p>
          </div>
        </div>

        {/* 4. Müşteri Durumu */}
        <div className="p-6 transition-colors hover:bg-[#FAF8F5]/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
              Kayıtlı Çiftçi & Müşteri
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
  );
}
