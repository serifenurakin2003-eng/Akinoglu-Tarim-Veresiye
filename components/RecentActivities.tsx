"use client";

import { CalendarDays, ChevronRight, Scale, CheckCircle2, Calendar } from "lucide-react";
import { formatCurrency, formatDateTurkish } from "@/components/StatCards";
import { usePrivacy } from "@/lib/privacy";
import { DailyRevenueItem } from "@/lib/actions";

interface RecentActivitiesProps {
  dailyRevenues: DailyRevenueItem[];
  selectedDate: string;
  selectedRevenue: number;
  selectedCount: number;
  todayStr: string;
  onSelectDate: (date: string) => void;
  enCokBorclular: {
    musteri_id: number;
    ad_soyad: string;
    mahalle: string | null;
    bakiye: number;
  }[];
  onOpenStatement: (customerId: number) => void;
}

export default function RecentActivities({
  dailyRevenues,
  selectedDate,
  selectedRevenue,
  selectedCount,
  todayStr,
  onSelectDate,
  enCokBorclular,
  onOpenStatement,
}: RecentActivitiesProps) {
  const { isPrivacyMode } = usePrivacy();
  const isToday = selectedDate === todayStr;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Tarih Tarih Günlük Hasılat Defteri */}
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EEF4F0] text-[#2D4C3A] border border-[#D0E0D4]">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">
                  Günlük Hasılat &amp; Kasa
                </h3>
                <p className="text-xs font-medium text-[#4B5563]">
                  Tarih tarih toplanan nakit ve banka tahsilat dökümü
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#2D4C3A] bg-[#EEF4F0] px-3 py-1 rounded-full border border-[#D0E0D4]">
              Tarih Bazlı Kasa
            </span>
          </div>

          {/* Seçili Gün Özet Kutusu */}
          <div className="mt-4 rounded-xl border border-[#D0E0D4] bg-[#F7FAF8] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2D4C3A] text-white">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Seçili Tarih
                </span>
                <p className="text-sm font-extrabold text-[#111827]">
                  {isToday ? `Bugün (${formatDateTurkish(selectedDate)})` : formatDateTurkish(selectedDate)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                O Günün Hasılatı
              </span>
              <p className="text-base sm:text-lg font-extrabold text-[#2D4C3A] tabular-nums">
                {isPrivacyMode ? "•••••• ₺" : formatCurrency(selectedRevenue)}
              </p>
              <p className="text-[10px] text-[#4B5563] font-medium">
                {selectedCount > 0 ? `${selectedCount} tahsilat kaydı` : "Kayıt yok"}
              </p>
            </div>
          </div>

          {/* Tarih Tarih Hasılat Geçmişi Listesi */}
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[#6B7280] px-2 py-1">
              <span>Tarih &amp; İşlem Sayısı</span>
              <span>Toplanan Hasılat</span>
            </div>

            <div className="divide-y divide-[#E5E0D8] max-h-[290px] overflow-y-auto pr-1">
              {dailyRevenues.length === 0 ? (
                <p className="py-8 text-center text-xs font-medium text-[#6B7280]">
                  Kayıtlı hasılat bulunmuyor.
                </p>
              ) : (
                dailyRevenues.slice(0, 10).map((item) => {
                  const isItemToday = item.tarih === todayStr;
                  const isSelected = item.tarih === selectedDate;
                  return (
                    <div
                      key={item.tarih}
                      onClick={() => onSelectDate(item.tarih)}
                      className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-all cursor-pointer group ${
                        isSelected
                          ? "bg-[#EEF4F0] border border-[#2D4C3A]/30 text-[#2D4C3A]"
                          : "hover:bg-[#FAF8F5] text-[#111827]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Calendar className={`h-4 w-4 ${isSelected ? "text-[#2D4C3A]" : "text-[#6B7280]"}`} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold">
                              {formatDateTurkish(item.tarih)}
                            </span>
                            {isItemToday && (
                              <span className="rounded-full bg-[#2D4C3A] text-white text-[10px] px-1.5 py-0.2 font-extrabold">
                                Bugün
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[#4B5563]">
                            {item.islemSayisi} tahsilat işlemi
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold tabular-nums text-[#2D4C3A]">
                          {isPrivacyMode ? "•••••• ₺" : formatCurrency(item.toplamHasilat)}
                        </span>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${
                            isSelected ? "text-[#2D4C3A]" : "text-[#9CA3AF]"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-[#6B7280] text-center italic border-t border-[#E5E0D8]/60 pt-2">
          Listeden herhangi bir güne tıklayarak o günün kasa hasılatını inceleyebilirsiniz.
        </p>
      </div>

      {/* 2. En Yüksek Açık Hesaplar (Tahsilat Bekleyenler) */}
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF3EB] text-[#8D5B28] border border-[#E8DCCB]">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">
                  En Yüksek Açık Hesaplar
                </h3>
                <p className="text-xs font-medium text-[#4B5563]">
                  En çok vadeli tohum, gübre ve ilaç borcu olan müstahsiller
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#4B5563]">İlk 5 Hesap</span>
          </div>

          <div className="mt-4 divide-y divide-[#E5E0D8]">
            {enCokBorclular.length === 0 ? (
              <p className="py-10 text-center text-xs font-medium text-[#6B7280]">
                Açık bakiyeli hesap bulunmuyor.
              </p>
            ) : (
              enCokBorclular.map((m, index) => (
                <div
                  key={m.musteri_id}
                  onClick={() => onOpenStatement(m.musteri_id)}
                  title="Müşteri Bilgilerini ve Ekstresini Aç"
                  className="flex items-center justify-between py-3.5 px-2.5 -mx-2.5 rounded-xl hover:bg-[#F3EFEA] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-bold text-[#8D5B28]">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#111827] group-hover:text-[#2D4C3A] transition-colors">
                        {m.ad_soyad}
                      </h4>
                      {m.mahalle && (
                        <p className="text-xs font-medium text-[#8D5B28]">{m.mahalle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#8D5B28] tabular-nums">
                        {isPrivacyMode ? "•••••• ₺" : formatCurrency(m.bakiye)}
                      </span>
                      <span className="block text-[10px] text-[#6B7280]">kalan borç</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#9CA3AF] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <p className="mt-3 text-[11px] text-[#6B7280] text-center italic border-t border-[#E5E0D8]/60 pt-2">
          Müşteri bilgilerini ve detaylı tahsilatlarını görmek için satıra tıklayınız.
        </p>
      </div>
    </div>
  );
}
