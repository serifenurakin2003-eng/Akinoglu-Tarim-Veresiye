"use client";

import { useState, useEffect, useRef } from "react";
import { X, Wheat, Sprout, Loader2, Calendar, FileText } from "lucide-react";
import { addDebt, addCollection, CustomerWithBalance } from "@/lib/actions";

interface TransactionModalProps {
  isOpen: boolean;
  type: "borc" | "tahsilat";
  onClose: () => void;
  onSuccess: () => void;
  preSelectedCustomerId?: number | null;
  customers: CustomerWithBalance[];
}

export default function TransactionModal({
  isOpen,
  type,
  onClose,
  onSuccess,
  preSelectedCustomerId,
  customers,
}: TransactionModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [tarih, setTarih] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (preSelectedCustomerId) {
      setSelectedCustomerId(preSelectedCustomerId);
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].musteri_id);
    }

    const today = new Date().toISOString().split("T")[0];
    setTarih(today);
    setTutar("");
    setAciklama("");
    setError(null);
  }, [isOpen, preSelectedCustomerId, customers]);

  if (!isOpen) return null;

  const isDebt = type === "borc";
  const activeCustomer = customers.find(
    (c) => c.musteri_id === Number(selectedCustomerId)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(tutar.replace(",", "."));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Lütfen geçerli bir tutar giriniz.");
      return;
    }

    if (!selectedCustomerId) {
      setError("Lütfen bir müstahsil seçiniz.");
      return;
    }

    try {
      setLoading(true);
      if (isDebt) {
        await addDebt({
          musteri_id: Number(selectedCustomerId),
          tutar: numericAmount,
          aciklama,
          tarih,
        });
      } else {
        await addCollection({
          musteri_id: Number(selectedCustomerId),
          odenen_tutar: numericAmount,
          tarih,
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "İşlem kaydedilirken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2922]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-[#EAE6DF] bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#EAE6DF]">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
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
              <h3 className="font-serif-brand text-lg font-bold text-[#2D4C3A]">
                {isDebt ? "Vadeli Borç Kaydı Yaz" : "Tahsilat / Ödeme Al"}
              </h3>
              <p className="text-[11px] text-[#6B776D]">
                {isDebt
                  ? "Tohum, gübre veya zirai ilaç vadeli satışı"
                  : "Nakit veya banka yoluyla cari hesaba mahsup"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6B776D] hover:bg-[#FAF8F5] hover:text-[#1F2922] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-[#FAF3EB] border border-[#E8DCCB] p-3 text-xs font-medium text-[#8D5B28]">
              {error}
            </div>
          )}

          {/* Müşteri Seçimi */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2922]">
              Müstahsil / Çiftçi <span className="text-[#8D5B28]">*</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              disabled={Boolean(preSelectedCustomerId)}
              className="mt-1 w-full rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] px-3.5 py-2 text-sm font-medium text-[#1F2922] focus:border-[#6F8B67] focus:bg-white focus:outline-none transition-colors disabled:bg-[#F3EFEA]"
            >
              {customers.map((c) => (
                <option key={c.musteri_id} value={c.musteri_id}>
                  {c.ad_soyad} {c.mahalle ? `(${c.mahalle})` : ""} — Bakiye:{" "}
                  {c.kalan_bakiye.toLocaleString("tr-TR")} ₺
                </option>
              ))}
            </select>
            {activeCustomer && (
              <div className="mt-1.5 flex items-center justify-between text-xs text-[#6B776D]">
                <span>Mevcut Açık Bakiye:</span>
                <span className="font-serif-brand font-bold text-[#8D5B28] tabular-nums">
                  {activeCustomer.kalan_bakiye.toLocaleString("tr-TR", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  ₺
                </span>
              </div>
            )}
          </div>

          {/* Tutar */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2922]">
              İşlem Tutarı (TL) <span className="text-[#8D5B28]">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={tutar}
                onChange={(e) => setTutar(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] px-3.5 py-2 font-serif-brand text-xl font-bold text-[#1F2922] placeholder-[#6B776D]/40 focus:border-[#6F8B67] focus:bg-white focus:outline-none transition-colors tabular-nums"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 font-serif-brand font-bold text-[#8D5B28]">
                ₺
              </div>
            </div>
          </div>

          {/* Açıklama (Borç için) */}
          {isDebt && (
            <div>
              <label className="block text-xs font-semibold text-[#1F2922]">
                Ürün & Hizmet Açıklaması
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6B776D]">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder="Örn: 2 Çuval Gübre, Buğday Tohumu, Fide vb."
                  className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] pl-9 pr-3.5 py-2 text-sm text-[#1F2922] placeholder-[#6B776D]/60 focus:border-[#6F8B67] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Tarih */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#1F2922]">
                İşlem Tarihi
              </label>
              <button
                type="button"
                onClick={() => {
                  try {
                    dateInputRef.current?.showPicker();
                  } catch {
                    dateInputRef.current?.focus();
                  }
                }}
                className="text-[11px] font-semibold text-[#8D5B28] hover:text-[#2D4C3A] cursor-pointer"
              >
                Takvimden Seç
              </button>
            </div>
            <div className="relative mt-1">
              <button
                type="button"
                onClick={() => {
                  try {
                    dateInputRef.current?.showPicker();
                  } catch {
                    dateInputRef.current?.focus();
                  }
                }}
                title="Takvimi Aç"
                className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8D5B28] hover:text-[#2D4C3A] cursor-pointer transition-colors z-10"
              >
                <Calendar className="h-4 w-4" />
              </button>
              <input
                ref={dateInputRef}
                type="date"
                value={tarih}
                onClick={(e) => {
                  try {
                    (e.target as HTMLInputElement).showPicker();
                  } catch {}
                }}
                onChange={(e) => setTarih(e.target.value)}
                className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] pl-10 pr-3.5 py-2 text-sm text-[#1F2922] focus:border-[#6F8B67] focus:bg-white focus:outline-none transition-colors cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#EAE6DF]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#EAE6DF] bg-white px-4 py-1.5 text-xs sm:text-sm font-medium text-[#1F2922] hover:bg-[#FAF8F5] transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-xs sm:text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                isDebt
                  ? "border border-[#8D5B28]/30 bg-[#8D5B28] hover:bg-[#72481F]"
                  : "border border-[#2D4C3A] bg-[#2D4C3A] hover:bg-[#20372A]"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{isDebt ? "Yazılıyor..." : "İşleniyor..."}</span>
                </>
              ) : (
                <span>{isDebt ? "Borcu Deftere Yaz" : "Tahsilatı İşle"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
