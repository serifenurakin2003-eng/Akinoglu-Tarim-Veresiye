"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  Phone,
  MapPin,
  User,
  Plus,
  ArrowUpRight,
  Trash2,
  Loader2,
  TrendingDown,
  TrendingUp,
  Calendar,
  AlertCircle,
  Printer,
} from "lucide-react";
import {
  getSupplierStatement,
  deleteFirmaBorc,
  deleteFirmaOdeme,
  SupplierStatement,
  SupplierWithBalance,
} from "@/lib/supplier-actions";

interface SupplierDetailModalProps {
  isOpen: boolean;
  supplier: SupplierWithBalance | null;
  onClose: () => void;
  onAddDebt: (tedarikci_id: number) => void;
  onAddPayment: (tedarikci_id: number) => void;
  onDataChanged: () => void;
}

function formatCurrency(n: number): string {
  return (
    n.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺"
  );
}

export default function SupplierDetailModal({
  isOpen,
  supplier,
  onClose,
  onAddDebt,
  onAddPayment,
  onDataChanged,
}: SupplierDetailModalProps) {
  const [statement, setStatement] = useState<SupplierStatement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tumhareketler" | "borclar" | "odemeler">("tumhareketler");

  useEffect(() => {
    if (isOpen && supplier) {
      loadStatement(supplier.tedarikci_id);
    } else {
      setStatement(null);
      setError(null);
      setActiveTab("tumhareketler");
    }
  }, [isOpen, supplier]);

  async function loadStatement(id: number) {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierStatement(id);
      setStatement(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Veri yüklenirken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteBorc(firma_borc_id: number) {
    if (deletingKey) return;
    if (!confirm("Bu borç kaydını silmek istediğinize emin misiniz?")) return;
    const key = `b-${firma_borc_id}`;
    setDeletingKey(key);
    try {
      await deleteFirmaBorc(firma_borc_id);
      onDataChanged();
      if (supplier) loadStatement(supplier.tedarikci_id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Silme işlemi başarısız.");
    } finally {
      setDeletingKey(null);
    }
  }

  async function handleDeleteOdeme(firma_odeme_id: number) {
    if (deletingKey) return;
    if (!confirm("Bu ödeme kaydını silmek istediğinize emin misiniz?")) return;
    const key = `o-${firma_odeme_id}`;
    setDeletingKey(key);
    try {
      await deleteFirmaOdeme(firma_odeme_id);
      onDataChanged();
      if (supplier) loadStatement(supplier.tedarikci_id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Silme işlemi başarısız.");
    } finally {
      setDeletingKey(null);
    }
  }

  if (!isOpen || !supplier) return null;

  const kalan = statement?.tedarikci.kalan_borc ?? supplier.kalan_borc;
  const toplamBorc = statement?.tedarikci.toplam_borc ?? supplier.toplam_borc;
  const toplamOdeme = statement?.tedarikci.toplam_odeme ?? supplier.toplam_odeme;
  const hasDebt = kalan > 0;

  const hareketler = statement?.hareketler ?? [];
  const displayRows =
    activeTab === "borclar"
      ? hareketler.filter((h) => h.tip === "borc")
      : activeTab === "odemeler"
        ? hareketler.filter((h) => h.tip === "odeme")
        : hareketler;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1F2922]/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[94vh] w-full max-w-3xl flex-col rounded-2xl border border-[#EAE6DF] bg-white shadow-2xl">
        {/* ── Header ── */}
        <div className="flex items-start justify-between border-b border-[#EAE6DF] p-5 sm:p-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF3EB] text-[#8D5B28] border border-[#E8DCCB]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif-brand text-xl sm:text-2xl font-bold text-[#8D5B28]">
                  {supplier.firma_adi}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${hasDebt
                    ? "bg-red-50 text-red-700 border-red-200"
                    : "bg-[#EEF4F0] text-[#2D4C3A] border-[#D0E0D4]"
                    }`}
                >
                  {hasDebt ? "Borç Var" : "Borç Yok"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-[#6B7280]">
                {supplier.yetkili_kisi && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{supplier.yetkili_kisi}</span>
                  </span>
                )}
                {supplier.telefon && (
                  <span className="flex items-center gap-1 font-semibold text-[#111827]">
                    <Phone className="h-3 w-3 text-[#2D4C3A]" />
                    <a href={`tel:${supplier.telefon}`} className="hover:underline">
                      {supplier.telefon}
                    </a>
                  </span>
                )}
                {supplier.adres && (
                  <span className="flex items-center gap-1 text-[#8D5B28]">
                    <MapPin className="h-3 w-3" />
                    <span>{supplier.adres}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              type="button"
              title="Yazdır"
              className="rounded-full p-2 text-[#6B7280] hover:bg-[#FAF8F5] transition"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              type="button"
              className="rounded-full p-1.5 text-[#6B776D] hover:bg-[#FAF8F5] transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Özet Kartları & Aksiyon Butonları ── */}
        <div className="border-b border-[#EAE6DF] bg-[#FAF8F5] p-5 sm:p-6">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-[#E8DCCB] bg-white p-3 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8D5B28]">
                Toplam Borç
              </p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-[#8D5B28] tabular-nums">
                {formatCurrency(toplamBorc)}
              </p>
            </div>
            <div className="rounded-xl border border-[#D0E0D4] bg-white p-3 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#2D4C3A]">
                Yapılan Ödeme
              </p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold text-[#2D4C3A] tabular-nums">
                {formatCurrency(toplamOdeme)}
              </p>
            </div>
            <div
              className={`rounded-xl border p-3 shadow-xs ${hasDebt
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-[#D0E0D4] bg-[#EEF4F0] text-[#2D4C3A]"
                }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Kalan Net Borç
              </p>
              <p className="mt-1 text-lg sm:text-xl font-extrabold tabular-nums">
                {formatCurrency(kalan)}
              </p>
            </div>
          </div>

          {/* Hızlı Aksiyonlar */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onAddDebt(supplier.tedarikci_id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Borç Ekle</span>
            </button>
            <button
              onClick={() => onAddPayment(supplier.tedarikci_id)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#2D4C3A] bg-[#2D4C3A] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#1E3427] transition shadow-xs"
            >
              <ArrowUpRight className="h-4 w-4" />
              <span>Ödeme Yap / Düş</span>
            </button>
          </div>
        </div>

        {/* ── Tab Seçici ── */}
        <div className="flex border-b border-[#EAE6DF] bg-white px-5 sm:px-6">
          {(
            [
              { key: "tumhareketler", label: "Tüm Hareketler", count: hareketler.length },
              { key: "borclar", label: "Borçlarımız", count: statement?.borclar.length ?? 0 },
              { key: "odemeler", label: "Ödemelerimiz", count: statement?.odemeler.length ?? 0 },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 px-3 py-3 text-xs font-semibold transition-colors border-b-2 -mb-px ${activeTab === tab.key
                ? "border-[#8D5B28] text-[#8D5B28]"
                : "border-transparent text-[#6B7280] hover:text-[#374151]"
                }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeTab === tab.key
                    ? "bg-[#FAF3EB] text-[#8D5B28]"
                    : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Hareket Tablosu ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center text-[#6B776D]">
              <Loader2 className="h-7 w-7 animate-spin text-[#8D5B28]" />
              <p className="mt-2 text-xs">Veriler yükleniyor...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-2 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          ) : displayRows.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-[#6B776D]">
              <Building2 className="h-8 w-8 text-[#8D5B28]/20" />
              <p className="mt-2 text-sm font-semibold">
                {activeTab === "borclar"
                  ? "Borç kaydı bulunamadı."
                  : activeTab === "odemeler"
                    ? "Ödeme kaydı bulunamadı."
                    : "Kayıt bulunamadı."}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#EAE6DF]">
              <table className="min-w-full divide-y divide-[#EAE6DF] text-left text-xs sm:text-sm">
                <thead className="bg-[#FAF8F5] text-[11px] font-bold uppercase tracking-wider text-[#4B5563]">
                  <tr>
                    <th className="px-4 py-3">Tarih</th>
                    <th className="px-3 py-3">Tür</th>
                    <th className="px-4 py-3">Açıklama</th>
                    <th className="px-4 py-3 text-right">Tutar</th>
                    <th className="px-3 py-3 text-center">Sil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {displayRows.map((item) => {
                    const isDebt = item.tip === "borc";
                    const rawId = parseInt(item.id.split("-")[1]);
                    const delKey = item.id;
                    return (
                      <tr key={item.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-[#6B776D] font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{item.tarih || "-"}</span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${isDebt
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-[#EEF4F0] text-[#2D4C3A] border-[#D0E0D4]"
                              }`}
                          >
                            {isDebt ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : (
                              <TrendingUp className="h-3 w-3" />
                            )}
                            <span>{isDebt ? "Borç" : "Ödeme"}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-[#111827] max-w-[180px] truncate">
                          <span>{item.aciklama || (isDebt ? "Mal/Hizmet Alımı" : "Ödeme Yapıldı")}</span>
                        </td>
                        <td
                          className={`whitespace-nowrap px-4 py-3 text-right font-bold text-sm tabular-nums ${isDebt ? "text-red-700" : "text-[#2D4C3A]"
                            }`}
                        >
                          {isDebt ? "+" : "−"}
                          {formatCurrency(item.tutar)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-center">
                          <button
                            onClick={() =>
                              isDebt ? handleDeleteBorc(rawId) : handleDeleteOdeme(rawId)
                            }
                            disabled={deletingKey !== null}
                            className="rounded-full p-1 text-[#9CA3AF] hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
                          >
                            {deletingKey === delKey ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {displayRows.length > 0 && (
                  <tfoot className="bg-[#FAF8F5] border-t-2 border-[#EAE6DF]">
                    <tr>
                      <td colSpan={3} className="px-4 py-2.5 text-xs font-bold text-[#374151]">
                        <span>{displayRows.length} kayıt</span>
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right text-sm font-extrabold tabular-nums ${activeTab === "borclar"
                          ? "text-red-700"
                          : activeTab === "odemeler"
                            ? "text-[#2D4C3A]"
                            : hasDebt
                              ? "text-red-700"
                              : "text-[#2D4C3A]"
                          }`}
                      >
                        {activeTab === "borclar"
                          ? formatCurrency(displayRows.reduce((s, r) => s + r.tutar, 0))
                          : activeTab === "odemeler"
                            ? formatCurrency(displayRows.reduce((s, r) => s + r.tutar, 0))
                            : `Net: ${formatCurrency(kalan)}`}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-[#EAE6DF] px-6 py-3 bg-[#FAF8F5] rounded-b-2xl">
          <p className="text-xs text-[#6B776D]">
            <span>
              {hasDebt
                ? `${supplier.firma_adi} firmasına ${formatCurrency(kalan)} borcunuz var`
                : `${supplier.firma_adi} firmasına borcunuz bulunmuyor`}
            </span>
          </p>
          <button
            onClick={onClose}
            className="rounded-full border border-[#D1D5DB] bg-white px-5 py-1.5 text-xs font-semibold text-[#1F2922] hover:bg-[#FAF8F5] transition"
          >
            <span>Kapat</span>
          </button>
        </div>
      </div>
    </div>
  );
}
