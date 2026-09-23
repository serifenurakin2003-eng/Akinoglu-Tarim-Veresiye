"use client";

import { History, Wheat, Sprout, ChevronRight, Scale } from "lucide-react";
import { formatCurrency } from "@/components/StatCards";

interface RecentActivitiesProps {
  sonHareketler: {
    id: string;
    musteri_id: number;
    musteri_ad: string;
    tip: "borc" | "tahsilat";
    tutar: number;
    aciklama: string | null;
    tarih: string;
  }[];
  enCokBorclular: {
    musteri_id: number;
    ad_soyad: string;
    mahalle: string | null;
    bakiye: number;
  }[];
  onOpenStatement: (customerId: number) => void;
}

export default function RecentActivities({
  sonHareketler,
  enCokBorclular,
  onOpenStatement,
}: RecentActivitiesProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 1. Son Cari Hareketler */}
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF3EB] text-[#8D5B28] border border-[#E8DCCB]">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1F2937]">
                Son Cari Hareketler
              </h3>
              <p className="text-xs font-medium text-[#4B5563]">
                En son kaydedilen borçlandırma ve tahsilat işlemleri
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#8D5B28] bg-[#FAF3EB] px-3 py-1 rounded-full border border-[#E8DCCB]">
            Son 8 Kayıt
          </span>
        </div>

        <div className="mt-4 divide-y divide-[#E5E0D8]">
          {sonHareketler.length === 0 ? (
            <p className="py-10 text-center text-xs font-medium text-[#6B7280]">
              Henüz bir cari hareket kaydı bulunmuyor.
            </p>
          ) : (
            sonHareketler.map((item) => {
              const isDebt = item.tip === "borc";
              return (
                <div
                  key={item.id}
                  onClick={() => onOpenStatement(item.musteri_id)}
                  className="flex items-center justify-between py-3.5 px-2.5 -mx-2.5 rounded-xl hover:bg-[#F3EFEA] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                        isDebt
                          ? "bg-[#FAF3EB] text-[#8D5B28] border-[#E8DCCB]"
                          : "bg-[#EEF4F0] text-[#2D4C3A] border-[#D0E0D4]"
                      }`}
                    >
                      {isDebt ? (
                        <Wheat className="h-4 w-4" />
                      ) : (
                        <Sprout className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#111827] group-hover:text-[#2D4C3A] transition-colors">
                        {item.musteri_ad}
                      </h4>
                      <p className="text-xs font-medium text-[#4B5563]">
                        {item.aciklama || (isDebt ? "Vadeli Ürün Satışı" : "Tahsilat Alındı")} •{" "}
                        {item.tarih}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        isDebt ? "text-[#8D5B28]" : "text-[#2D4C3A]"
                      }`}
                    >
                      {isDebt ? "+" : "-"}
                      {formatCurrency(item.tutar)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. En Yüksek Alacaklılar */}
      <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
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
                  <span className="text-sm font-bold text-[#8D5B28] tabular-nums">
                    {formatCurrency(m.bakiye)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#9CA3AF] transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
