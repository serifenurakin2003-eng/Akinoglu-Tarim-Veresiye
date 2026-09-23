"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  getCustomerStatement,
  deleteDebt,
  deleteCollection,
  CustomerStatement,
} from "@/lib/actions";
import { formatCurrency } from "@/components/StatCards";

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
  const [statement, setStatement] = useState<CustomerStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      loadStatement(customerId);
    } else {
      setStatement(null);
    }
  }, [isOpen, customerId]);

  async function loadStatement(id: number) {
    try {
      setLoading(true);
      setError(null);
      const data = await getCustomerStatement(id);
      setStatement(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Ekstre yüklenirken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDelete(item: { id: number; tip: "borc" | "tahsilat" }) {
    if (deletingKey !== null) return;
    const isDebt = item.tip === "borc";
    const itemKey = `${item.tip}-${item.id}`;
    const actionLabel = isDebt ? "Borç Kaydını Sil" : "Tahsilat Kaydını Sil";
    const confirmMsg = isDebt
      ? "Bu vadeli borç kaydını silmek istediğinize emin misiniz?"
      : "Bu tahsilat kaydını silmek istediğinize emin misiniz?";

    requirePassword(actionLabel, () => {
      if (!confirm(confirmMsg)) return;
      setDeletingKey(itemKey);
      setActionLoading(true);
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
          setActionLoading(false);
          setDeletingKey(null);
        });
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2922]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-[#EAE6DF] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EAE6DF] p-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF8F5] text-[#2D4C3A] border border-[#EAE6DF]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif-brand text-2xl font-bold text-[#2D4C3A]">
                {statement?.musteri.ad_soyad || "Cari Hesap Ekstresi"}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#6B776D]">
                {statement?.musteri.telefon && (
                  <span className="flex items-center gap-1 font-medium text-[#1F2922]">
                    <Phone className="h-3 w-3 text-[#6F8B67]" />
                    {statement.musteri.telefon}
                  </span>
                )}
                {statement?.musteri.mahalle && (
                  <span className="flex items-center gap-1 text-[#8D5B28]">
                    <MapPin className="h-3 w-3 text-[#B88E48]" />
                    {statement.musteri.mahalle}
                  </span>
                )}
                {statement?.musteri.kayit_tarihi && (
                  <span className="flex items-center gap-1 text-[#6B776D]">
                    <Calendar className="h-3 w-3" />
                    Kayıt: {statement.musteri.kayit_tarihi}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6B776D] hover:bg-[#FAF8F5] hover:text-[#1F2922] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Bakiye Özeti ve Butonlar */}
        {statement && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAE6DF] bg-[#FAF8F5] px-6 py-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B776D]">
                  Toplam Borç
                </p>
                <p className="font-serif-brand text-base font-bold text-[#8D5B28] tabular-nums">
                  {formatCurrency(statement.musteri.toplam_borc)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B776D]">
                  Toplam Tahsilat
                </p>
                <p className="font-serif-brand text-base font-bold text-[#6F8B67] tabular-nums">
                  {formatCurrency(statement.musteri.toplam_tahsilat)}
                </p>
              </div>
              <div className="border-l border-[#EAE6DF] pl-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B776D]">
                  Kalan Net Bakiye
                </p>
                <p className="font-serif-brand text-xl font-bold text-[#2D4C3A] tabular-nums">
                  {formatCurrency(statement.musteri.kalan_bakiye)}
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
                className="inline-flex items-center gap-1 rounded-full border border-[#8D5B28]/20 bg-[#8D5B28] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#72481F] transition-colors"
              >
                <Plus className="h-3 w-3" />
                Borç Yaz
              </button>
              <button
                onClick={() => {
                  requirePassword("Tahsilat Al", () => {
                    onClose();
                    onOpenPayment(statement.musteri.musteri_id);
                  });
                }}
                className="inline-flex items-center gap-1 rounded-full border border-[#2D4C3A] bg-[#2D4C3A] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#20372A] transition-colors"
              >
                <ArrowDownLeft className="h-3 w-3" />
                Tahsilat Al
              </button>
            </div>
          </div>
        )}

        {/* Tablo Gövdesi */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center text-[#6B776D]">
              <Loader2 className="h-7 w-7 animate-spin text-[#6F8B67]" />
              <p className="mt-2 text-xs font-serif-brand">Ekstre dökümü hazırlanıyor...</p>
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
              <table className="min-w-full divide-y divide-[#EAE6DF] text-left text-sm">
                <thead className="bg-[#FAF8F5] text-[11px] font-semibold uppercase tracking-wider text-[#6B776D]">
                  <tr>
                    <th className="px-5 py-3">Tarih</th>
                    <th className="px-4 py-3">İşlem Cinsi</th>
                    <th className="px-5 py-3">Açıklama / Ürün Notu</th>
                    <th className="px-5 py-3 text-right">Tutar</th>
                    <th className="px-4 py-3 text-center">İptal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {statement.hareketler.map((item) => {
                    const isDebt = item.tip === "borc";
                    return (
                      <tr
                        key={`${item.tip}-${item.id}`}
                        className="hover:bg-[#F3EFEA]/60 transition-colors"
                      >
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-[#6B776D] font-medium">
                          {item.tarih || "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
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
                            {isDebt ? "Borçlandırma" : "Tahsilat"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-[#1F2922]">
                          {item.aciklama || (isDebt ? "Vadeli Ürün Satışı" : "Tahsilat Alındı")}
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-3 text-right font-serif-brand font-bold text-sm tabular-nums ${
                            isDebt ? "text-[#8D5B28]" : "text-[#2D4C3A]"
                          }`}
                        >
                          {isDebt ? "+" : "-"}
                          {formatCurrency(item.tutar)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deletingKey !== null}
                            title={
                              deletingKey === `${item.tip}-${item.id}`
                                ? "Siliniyor..."
                                : "Bu kaydı defterden sil"
                            }
                            className="rounded-full p-1 text-[#6B776D] transition-colors hover:bg-[#FAF3EB] hover:text-[#8D5B28] disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {deletingKey === `${item.tip}-${item.id}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#8D5B28]" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#EAE6DF] px-6 py-3.5 bg-[#FAF8F5]/40 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-full border border-[#EAE6DF] bg-white px-5 py-1.5 text-xs sm:text-sm font-medium text-[#1F2922] hover:bg-[#FAF8F5] transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
