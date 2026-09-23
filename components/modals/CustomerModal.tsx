"use client";

import { useState, useEffect } from "react";
import { X, User, Phone, MapPin, Loader2 } from "lucide-react";
import { createCustomer, updateCustomer, CustomerWithBalance } from "@/lib/actions";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: CustomerWithBalance | null;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSuccess,
  customer,
}: CustomerModalProps) {
  const [adSoyad, setAdSoyad] = useState("");
  const [telefon, setTelefon] = useState("");
  const [mahalle, setMahalle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setAdSoyad(customer.ad_soyad || "");
      setTelefon(customer.telefon || "");
      setMahalle(customer.mahalle || "");
    } else {
      setAdSoyad("");
      setTelefon("");
      setMahalle("");
    }
    setError(null);
  }, [customer, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!adSoyad.trim()) {
      setError("Lütfen müstahsil ad ve soyadını giriniz.");
      return;
    }

    const cleanPhone = telefon.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 11) {
      setError("Telefon numarası tam 11 haneli olmalıdır (Örn: 05321234567).");
      return;
    }

    try {
      setLoading(true);
      if (customer) {
        await updateCustomer(customer.musteri_id, {
          ad_soyad: adSoyad,
          telefon: cleanPhone,
          mahalle,
        });
      } else {
        await createCustomer({
          ad_soyad: adSoyad,
          telefon: cleanPhone,
          mahalle,
        });
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "İşlem sırasında bir hata oluştu."
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
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF8F5] text-[#2D4C3A] border border-[#EAE6DF]">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif-brand text-lg font-bold text-[#2D4C3A]">
                {customer ? "Müşteri Bilgilerini Düzenle" : "Yeni Müstahsil / Müşteri Kaydı"}
              </h3>
              <p className="text-[11px] text-[#6B776D]">
                Cari hesap kartı ve iletişim bilgileri
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
            <div className="rounded-xl bg-[#FAF3EB] border border-[#E8DCCB] p-3 text-xs font-semibold text-[#8D5B28]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#1F2922]">
              Ad Soyad / Firma Ünvanı <span className="text-[#8D5B28]">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                required
                value={adSoyad}
                onChange={(e) => setAdSoyad(e.target.value)}
                placeholder="Örn: Mehmet Çelik"
                className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] px-3.5 py-2 text-sm text-[#1F2922] placeholder-[#6B776D]/60 focus:border-[#6F8B67] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2922]">
              Telefon Numarası (11 Hane Zorunlu) <span className="text-[#8D5B28]">*</span>
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6B776D]">
                <Phone className="h-3.5 w-3.5" />
              </div>
              <input
                type="tel"
                required
                maxLength={11}
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="Örn: 05321234567"
                className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] pl-9 pr-3.5 py-2 text-sm text-[#1F2922] placeholder-[#6B776D]/60 focus:border-[#6F8B67] focus:bg-white focus:outline-none transition-colors"
              />
            </div>
            <p className="mt-1 text-[11px] text-[#6B776D]">Başında 0 olacak şekilde 11 hane giriniz.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1F2922]">
              Köy / Mahalle
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6B776D]">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={mahalle}
                onChange={(e) => setMahalle(e.target.value)}
                placeholder="Örn: Yeniköy, Çakırlar vb."
                className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF8F5] pl-9 pr-3.5 py-2 text-sm text-[#1F2922] placeholder-[#6B776D]/60 focus:border-[#6F8B67] focus:bg-white focus:outline-none transition-colors"
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
              className="inline-flex items-center gap-1.5 rounded-full border border-[#2D4C3A] bg-[#2D4C3A] px-5 py-1.5 text-xs sm:text-sm font-medium text-white hover:bg-[#20372A] disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{customer ? "Güncelleniyor..." : "Kaydediliyor..."}</span>
                </>
              ) : (
                <span>{customer ? "Güncelle" : "Müşteri Kaydet"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
