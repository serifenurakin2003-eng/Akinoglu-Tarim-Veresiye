"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Wheat,
  Sprout,
  Loader2,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  addDebt,
  addCollection,
  CustomerWithBalance,
  ProductItem,
  getProducts,
  DebtItemInput,
} from "@/lib/actions";

interface TransactionModalProps {
  isOpen: boolean;
  type: "borc" | "tahsilat";
  onClose: () => void;
  onSuccess: () => void;
  preSelectedCustomerId?: number | null;
  customers: CustomerWithBalance[];
  availableProducts?: ProductItem[];
  onOpenProductCatalog?: () => void;
}

interface LineItemState {
  id: string;
  urun_id: number | null;
  urun_kodu: string;
  urun_adi: string;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  toplam_fiyat: number;
}

const COMMON_UNITS = ["Torba", "Litre", "Kg", "Adet", "Koli", "Teneke", "Şişe"];

export default function TransactionModal({
  isOpen,
  type,
  onClose,
  onSuccess,
  preSelectedCustomerId,
  customers,
  availableProducts: propProducts,
  onOpenProductCatalog,
}: TransactionModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | "">("");
  const [tarih, setTarih] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tahsilat için serbest tutar / Borç için genel not
  const [directTutar, setDirectTutar] = useState("");
  const [genelAciklama, setGenelAciklama] = useState("");

  // Borç Giriş Modu: "items" (Ürünlü Kalemler) vs "quick" (Hızlı Serbest Tutar)
  const [debtInputMode, setDebtInputMode] = useState<"items" | "quick">("items");

  // Ürün Kalemleri Listesi
  const [lineItems, setLineItems] = useState<LineItemState[]>([]);
  const [products, setProducts] = useState<ProductItem[]>(propProducts || []);

  const dateInputRef = useRef<HTMLInputElement>(null);

  // Ürünleri yükle
  useEffect(() => {
    if (isOpen) {
      if (!propProducts || propProducts.length === 0) {
        getProducts().then(setProducts).catch(console.error);
      } else {
        setProducts(propProducts);
      }
    }
  }, [isOpen, propProducts]);

  // Modal her açıldığında varsayılanları sıfırla
  useEffect(() => {
    if (preSelectedCustomerId) {
      setSelectedCustomerId(preSelectedCustomerId);
    } else if (customers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(customers[0].musteri_id);
    }

    const today = new Date().toISOString().split("T")[0];
    setTarih(today);
    setDirectTutar("");
    setGenelAciklama("");
    setError(null);

    // Borç yazarken varsayılan 1 boş satırla başla
    if (type === "borc") {
      setDebtInputMode("items");
      setLineItems([
        {
          id: Math.random().toString(),
          urun_id: null,
          urun_kodu: "",
          urun_adi: "",
          miktar: 1,
          birim: "Torba",
          birim_fiyat: 0,
          toplam_fiyat: 0,
        },
      ]);
    } else {
      setLineItems([]);
    }
  }, [isOpen, preSelectedCustomerId, customers, type]);

  if (!isOpen) return null;

  const isDebt = type === "borc";
  const activeCustomer = customers.find(
    (c) => c.musteri_id === Number(selectedCustomerId)
  );

  // Kalemlerin toplamı
  const itemsTotal = lineItems.reduce((sum, item) => sum + (item.toplam_fiyat || 0), 0);

  // Nihai hesaplanan tutar
  const effectiveTotal = isDebt
    ? debtInputMode === "items"
      ? itemsTotal
      : parseFloat(directTutar.replace(",", ".")) || 0
    : parseFloat(directTutar.replace(",", ".")) || 0;

  // Yeni boş satır ekle
  function handleAddLineItem() {
    setLineItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        urun_id: null,
        urun_kodu: "",
        urun_adi: "",
        miktar: 1,
        birim: "Torba",
        birim_fiyat: 0,
        toplam_fiyat: 0,
      },
    ]);
  }

  // Satır sil
  function handleRemoveLineItem(id: string) {
    if (lineItems.length === 1) {
      // Tek satır kaldıysa sıfırla
      setLineItems([
        {
          id: Math.random().toString(),
          urun_id: null,
          urun_kodu: "",
          urun_adi: "",
          miktar: 1,
          birim: "Torba",
          birim_fiyat: 0,
          toplam_fiyat: 0,
        },
      ]);
      return;
    }
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }

  // Kod girilince veya seçilince ürün otomatik dolsun (Ses kaydı isteği: "01 yazdım mıydı oradan çıkacak")
  function handleCodeChange(rowId: string, codeValue: string) {
    const cleanCode = codeValue.trim().toUpperCase();
    const matched = products.find(
      (p) => p.kod.toUpperCase() === cleanCode
    );

    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;

        if (matched) {
          const miktar = item.miktar > 0 ? item.miktar : 1;
          const birim_fiyat = matched.fiyat;
          return {
            ...item,
            urun_id: matched.urun_id,
            urun_kodu: matched.kod,
            urun_adi: matched.ad,
            birim: matched.birim || "Torba",
            birim_fiyat,
            toplam_fiyat: Number((miktar * birim_fiyat).toFixed(2)),
          };
        }

        return {
          ...item,
          urun_kodu: codeValue,
        };
      })
    );
  }

  // Dropdown'dan ürün seçildiğinde
  function handleSelectProduct(rowId: string, urunIdStr: string) {
    const uId = Number(urunIdStr);
    const matched = products.find((p) => p.urun_id === uId);

    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;

        if (matched) {
          const miktar = item.miktar > 0 ? item.miktar : 1;
          const birim_fiyat = matched.fiyat;
          return {
            ...item,
            urun_id: matched.urun_id,
            urun_kodu: matched.kod,
            urun_adi: matched.ad,
            birim: matched.birim || "Torba",
            birim_fiyat,
            toplam_fiyat: Number((miktar * birim_fiyat).toFixed(2)),
          };
        }

        return item;
      })
    );
  }

  // Satır alanları güncelleme (Miktar, Fiyat, Ad vb.)
  function handleLineFieldChange(
    rowId: string,
    field: "urun_adi" | "miktar" | "birim" | "birim_fiyat",
    value: string | number
  ) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;

        const updated = { ...item, [field]: value };
        const m = Number(updated.miktar) || 0;
        const p = Number(updated.birim_fiyat) || 0;
        updated.toplam_fiyat = Number((m * p).toFixed(2));
        return updated;
      })
    );
  }

  // Form Gönderimi
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError("Lütfen bir müstahsil / çiftçi seçiniz.");
      return;
    }

    if (effectiveTotal <= 0) {
      setError("Toplam tutar 0'dan büyük olmalıdır.");
      return;
    }

    // Kalemli borç kaydı kontrolü
    let preparedKalemler: DebtItemInput[] | undefined = undefined;
    if (isDebt && debtInputMode === "items") {
      const validItems = lineItems.filter(
        (k) => k.urun_adi.trim() !== "" && k.miktar > 0 && k.birim_fiyat >= 0
      );

      if (validItems.length === 0) {
        setError("Lütfen en az bir geçerli ürün (isim, miktar ve fiyat) giriniz.");
        return;
      }

      preparedKalemler = validItems.map((k) => ({
        urun_id: k.urun_id,
        urun_kodu: k.urun_kodu || null,
        urun_adi: k.urun_adi,
        miktar: k.miktar,
        birim: k.birim,
        birim_fiyat: k.birim_fiyat,
        toplam_fiyat: k.toplam_fiyat,
      }));
    }

    try {
      setLoading(true);
      if (isDebt) {
        await addDebt({
          musteri_id: Number(selectedCustomerId),
          tutar: effectiveTotal,
          aciklama: genelAciklama,
          tarih,
          kalemler: preparedKalemler,
        });
      } else {
        await addCollection({
          musteri_id: Number(selectedCustomerId),
          odenen_tutar: effectiveTotal,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2922]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`relative flex max-h-[95vh] w-full flex-col rounded-2xl border border-[#EAE6DF] bg-white shadow-2xl transition-all ${
        isDebt && debtInputMode === "items" ? "max-w-4xl" : "max-w-md"
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE6DF] px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                isDebt
                  ? "bg-[#FAF3EB] text-[#8D5B28] border-[#E8DCCB]"
                  : "bg-[#EEF4F0] text-[#2D4C3A] border-[#D0E0D4]"
              }`}
            >
              {isDebt ? (
                <Wheat className="h-5 w-5" />
              ) : (
                <Sprout className="h-5 w-5" />
              )}
            </div>
            <div>
              <h3 className="font-serif-brand text-lg font-bold text-[#2D4C3A]">
                {isDebt ? "Vadeli Borç & Ürün Fişi Yaz" : "Tahsilat / Ödeme Al"}
              </h3>
              <p className="text-xs text-[#6B776D]">
                {isDebt
                  ? "Gübre, zirai ilaç, tohum satışı (Ürün kalemleriyle hesapla)"
                  : "Nakit veya banka yoluyla cari hesaba mahsup"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isDebt && onOpenProductCatalog && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProductCatalog();
                }}
                className="hidden sm:inline-flex items-center gap-1 rounded-full border border-[#D1D5DB] bg-[#FAF8F5] px-3 py-1 text-xs font-semibold text-[#8D5B28] hover:bg-[#FAF3EB] transition"
              >
                <Package className="h-3.5 w-3.5" />
                <span>Ürün Kataloğu / Fiyatlar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[#6B776D] hover:bg-[#FAF8F5] hover:text-[#1F2922] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-[#FAF3EB] border border-[#E8DCCB] p-3 text-xs font-medium text-[#8D5B28]">
              {error}
            </div>
          )}

          {/* Müşteri ve Tarih Seçimi Üst Bölümü */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1F2922]">
                Müstahsil / Çiftçi <span className="text-[#8D5B28]">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                disabled={Boolean(preSelectedCustomerId)}
                className="mt-1 w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] px-3 py-2 text-xs sm:text-sm font-medium text-[#1F2922] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition disabled:bg-[#F3EFEA]"
              >
                {customers.map((c) => (
                  <option key={c.musteri_id} value={c.musteri_id}>
                    {c.ad_soyad} {c.mahalle ? `(${c.mahalle})` : ""} — Bakiye:{" "}
                    {c.kalan_bakiye.toLocaleString("tr-TR")} ₺
                  </option>
                ))}
              </select>
              {activeCustomer && (
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#6B776D]">
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

            {/* Tarih */}
            <div>
              <label className="block text-xs font-semibold text-[#1F2922]">
                İşlem Tarihi
              </label>
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
                  className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#8D5B28] cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] pl-8 pr-2.5 py-2 text-xs text-[#1F2922] focus:border-[#2D4C3A] focus:bg-white focus:outline-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Borç Modu Seçicisi (Detaylı Ürünlü Fiş vs Hızlı Serbest Tutar) */}
          {isDebt && (
            <div className="flex items-center justify-between border-y border-[#EAE6DF] py-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDebtInputMode("items")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    debtInputMode === "items"
                      ? "bg-[#2D4C3A] text-white shadow-xs"
                      : "bg-[#FAF8F5] text-[#4B5563] hover:bg-[#EEF4F0] hover:text-[#2D4C3A]"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Detaylı Ürün Kalemleri (Önerilen)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDebtInputMode("quick")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                    debtInputMode === "quick"
                      ? "bg-[#8D5B28] text-white shadow-xs"
                      : "bg-[#FAF8F5] text-[#4B5563] hover:bg-[#FAF3EB] hover:text-[#8D5B28]"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Hızlı Serbest Tutar Girişi</span>
                </button>
              </div>

              {debtInputMode === "items" && (
                <span className="text-xs font-semibold text-[#8D5B28]">
                  {lineItems.length} Kalem
                </span>
              )}
            </div>
          )}

          {/* 1. SEÇENEK: DETAYLI ÜRÜN KALEMLERİ LİSTESİ */}
          {isDebt && debtInputMode === "items" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#6B776D]">
                <p>
                  Ürün kodunu (örn: <span className="font-mono font-bold text-[#8D5B28]">01</span>) yazıp veya listeden seçebilirsiniz. İsim, birim ve güncel fiyat otomatik gelir.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#EAE6DF]">
                <table className="min-w-full divide-y divide-[#EAE6DF] text-left text-xs">
                  <thead className="bg-[#FAF8F5] font-bold uppercase tracking-wider text-[#4B5563]">
                    <tr>
                      <th className="px-3 py-2.5 w-24">Kod</th>
                      <th className="px-3 py-2.5 min-w-[200px]">Ürün / İlaç Adı</th>
                      <th className="px-3 py-2.5 w-24">Miktar</th>
                      <th className="px-3 py-2.5 w-24">Birim</th>
                      <th className="px-3 py-2.5 w-28 text-right">Birim Fiyat</th>
                      <th className="px-3 py-2.5 w-28 text-right">Tutar</th>
                      <th className="px-2 py-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE6DF] bg-white">
                    {lineItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-[#FAF8F5]/60">
                        {/* Kod */}
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="01"
                            value={item.urun_kodu}
                            onChange={(e) => handleCodeChange(item.id, e.target.value)}
                            className="w-full rounded-lg border border-[#D1D5DB] bg-[#FAF8F5] px-2 py-1 font-mono text-xs font-bold uppercase text-[#8D5B28] focus:border-[#2D4C3A] focus:bg-white focus:outline-none"
                          />
                        </td>

                        {/* Ürün Seçimi & İsmi */}
                        <td className="p-2">
                          <div className="flex flex-col gap-1">
                            <select
                              value={item.urun_id || ""}
                              onChange={(e) => handleSelectProduct(item.id, e.target.value)}
                              className="w-full rounded-lg border border-[#D1D5DB] bg-white px-2 py-1 text-xs font-medium text-[#1F2922] focus:border-[#2D4C3A] focus:outline-none"
                            >
                              <option value="">-- Katalogdan Seç --</option>
                              {products.map((p) => (
                                <option key={p.urun_id} value={p.urun_id}>
                                  [{p.kod}] {p.ad} — {p.fiyat} ₺ / {p.birim}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              required
                              placeholder="Ürün adı (Örn: Çil İlacı, Zehir, Gübre)"
                              value={item.urun_adi}
                              onChange={(e) =>
                                handleLineFieldChange(item.id, "urun_adi", e.target.value)
                              }
                              className="w-full rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] px-2 py-1 text-xs text-[#1F2922] focus:border-[#2D4C3A] focus:bg-white focus:outline-none"
                            />
                          </div>
                        </td>

                        {/* Miktar */}
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={item.miktar || ""}
                            onChange={(e) =>
                              handleLineFieldChange(
                                item.id,
                                "miktar",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full rounded-lg border border-[#D1D5DB] bg-white px-2 py-1 text-xs font-bold text-[#1F2922] focus:border-[#2D4C3A] focus:outline-none tabular-nums"
                          />
                        </td>

                        {/* Birim */}
                        <td className="p-2">
                          <select
                            value={item.birim}
                            onChange={(e) =>
                              handleLineFieldChange(item.id, "birim", e.target.value)
                            }
                            className="w-full rounded-lg border border-[#D1D5DB] bg-white px-1.5 py-1 text-xs text-[#4B5563] focus:border-[#2D4C3A] focus:outline-none"
                          >
                            {COMMON_UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Birim Fiyat */}
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={item.birim_fiyat || ""}
                            onChange={(e) =>
                              handleLineFieldChange(
                                item.id,
                                "birim_fiyat",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className="w-full rounded-lg border border-[#D1D5DB] bg-white px-2 py-1 font-serif-brand text-xs font-bold text-right text-[#1F2922] focus:border-[#2D4C3A] focus:outline-none tabular-nums"
                          />
                        </td>

                        {/* Tutar */}
                        <td className="p-2 text-right font-serif-brand font-bold text-xs text-[#8D5B28] tabular-nums whitespace-nowrap">
                          {item.toplam_fiyat.toLocaleString("tr-TR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          ₺
                        </td>

                        {/* Sil */}
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(item.id)}
                            title="Satırı Kaldır"
                            className="rounded-full p-1 text-[#9CA3AF] hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Satır Ekle Butonu */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-[#8D5B28] bg-[#FAF3EB]/50 px-4 py-1.5 text-xs font-semibold text-[#8D5B28] hover:bg-[#FAF3EB] transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Yeni Ürün / Gübre / İlaç Satırı Ekle</span>
                </button>

                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-[#4B5563]">
                    Kalemler Toplamı:
                  </span>
                  <span className="font-serif-brand text-lg font-extrabold text-[#8D5B28] tabular-nums">
                    {itemsTotal.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                    })}{" "}
                    ₺
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 2. SEÇENEK VEYA TAHSİLAT: SERBEST TUTAR GİRİŞİ */}
          {(!isDebt || debtInputMode === "quick") && (
            <div>
              <label className="block text-xs font-semibold text-[#1F2922]">
                {isDebt ? "Borç Tutarı (TL)" : "Tahsil Edilen Tutar (TL)"}{" "}
                <span className="text-[#8D5B28]">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={directTutar}
                  onChange={(e) => setDirectTutar(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] px-3.5 py-2 font-serif-brand text-xl font-bold text-[#1F2922] placeholder-[#9CA3AF] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition tabular-nums"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 font-serif-brand font-bold text-[#8D5B28]">
                  ₺
                </div>
              </div>
            </div>
          )}

          {/* Genel Açıklama Notu */}
          <div>
            <label className="block text-xs font-semibold text-[#1F2922]">
              {isDebt ? "Ek Not / Fiş Açıklaması (İsteğe Bağlı)" : "Tahsilat Açıklaması"}
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
                <FileText className="h-3.5 w-3.5" />
              </div>
              <input
                type="text"
                value={genelAciklama}
                onChange={(e) => setGenelAciklama(e.target.value)}
                placeholder={
                  isDebt
                    ? "Boş bırakırsanız ürünlerden otomatik özet oluşturulur"
                    : "Örn: Elden nakit, Ziraat Bankası havale"
                }
                className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] pl-9 pr-3.5 py-2 text-xs text-[#1F2922] placeholder-[#9CA3AF] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition"
              />
            </div>
          </div>

          {/* Footer Butonları & Genel Toplam */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#EAE6DF]">
            <div className="flex items-baseline gap-2 self-start sm:self-center">
              <span className="text-xs font-medium text-[#6B776D]">
                Genel Deftere Yazılacak Tutar:
              </span>
              <span
                className={`font-serif-brand text-xl font-extrabold tabular-nums ${
                  isDebt ? "text-[#8D5B28]" : "text-[#2D4C3A]"
                }`}
              >
                {effectiveTotal.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                })}{" "}
                ₺
              </span>
            </div>

            <div className="flex items-center gap-2 self-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-[#D1D5DB] bg-white px-4 py-2 text-xs font-semibold text-[#4B5563] hover:bg-[#FAF8F5]"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading || effectiveTotal <= 0}
                className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold text-white transition disabled:opacity-50 ${
                  isDebt
                    ? "bg-[#8D5B28] hover:bg-[#72481F]"
                    : "bg-[#2D4C3A] hover:bg-[#1E3427]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{isDebt ? "Yazılıyor..." : "İşleniyor..."}</span>
                  </>
                ) : (
                  <span>{isDebt ? "Borcu Deftere & Carisine Yaz" : "Tahsilatı İşle"}</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
