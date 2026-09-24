"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileSpreadsheet,
  Plus,
  ArrowDownLeft,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  Wheat,
  Sprout,
  Printer,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import {
  getCustomerStatement,
  deleteDebt,
  deleteCollection,
  CustomerStatement,
} from "@/lib/actions";
import { formatCurrency } from "@/components/StatCards";
import { usePrivacy } from "@/lib/privacy";

interface StatementModalProps {
  isOpen: boolean;
  customerId: number | null;
  onClose: () => void;
  onOpenDebt: (customerId: number) => void;
  onOpenPayment: (customerId: number) => void;
  onDataChanged: () => void;
  requirePassword: (label: string, action: () => void) => void;
}

export default function StatementModal({
  isOpen,
  customerId,
  onClose,
  onOpenDebt,
  onOpenPayment,
  onDataChanged,
  requirePassword,
}: StatementModalProps) {
  const { isPrivacyMode } = usePrivacy();
  const [statement, setStatement] = useState<CustomerStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && customerId) {
      loadStatement(customerId);
    } else {
      setStatement(null);
      setExpandedRowIds(new Set());
    }
  }, [isOpen, customerId]);

  async function loadStatement(id: number) {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomerStatement(id);
      setStatement(data);

      // Otomatik olarak tüm ürünlü kalemleri açık getir
      const initialExpanded = new Set<number>();
      data.hareketler.forEach((h) => {
        if (h.kalemler && h.kalemler.length > 0) {
          initialExpanded.add(h.id);
        }
      });
      setExpandedRowIds(initialExpanded);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Ekstre yüklenirken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleRowExpand(id: number) {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleDelete(item: { id: number; tip: "borc" | "tahsilat" }) {
    if (deletingKey !== null) return;
    const isDebt = item.tip === "borc";
    const itemKey = `${item.tip}-${item.id}`;
    const actionLabel = isDebt ? "Borç Kaydını Sil" : "Tahsilat Kaydını Sil";
    const confirmMsg = isDebt
      ? "Bu vadeli borç kaydını ve bağlı tüm ürün kalemlerini silmek istediğinize emin misiniz?"
      : "Bu tahsilat kaydını silmek istediğinize emin misiniz?";

    requirePassword(actionLabel, () => {
      if (!confirm(confirmMsg)) return;
      setDeletingKey(itemKey);
      const deletePromise = isDebt ? deleteDebt(item.id) : deleteCollection(item.id);
      deletePromise
        .then(() => {
          onDataChanged();
          if (customerId) loadStatement(customerId);
        })
        .catch((err: unknown) => {
          alert(err instanceof Error ? err.message : "Kayıt silinirken bir hata oluştu.");
        })
        .finally(() => {
          setDeletingKey(null);
        });
    });
  }

  function handlePrint() {
    window.print();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1F2922]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-[#EAE6DF] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EAE6DF] p-5 sm:p-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF8F5] text-[#2D4C3A] border border-[#EAE6DF]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-brand text-xl sm:text-2xl font-bold text-[#2D4C3A]">
                  {statement?.musteri.ad_soyad || "Cari Hesap Ekstresi"}
                </h3>
                <span className="rounded-full bg-[#FAF3EB] border border-[#E8DCCB] px-2.5 py-0.5 text-xs font-bold text-[#8D5B28]">
                  Müstahsil Cari Dökümü
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#6B776D]">
                {statement?.musteri.telefon && (
                  <span className="flex items-center gap-1 font-semibold text-[#1F2922]">
                    <Phone className="h-3.5 w-3.5 text-[#6F8B67]" />
                    {statement.musteri.telefon}
                  </span>
                )}
                {statement?.musteri.mahalle && (
                  <span className="flex items-center gap-1 text-[#8D5B28] font-medium">
                    <MapPin className="h-3.5 w-3.5 text-[#B88E48]" />
                    {statement.musteri.mahalle}
                  </span>
                )}
                {statement?.musteri.kayit_tarihi && (
                  <span className="flex items-center gap-1 text-[#6B776D]">
                    <Calendar className="h-3.5 w-3.5" />
                    Kayıt: {statement.musteri.kayit_tarihi}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Yazdır / Fiş Çıktısı Al"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-semibold text-[#4B5563] hover:bg-[#FAF8F5] transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Yazdır</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[#6B776D] hover:bg-[#FAF8F5] hover:text-[#1F2922] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bakiye Özeti ve Aksiyon Butonları */}
        {statement && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] bg-[#FAF8F5] px-5 sm:px-6 py-3.5">
            <div className="flex flex-wrap items-center gap-5 sm:gap-8">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6B776D]">
                  Toplam Borç
                </p>
                <p className="font-serif-brand text-base sm:text-lg font-bold text-[#8D5B28] tabular-nums">
                  {isPrivacyMode ? "•••••• ₺" : formatCurrency(statement.musteri.toplam_borc)}
                </p>
              </div>
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6B776D]">
                  Toplam Tahsilat
                </p>
                <p className="font-serif-brand text-base sm:text-lg font-bold text-[#2D4C3A] tabular-nums">
                  {isPrivacyMode ? "•••••• ₺" : formatCurrency(statement.musteri.toplam_tahsilat)}
                </p>
              </div>
              <div className="border-l border-[#EAE6DF] pl-5 sm:pl-7">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#6B776D]">
                  Kalan Net Bakiye
                </p>
                <p className="font-serif-brand text-lg sm:text-2xl font-extrabold text-[#2D4C3A] tabular-nums">
                  {isPrivacyMode ? "•••••• ₺" : formatCurrency(statement.musteri.kalan_bakiye)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  requirePassword("Borç Yaz", () => {
                    onClose();
                    onOpenDebt(statement.musteri.musteri_id);
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#8D5B28] bg-[#8D5B28] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#72481F] transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Borç Yaz
              </button>
              <button
                onClick={() => {
                  requirePassword("Tahsilat Al", () => {
                    onClose();
                    onOpenPayment(statement.musteri.musteri_id);
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#2D4C3A] bg-[#2D4C3A] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3427] transition"
              >
                <ArrowDownLeft className="h-3.5 w-3.5" />
                Tahsilat Al
              </button>
            </div>
          </div>
        )}

        {/* Hareketler Listesi & Ürün Kalemleri Dökümü */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center text-[#6B776D]">
              <Loader2 className="h-7 w-7 animate-spin text-[#6F8B67]" />
              <p className="mt-2 text-xs font-serif-brand">Cari ekstre dökümü hazırlanıyor...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-[#FAF3EB] border border-[#E8DCCB] p-4 text-xs font-medium text-[#8D5B28]">
              {error}
            </div>
          ) : !statement || statement.hareketler.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-[#6B776D]">
              <FileSpreadsheet className="h-9 w-9 text-[#6F8B67]/30" />
              <p className="mt-2 text-sm font-serif-brand">
                Henüz kayıtlı bir borçlandırma veya tahsilat hareketi bulunmuyor.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#EAE6DF]">
              <table className="min-w-full divide-y divide-[#EAE6DF] text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF8F5] text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                  <tr>
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-3 py-3">İşlem</th>
                    <th className="px-4 py-3">Açıklama / Ürün Notu</th>
                    <th className="px-4 py-3 text-right">Tutar</th>
                    <th className="px-3 py-3 text-center">İptal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {statement.hareketler.map((item) => {
                    const isDebt = item.tip === "borc";
                    const hasItems = Boolean(
                      item.kalemler && item.kalemler.length > 0
                    );
                    const isExpanded = expandedRowIds.has(item.id);

                    return (
                      <React.Fragment key={`${item.tip}-${item.id}`}>
                        <tr
                          className={`hover:bg-[#FAF8F5] transition-colors ${
                            hasItems ? "cursor-pointer" : ""
                          }`}
                          onClick={() => {
                            if (hasItems) toggleRowExpand(item.id);
                          }}
                        >
                          {/* Tarih */}
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-[#6B776D] font-medium">
                            {item.tarih || "-"}
                          </td>

                          {/* Tip */}
                          <td className="whitespace-nowrap px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                                isDebt
                                  ? "bg-[#FAF3EB] text-[#8D5B28] border-[#E8DCCB]"
                                  : "bg-[#EEF4F0] text-[#2D4C3A] border-[#D0E0D4]"
                              }`}
                            >
                              {isDebt ? (
                                <Wheat className="h-3 w-3" />
                              ) : (
                                <Sprout className="h-3 w-3" />
                              )}
                              {isDebt ? "Borç" : "Tahsilat"}
                            </span>
                          </td>

                          {/* Açıklama */}
                          <td className="px-4 py-3 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#111827]">
                                {item.aciklama ||
                                  (isDebt ? "Vadeli Ürün Satışı" : "Tahsilat Alındı")}
                              </span>
                              {hasItems && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleRowExpand(item.id);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-md bg-[#FAF3EB] border border-[#E8DCCB] px-2 py-0.5 text-[10px] font-bold text-[#8D5B28] hover:bg-[#FAF0E1]"
                                >
                                  <Package className="h-3 w-3" />
                                  <span>{item.kalemler!.length} Ürün Kalemi</span>
                                  {isExpanded ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Tutar */}
                          <td
                            className={`whitespace-nowrap px-4 py-3 text-right font-serif-brand font-bold text-sm sm:text-base tabular-nums ${
                              isDebt ? "text-[#8D5B28]" : "text-[#2D4C3A]"
                            }`}
                          >
                            {isDebt ? "+" : "-"}
                            {isPrivacyMode ? "•••••• ₺" : formatCurrency(item.tutar)}
                          </td>

                          {/* İptal */}
                          <td
                            className="whitespace-nowrap px-3 py-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleDelete(item)}
                              disabled={deletingKey !== null}
                              title="Bu kaydı defterden sil"
                              className="rounded-full p-1 text-[#9CA3AF] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                            >
                              {deletingKey === `${item.tip}-${item.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8D5B28]" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* DETAYLI ÜRÜN KALEMLERİ DÖKÜM SATIRI (Ses kaydı isteği: Gübre, zehir, kilo, birim fiyat, toplam fiyat) */}
                        {hasItems && isExpanded && (
                          <tr className="bg-[#FAF8F5]/90 border-b border-[#EAE6DF]">
                            <td colSpan={5} className="px-6 py-3">
                              <div className="rounded-xl border border-[#E8DCCB] bg-white p-3 shadow-xs">
                                <div className="flex items-center gap-1.5 pb-2 border-b border-[#EAE6DF] text-[11px] font-bold text-[#8D5B28] uppercase tracking-wider">
                                  <Package className="h-3.5 w-3.5" />
                                  <span>Bu İşlemde Verilen Ürün &amp; Malzeme Kalemleri</span>
                                </div>
                                <table className="min-w-full divide-y divide-[#EAE6DF] mt-2 text-left text-xs">
                                  <thead className="text-[10px] font-bold uppercase text-[#6B7280]">
                                    <tr>
                                      <th className="py-1 px-2 w-16">Kod</th>
                                      <th className="py-1 px-3">Ürün / İlaç Adı</th>
                                      <th className="py-1 px-3 text-right">Miktar</th>
                                      <th className="py-1 px-3 text-right">Birim Fiyat</th>
                                      <th className="py-1 px-3 text-right">Kalem Tutarı</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#F3EFEA]">
                                    {item.kalemler!.map((kalem) => (
                                      <tr key={kalem.kalem_id}>
                                        <td className="py-1.5 px-2 font-mono font-bold text-[#8D5B28]">
                                          {kalem.urun_kodu || "-"}
                                        </td>
                                        <td className="py-1.5 px-3 font-semibold text-[#111827]">
                                          {kalem.urun_adi}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-medium text-[#4B5563] tabular-nums">
                                          {kalem.miktar} {kalem.birim || "Adet"}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-medium text-[#4B5563] tabular-nums">
                                          {isPrivacyMode
                                            ? "•••••• ₺"
                                            : `${kalem.birim_fiyat.toLocaleString("tr-TR", {
                                                minimumFractionDigits: 2,
                                              })} ₺`}
                                        </td>
                                        <td className="py-1.5 px-3 text-right font-serif-brand font-bold text-[#8D5B28] tabular-nums">
                                          {isPrivacyMode
                                            ? "•••••• ₺"
                                            : `${kalem.toplam_fiyat.toLocaleString("tr-TR", {
                                                minimumFractionDigits: 2,
                                              })} ₺`}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#EAE6DF] px-6 py-3 bg-[#FAF8F5] rounded-b-2xl">
          <p className="text-xs text-[#6B776D]">
            İlgili borç satırına tıklayarak verilen ilaç ve gübre kalemlerinin detaylarını açıp kapatabilirsiniz.
          </p>
          <button
            onClick={onClose}
            className="rounded-full border border-[#D1D5DB] bg-white px-5 py-1.5 text-xs font-semibold text-[#1F2922] hover:bg-[#FAF8F5] transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
