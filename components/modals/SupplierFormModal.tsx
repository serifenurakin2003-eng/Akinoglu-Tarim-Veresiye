"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  User,
  Phone,
  MapPin,
  FileText,
  Loader2,
  TrendingDown,
  ArrowUpRight,
  Calendar,
} from "lucide-react";
import {
  createSupplier,
  updateSupplier,
  createFirmaBorc,
  createFirmaOdeme,
  SupplierWithBalance,
} from "@/lib/supplier-actions";

type ModalMode =
  | "add-supplier"
  | "edit-supplier"
  | "add-debt"
  | "add-payment";

interface SupplierFormModalProps {
  isOpen: boolean;
  mode: ModalMode;
  supplier?: SupplierWithBalance | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SupplierFormModal({
  isOpen,
  mode,
  supplier,
  onClose,
  onSuccess,
}: SupplierFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tedarikçi form alanları
  const [firmaAdi, setFirmaAdi] = useState(supplier?.firma_adi ?? "");
  const [yetkili, setYetkili] = useState(supplier?.yetkili_kisi ?? "");
  const [telefon, setTelefon] = useState(supplier?.telefon ?? "");
  const [adres, setAdres] = useState(supplier?.adres ?? "");

  // Borç/Ödeme form alanları
  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [tarih, setTarih] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit-supplier" && supplier) {
        setFirmaAdi(supplier.firma_adi);
        setYetkili(supplier.yetkili_kisi || "");
        setTelefon(supplier.telefon || "");
        setAdres(supplier.adres || "");
      } else if (mode === "add-supplier") {
        setFirmaAdi("");
        setYetkili("");
        setTelefon("");
        setAdres("");
      }
      setTutar("");
      setAciklama("");
      setTarih(new Date().toISOString().split("T")[0]);
      setError(null);
    }
  }, [isOpen, mode, supplier]);

  if (!isOpen) return null;

  const isSupplierMode = mode === "add-supplier" || mode === "edit-supplier";

  const titles: Record<ModalMode, string> = {
    "add-supplier": "Yeni Firma / Tedarikçi Ekle",
    "edit-supplier": "Firma Bilgilerini Düzenle",
    "add-debt": `Borç Ekle — ${supplier?.firma_adi}`,
    "add-payment": `Ödeme Yaptık — ${supplier?.firma_adi}`,
  };

  const icons: Record<ModalMode, React.ReactNode> = {
    "add-supplier": <Building2 className="h-5 w-5" />,
    "edit-supplier": <Building2 className="h-5 w-5" />,
    "add-debt": <TrendingDown className="h-5 w-5" />,
    "add-payment": <ArrowUpRight className="h-5 w-5" />,
  };

  const iconColors: Record<ModalMode, string> = {
    "add-supplier": "bg-[#FAF3EB] text-[#8D5B28] border-[#E8DCCB]",
    "edit-supplier": "bg-[#FAF3EB] text-[#8D5B28] border-[#E8DCCB]",
    "add-debt": "bg-red-50 text-red-700 border-red-200",
    "add-payment": "bg-[#EEF4F0] text-[#2D4C3A] border-[#D0E0D4]",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "add-supplier") {
        await createSupplier({
          firma_adi: firmaAdi,
          yetkili_kisi: yetkili,
          telefon,
          adres,
        });
      } else if (mode === "edit-supplier" && supplier) {
        await updateSupplier(supplier.tedarikci_id, {
          firma_adi: firmaAdi,
          yetkili_kisi: yetkili,
          telefon,
          adres,
        });
      } else if (mode === "add-debt" && supplier) {
        const tutarNum = parseFloat(tutar.replace(",", "."));
        if (isNaN(tutarNum) || tutarNum <= 0) {
          throw new Error("Geçerli bir tutar giriniz.");
        }
        await createFirmaBorc({
          tedarikci_id: supplier.tedarikci_id,
          tutar: tutarNum,
          aciklama,
          tarih,
        });
      } else if (mode === "add-payment" && supplier) {
        const tutarNum = parseFloat(tutar.replace(",", "."));
        if (isNaN(tutarNum) || tutarNum <= 0) {
          throw new Error("Geçerli bir ödeme tutarı giriniz.");
        }
        if (supplier.kalan_borc <= 0) {
          throw new Error("Bu firmanın ödenmesi gereken borcu bulunmamaktadır.");
        }
        if (tutarNum > supplier.kalan_borc) {
          throw new Error(
            `Ödeme tutarı kalan borçtan (${supplier.kalan_borc.toLocaleString("tr-TR")} ₺) fazla olamaz.`
          );
        }
        await createFirmaOdeme({
          tedarikci_id: supplier.tedarikci_id,
          odenen_tutar: tutarNum,
          aciklama,
          tarih,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F2922]/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-[#EAE6DF] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE6DF] p-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border ${iconColors[mode]}`}
            >
              {icons[mode]}
            </div>
            <h3 className="text-lg font-bold text-[#1F2922]">{titles[mode]}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6B776D] hover:bg-[#FAF8F5] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-medium">
              <span>{error}</span>
            </div>
          )}

          {isSupplierMode ? (
            <>
              {/* Firma Adı */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">
                  <Building2 className="inline h-3.5 w-3.5 mr-1 text-[#8D5B28]" />
                  <span>Firma Adı</span> <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={firmaAdi}
                  onChange={(e) => setFirmaAdi(e.target.value)}
                  placeholder="Örn: Toros Gübre A.Ş."
                  required
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#8D5B28] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* Yetkili Kişi */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">
                  <User className="inline h-3.5 w-3.5 mr-1 text-[#6F8B67]" />
                  <span>Yetkili Kişi</span>
                </label>
                <input
                  type="text"
                  value={yetkili}
                  onChange={(e) => setYetkili(e.target.value)}
                  placeholder="Ad Soyad"
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#8D5B28] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">
                  <Phone className="inline h-3.5 w-3.5 mr-1 text-[#6F8B67]" />
                  <span>Telefon</span>
                </label>
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="0555 123 45 67"
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#8D5B28] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* Adres */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">
                  <MapPin className="inline h-3.5 w-3.5 mr-1 text-[#8D5B28]" />
                  <span>Adres / Şehir</span>
                </label>
                <input
                  type="text"
                  value={adres}
                  onChange={(e) => setAdres(e.target.value)}
                  placeholder="Konya, Türkiye"
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#8D5B28] focus:bg-white focus:outline-none transition"
                />
              </div>
            </>
          ) : (
            <>
              {/* Tutar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#374151]">
                    <span>Tutar (₺)</span> <span className="text-red-500">*</span>
                  </label>
                  {mode === "add-payment" && supplier && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#6B7280]">Kalan Borç:</span>
                      <strong className="text-red-700 font-bold">
                        {supplier.kalan_borc.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺
                      </strong>
                      {supplier.kalan_borc > 0 && (
                        <button
                          type="button"
                          onClick={() => setTutar(supplier.kalan_borc.toString())}
                          className="ml-1 text-[11px] font-bold text-[#2D4C3A] hover:underline"
                        >
                          (Tümünü Öde)
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={mode === "add-payment" && supplier ? supplier.kalan_borc : undefined}
                  value={tutar}
                  onChange={(e) => setTutar(e.target.value)}
                  placeholder="0,00"
                  required
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#8D5B28] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* Açıklama */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">
                  <FileText className="inline h-3.5 w-3.5 mr-1 text-[#6F8B67]" />
                  <span>Açıklama</span>
                </label>
                <input
                  type="text"
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder={
                    mode === "add-debt"
                      ? "Örn: Gübre alımı faturası"
                      : "Örn: Banka havalesi ile ödeme"
                  }
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#8D5B28] focus:bg-white focus:outline-none transition"
                />
              </div>

              {/* Tarih */}
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1.5">
                  <Calendar className="inline h-3.5 w-3.5 mr-1 text-[#6F8B67]" />
                  <span>Tarih</span>
                </label>
                <input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#111827] focus:border-[#8D5B28] focus:bg-white focus:outline-none transition"
                />
              </div>
            </>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#D1D5DB] bg-white py-2.5 text-sm font-semibold text-[#4B5563] hover:bg-[#FAF8F5] transition"
            >
              <span>İptal</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white transition disabled:opacity-60 ${
                mode === "add-debt"
                  ? "bg-red-600 hover:bg-red-700"
                  : mode === "add-payment"
                  ? "bg-[#2D4C3A] hover:bg-[#1E3427]"
                  : "bg-[#8D5B28] hover:bg-[#72481F]"
              }`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>
                {mode === "add-supplier"
                  ? "Firma Ekle"
                  : mode === "edit-supplier"
                  ? "Değişiklikleri Kaydet"
                  : mode === "add-debt"
                  ? "Borç Kaydet"
                  : "Ödemeyi Kaydet"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
