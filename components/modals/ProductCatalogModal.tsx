"use client";

import { useState, useEffect } from "react";
import {
  X,
  PackageCheck,
  Plus,
  Search,
  Check,
  Trash2,
  Edit2,
  Loader2,
  Tag,
  AlertCircle,
} from "lucide-react";
import {
  ProductItem,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/actions";

interface ProductCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsChanged?: () => void;
  requirePassword: (label: string, action: () => void) => void;
}

const CATEGORIES = ["Tümü", "Zirai İlaç", "Gübre", "Tohum", "Fide", "Diğer"];
const COMMON_UNITS = ["Adet", "Litre", "Torba", "Kg", "Teneke", "Koli", "Şişe"];

export default function ProductCatalogModal({
  isOpen,
  onClose,
  onProductsChanged,
  requirePassword,
}: ProductCatalogModalProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");

  // Yeni Ürün Ekleme Form Durumu
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Zirai İlaç");
  const [newUnit, setNewUnit] = useState("Litre");
  const [newPrice, setNewPrice] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Satır içi Fiyat Düzenleme Durumu
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [editPriceValue, setEditPriceValue] = useState("");
  const [savingPriceId, setSavingPriceId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  async function loadProducts() {
    try {
      setLoading(true);
      const list = await getProducts();
      setProducts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchQuery =
      !q ||
      p.kod.toLowerCase().includes(q) ||
      p.ad.toLowerCase().includes(q) ||
      (p.kategori && p.kategori.toLowerCase().includes(q));

    const matchCat =
      selectedCategory === "Tümü" || p.kategori === selectedCategory;

    return matchQuery && matchCat;
  });

  // Hızlı Fiyat Güncelleme (Ses kaydı isteği: "Fiyat otomatik değişti miydi ben onu otomatik güncelleyeyim")
  async function handleQuickPriceSave(product: ProductItem) {
    const numericPrice = parseFloat(editPriceValue.replace(",", "."));
    if (isNaN(numericPrice) || numericPrice < 0) {
      alert("Lütfen geçerli bir fiyat giriniz.");
      return;
    }

    try {
      setSavingPriceId(product.urun_id);
      await updateProduct(product.urun_id, {
        kod: product.kod,
        ad: product.ad,
        kategori: product.kategori || undefined,
        birim: product.birim,
        fiyat: numericPrice,
      });

      setProducts((prev) =>
        prev.map((item) =>
          item.urun_id === product.urun_id ? { ...item, fiyat: numericPrice } : item
        )
      );
      setEditingPriceId(null);
      onProductsChanged?.();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Fiyat güncellenirken hata oluştu.");
    } finally {
      setSavingPriceId(null);
    }
  }

  // Yeni Ürün Kaydet
  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const priceNum = parseFloat(newPrice.replace(",", "."));
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Geçerli bir birim satış fiyatı giriniz.");
      return;
    }

    try {
      setFormLoading(true);
      await createProduct({
        kod: newCode,
        ad: newName,
        kategori: newCategory,
        birim: newUnit,
        fiyat: priceNum,
      });

      await loadProducts();
      setIsAdding(false);
      setNewCode("");
      setNewName("");
      setNewPrice("");
      onProductsChanged?.();
    } catch (err: unknown) {
      setFormError(
        err instanceof Error ? err.message : "Ürün eklenirken bir hata oluştu."
      );
    } finally {
      setFormLoading(false);
    }
  }

  // Ürün Sil
  function handleDeleteProduct(product: ProductItem) {
    requirePassword(`"${product.ad}" Ürünü Sil`, () => {
      if (!confirm(`"${product.kod} - ${product.ad}" ürününü listeden silmek istediğinize emin misiniz?`)) {
        return;
      }

      deleteProduct(product.urun_id)
        .then(() => {
          loadProducts();
          onProductsChanged?.();
        })
        .catch((err: unknown) => {
          alert(err instanceof Error ? err.message : "Ürün silinirken hata oluştu.");
        });
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#1F2922]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-[#EAE6DF] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE6DF] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF3EB] text-[#8D5B28] border border-[#E8DCCB]">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-brand text-xl font-bold text-[#2D4C3A]">
                  Zirai Ürün &amp; Fiyat Kataloğu
                </h3>
                <span className="rounded-full bg-[#EEF4F0] px-2.5 py-0.5 text-[11px] font-semibold text-[#2D4C3A] border border-[#D0E0D4]">
                  {products.length} Kayıtlı Ürün
                </span>
              </div>
              <p className="text-xs text-[#6B776D]">
                İlaçlar, gübreler, tohumlar ve güncel birim satış fiyatları
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#2D4C3A] bg-[#2D4C3A] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1E3427] transition"
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Ürün / İlaç Ekle</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[#6B776D] hover:bg-[#FAF8F5] hover:text-[#1F2922] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Yeni Ürün Ekleme Form Paneli (Açılır/Kapanır) */}
        {isAdding && (
          <form
            onSubmit={handleCreateProduct}
            className="border-b border-[#EAE6DF] bg-[#FAF8F5] p-5 space-y-4 animate-in slide-in-from-top duration-150"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D4C3A] flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-[#8D5B28]" />
                Yeni Ürün Tanımlama (Kod &amp; Fiyat)
              </h4>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-xs text-[#6B776D] hover:underline"
              >
                Vazgeç
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#1F2922]">
                  Ürün Kodu <span className="text-[#8D5B28]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 01, 09, GBR-1"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-bold uppercase text-[#1F2922] focus:border-[#2D4C3A] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-[#1F2922]">
                  Ürün / İlaç Adı <span className="text-[#8D5B28]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Çil İlacı, 20-20 Taban Gübresi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-medium text-[#1F2922] focus:border-[#2D4C3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1F2922]">
                  Kategori
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-medium text-[#1F2922] focus:border-[#2D4C3A] focus:outline-none"
                >
                  {CATEGORIES.filter((c) => c !== "Tümü").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1F2922]">
                  Birim
                </label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-1.5 text-xs font-medium text-[#1F2922] focus:border-[#2D4C3A] focus:outline-none"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="w-full sm:w-64">
                <label className="block text-[11px] font-semibold text-[#1F2922]">
                  Birim Satış Fiyatı (TL) <span className="text-[#8D5B28]">*</span>
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-1.5 font-serif-brand text-sm font-bold text-[#1F2922] focus:border-[#2D4C3A] focus:outline-none"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 font-serif-brand font-bold text-[#8D5B28]">
                    ₺
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="rounded-full border border-[#D1D5DB] bg-white px-4 py-1.5 text-xs font-semibold text-[#4B5563] hover:bg-[#FAF8F5]"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#8D5B28] bg-[#8D5B28] px-5 py-1.5 text-xs font-semibold text-white hover:bg-[#72481F] transition disabled:opacity-50"
                >
                  {formLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Kataloğa Kaydet</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Filtre ve Arama Çubuğu */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE6DF] bg-white p-4">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#9CA3AF]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kod veya ürün adı ara (örn: 01, gübre)..."
              className="w-full rounded-full border border-[#D1D5DB] bg-[#FAF8F5] pl-9 pr-3.5 py-1.5 text-xs text-[#1F2922] placeholder-[#9CA3AF] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Kategori Sekmeleri */}
          <div className="flex flex-wrap items-center gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? "bg-[#2D4C3A] text-white shadow-xs"
                    : "bg-[#FAF8F5] text-[#4B5563] hover:bg-[#EEF4F0] hover:text-[#2D4C3A]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tablo */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex h-48 flex-col items-center justify-center text-[#6B776D]">
              <Loader2 className="h-7 w-7 animate-spin text-[#6F8B67]" />
              <p className="mt-2 text-xs">Ürün listesi yükleniyor...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-[#6B776D]">
              <PackageCheck className="h-8 w-8 text-[#9CA3AF]" />
              <p className="mt-2 text-xs font-medium">Aramaya uygun ürün bulunamadı.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[#EAE6DF]">
              <table className="min-w-full divide-y divide-[#EAE6DF] text-left text-xs">
                <thead className="bg-[#FAF8F5] font-bold uppercase tracking-wider text-[#4B5563]">
                  <tr>
                    <th className="px-4 py-3">Ürün Kodu</th>
                    <th className="px-5 py-3">Ürün &amp; İlaç Adı</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Birim</th>
                    <th className="px-5 py-3 text-right">
                      Güncel Birim Fiyat (Tek Tıkla Düzenle)
                    </th>
                    <th className="px-4 py-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE6DF]">
                  {filteredProducts.map((p) => {
                    const isEditing = editingPriceId === p.urun_id;
                    const isSaving = savingPriceId === p.urun_id;

                    return (
                      <tr
                        key={p.urun_id}
                        className="hover:bg-[#FAF8F5]/80 transition-colors"
                      >
                        {/* Kod */}
                        <td className="whitespace-nowrap px-4 py-3 font-mono font-bold text-[#8D5B28]">
                          <span className="rounded-md bg-[#FAF3EB] border border-[#E8DCCB] px-2 py-0.5">
                            {p.kod}
                          </span>
                        </td>

                        {/* Ad */}
                        <td className="px-5 py-3 font-semibold text-[#111827]">
                          {p.ad}
                        </td>

                        {/* Kategori */}
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="inline-flex rounded-full bg-[#FAF8F5] border border-[#E5E0D8] px-2.5 py-0.5 text-[10px] font-semibold text-[#4B5563]">
                            {p.kategori || "Genel"}
                          </span>
                        </td>

                        {/* Birim */}
                        <td className="whitespace-nowrap px-4 py-3 text-[#6B7280] font-medium">
                          {p.birim}
                        </td>

                        {/* Fiyat (Hızlı Güncelleme) */}
                        <td className="whitespace-nowrap px-5 py-2 text-right">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                autoFocus
                                value={editPriceValue}
                                onChange={(e) => setEditPriceValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleQuickPriceSave(p);
                                  if (e.key === "Escape") setEditingPriceId(null);
                                }}
                                className="w-24 rounded-lg border border-[#8D5B28] bg-white px-2 py-1 font-serif-brand text-xs font-bold text-[#1F2922] focus:outline-none"
                              />
                              <button
                                onClick={() => handleQuickPriceSave(p)}
                                disabled={isSaving}
                                title="Kaydet"
                                className="rounded-md bg-[#2D4C3A] p-1 text-white hover:bg-[#1E3427]"
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingPriceId(null)}
                                title="Vazgeç"
                                className="rounded-md border border-[#D1D5DB] p-1 text-[#6B7280] hover:bg-[#FAF8F5]"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPriceId(p.urun_id);
                                setEditPriceValue(p.fiyat.toString());
                              }}
                              title="Fiyatı değiştirmek için tıkla"
                              className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-[#FAF3EB] transition"
                            >
                              <span className="font-serif-brand font-bold text-sm text-[#111827] group-hover:text-[#8D5B28] tabular-nums">
                                {p.fiyat.toLocaleString("tr-TR", {
                                  minimumFractionDigits: 2,
                                })}{" "}
                                ₺
                              </span>
                              <Edit2 className="h-3 w-3 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition" />
                            </button>
                          )}
                        </td>

                        {/* Sil */}
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            title="Katalogdan Sil"
                            className="rounded-full p-1 text-[#9CA3AF] hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

        {/* Footer Bilgilendirme */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#EAE6DF] bg-[#FAF8F5] px-6 py-3 text-xs text-[#6B776D]">
          <p className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            Buradaki fiyat değişimleri Borç Yazma ekranına anında otomatik yansır.
          </p>
          <button
            onClick={onClose}
            className="mt-2 sm:mt-0 rounded-full border border-[#D1D5DB] bg-white px-5 py-1 text-xs font-semibold text-[#1F2922] hover:bg-[#FAF8F5] transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
