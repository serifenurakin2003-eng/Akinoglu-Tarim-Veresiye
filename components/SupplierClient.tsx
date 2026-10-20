"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Building2,
  Phone,
  MapPin,
  User,
  Edit2,
  Trash2,
  Loader2,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { SupplierWithBalance, deleteSupplier } from "@/lib/supplier-actions";
import SupplierDetailModal from "@/components/modals/SupplierDetailModal";
import SupplierFormModal from "@/components/modals/SupplierFormModal";
import { useRouter } from "next/navigation";

interface SupplierClientProps {
  initialSuppliers: SupplierWithBalance[];
  errorMessage?: string | null;
}

function formatCurrency(n: number): string {
  return (
    n.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₺"
  );
}

export default function SupplierClient({ initialSuppliers }: SupplierClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithBalance | null>(null);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<
    "add-supplier" | "edit-supplier" | "add-debt" | "add-payment"
  >("add-supplier");
  const [formSupplier, setFormSupplier] = useState<SupplierWithBalance | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return initialSuppliers;
    return initialSuppliers.filter(
      (s) =>
        s.firma_adi.toLowerCase().includes(q) ||
        s.yetkili_kisi?.toLowerCase().includes(q) ||
        s.telefon?.includes(q) ||
        s.adres?.toLowerCase().includes(q)
    );
  }, [initialSuppliers, search]);

  const totals = useMemo(
    () => ({
      toplam_borc: initialSuppliers.reduce((s, x) => s + x.toplam_borc, 0),
      toplam_odeme: initialSuppliers.reduce((s, x) => s + x.toplam_odeme, 0),
      kalan_borc: initialSuppliers.reduce((s, x) => s + x.kalan_borc, 0),
    }),
    [initialSuppliers]
  );

  function handleDataChanged() {
    router.refresh();
  }

  function openDetail(s: SupplierWithBalance) {
    setSelectedSupplier(s);
    setDetailOpen(true);
  }

  function openAddSupplier() {
    setFormSupplier(null);
    setFormMode("add-supplier");
    setFormOpen(true);
  }

  function openEditSupplier(s: SupplierWithBalance) {
    setFormSupplier(s);
    setFormMode("edit-supplier");
    setFormOpen(true);
  }

  function openAddDebt(tedarikci_id: number) {
    const s = initialSuppliers.find((x) => x.tedarikci_id === tedarikci_id) ?? null;
    setFormSupplier(s);
    setFormMode("add-debt");
    setFormOpen(true);
  }

  function openAddPayment(tedarikci_id: number) {
    const s = initialSuppliers.find((x) => x.tedarikci_id === tedarikci_id) ?? null;
    setFormSupplier(s);
    setFormMode("add-payment");
    setFormOpen(true);
  }

  async function handleDelete(s: SupplierWithBalance) {
    if (deletingId !== null) return;
    if (
      !confirm(
        `"${s.firma_adi}" firmasını ve tüm borç/ödeme geçmişini silmek istediğinize emin misiniz?`
      )
    )
      return;
    setDeletingId(s.tedarikci_id);
    try {
      await deleteSupplier(s.tedarikci_id);
      handleDataChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Silme işlemi başarısız.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1F2922]">
        {/* Page Header */}
        <div className="border-b border-[#E5E0D8] bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF3EB] border border-[#E8DCCB]">
                    <Building2 className="h-5 w-5 text-[#8D5B28]" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1F2922]">
                    Firma Borçları &amp; Tedarikçi Takibi
                  </h1>
                </div>
                <p className="text-sm text-[#6B7280]">
                  Tedarikçi firmalara olan borçlarımız, yapılan ödemeler ve cari hesap ekstreleri
                </p>
              </div>
              <button
                onClick={openAddSupplier}
                className="inline-flex items-center gap-2 rounded-full border border-[#8D5B28] bg-[#8D5B28] px-4 py-2 text-sm font-bold text-white hover:bg-[#72481F] transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni Firma Ekle</span>
              </button>
            </div>
          </div>
        </div>

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Özet Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#E8DCCB] bg-[#FAF3EB] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-[#8D5B28]" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#8D5B28]">
                  Toplam Firma Borcumuz
                </p>
              </div>
              <p className="text-2xl font-extrabold text-[#8D5B28] tabular-nums">
                {formatCurrency(totals.toplam_borc)}
              </p>
              <p className="text-xs text-[#8D5B28]/70 mt-1">
                <span>{initialSuppliers.length} kayıtlı firma</span>
              </p>
            </div>

            <div className="rounded-2xl border border-[#D0E0D4] bg-[#EEF4F0] p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpRight className="h-5 w-5 text-[#2D4C3A]" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#2D4C3A]">
                  Firmalara Yapılan Ödeme
                </p>
              </div>
              <p className="text-2xl font-extrabold text-[#2D4C3A] tabular-nums">
                {formatCurrency(totals.toplam_odeme)}
              </p>
              <p className="text-xs text-[#2D4C3A]/70 mt-1">
                <span>Toplam ödediğimiz tutar</span>
              </p>
            </div>

            <div
              className={`rounded-2xl border p-5 shadow-sm ${
                totals.kalan_borc > 0
                  ? "border-red-200 bg-red-50"
                  : "border-[#EAE6DF] bg-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {totals.kalan_borc > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-[#2D4C3A]" />
                )}
                <p
                  className={`text-xs font-bold uppercase tracking-wider ${
                    totals.kalan_borc > 0 ? "text-red-700" : "text-[#1F2922]"
                  }`}
                >
                  Kalan Net Firma Borcu
                </p>
              </div>
              <p
                className={`text-2xl font-extrabold tabular-nums ${
                  totals.kalan_borc > 0 ? "text-red-700" : "text-[#2D4C3A]"
                }`}
              >
                {formatCurrency(totals.kalan_borc)}
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                <span>Ödenmesi gereken bakiye</span>
              </p>
            </div>
          </div>

          {/* Firma Listesi Tablosu */}
          <div className="rounded-2xl border border-[#E5E0D8] bg-white shadow-sm">
            {/* Tablo Başlığı ve Arama */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border-b border-[#E5E0D8]">
              <div>
                <h2 className="text-lg font-bold text-[#1F2937]">Firma &amp; Tedarikçi Listesi</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Satıra tıklayarak borç/ödeme hareketlerini ve hesap ekstresini görüntüleyebilirsiniz
                </p>
              </div>
              <div className="relative min-w-[260px]">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6B7280]">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Firma, yetkili veya telefon ara..."
                  className="w-full rounded-full border border-[#D1D5DB] bg-[#FAF8F5] pl-9 pr-4 py-2 text-sm text-[#111827] placeholder-[#6B7280] focus:border-[#8D5B28] focus:bg-white focus:outline-none transition"
                />
              </div>
            </div>

            {/* Desktop Tablo */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-[#E5E0D8] text-left text-sm">
                <thead className="bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider text-[#374151]">
                  <tr>
                    <th className="px-5 py-3.5 w-12 text-center text-[#9CA3AF]">#</th>
                    <th className="px-5 py-3.5">Firma / Yetkili</th>
                    <th className="px-5 py-3.5">İletişim &amp; Adres</th>
                    <th className="px-5 py-3.5 text-right">Toplam Borç</th>
                    <th className="px-5 py-3.5 text-right">Ödenen</th>
                    <th className="px-5 py-3.5 text-right">Kalan Net Borç</th>
                    <th className="px-5 py-3.5 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E0D8]">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-14 text-center text-[#4B5563]">
                        <Building2 className="mx-auto h-8 w-8 text-[#9CA3AF]" />
                        <p className="mt-2 text-sm font-semibold">
                          {search ? "Arama kriterine uygun firma bulunamadı." : "Henüz firma/tedarikçi eklenmemiş."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s, idx) => (
                      <tr
                        key={s.tedarikci_id}
                        onClick={() => openDetail(s)}
                        className="hover:bg-[#F3EFEA] transition-colors cursor-pointer group"
                      >
                        {/* Sıra No */}
                        <td className="px-5 py-4 text-center text-xs font-bold text-[#9CA3AF]">
                          <span>{idx + 1}</span>
                        </td>

                        {/* Firma / Yetkili */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FAF3EB] border border-[#E8DCCB]">
                              <Building2 className="h-4 w-4 text-[#8D5B28]" />
                            </div>
                            <div>
                              <div className="font-bold text-[#111827] group-hover:text-[#8D5B28] transition-colors">
                                <span>{s.firma_adi}</span>
                              </div>
                              {s.yetkili_kisi && (
                                <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                                  <User className="h-3 w-3" />
                                  <span>{s.yetkili_kisi}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* İletişim & Adres */}
                        <td className="px-5 py-4 text-xs text-[#4B5563]">
                          {s.telefon && (
                            <div className="flex items-center gap-1 font-semibold text-[#111827] mb-0.5">
                              <Phone className="h-3.5 w-3.5 text-[#2D4C3A]" />
                              <a
                                href={`tel:${s.telefon}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:underline"
                              >
                                <span>{s.telefon}</span>
                              </a>
                            </div>
                          )}
                          {s.adres && (
                            <div className="flex items-center gap-1 text-[#8D5B28] font-medium truncate max-w-[200px]">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span>{s.adres}</span>
                            </div>
                          )}
                          {!s.telefon && !s.adres && (
                            <span className="italic text-[#9CA3AF]">Bilgi yok</span>
                          )}
                        </td>

                        {/* Toplam Borç */}
                        <td className="px-5 py-4 text-right text-xs font-semibold tabular-nums text-[#8D5B28]">
                          <span>{formatCurrency(s.toplam_borc)}</span>
                        </td>

                        {/* Ödenen */}
                        <td className="px-5 py-4 text-right text-xs font-semibold tabular-nums text-[#2D4C3A]">
                          <span>{formatCurrency(s.toplam_odeme)}</span>
                        </td>

                        {/* Kalan Net Borç */}
                        <td className="px-5 py-4 text-right">
                          <span
                            className={`inline-block font-extrabold text-sm tabular-nums px-2.5 py-1 rounded-lg ${
                              s.kalan_borc > 0
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : "bg-[#EEF4F0] text-[#2D4C3A] border border-[#D0E0D4]"
                            }`}
                          >
                            <span>{formatCurrency(s.kalan_borc)}</span>
                          </span>
                        </td>

                        {/* İşlemler */}
                        <td className="px-5 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openDetail(s)}
                              title="Hesap Ekstresi / Hareketler"
                              className="inline-flex items-center gap-1 rounded-full border border-[#8D5B28] bg-[#FAF3EB] px-3 py-1.5 text-xs font-bold text-[#8D5B28] hover:bg-[#8D5B28] hover:text-white transition shadow-2xs"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5" />
                              <span>Ekstre</span>
                            </button>
                            <button
                              onClick={() => openAddDebt(s.tedarikci_id)}
                              title="Borç Ekle"
                              className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Borç</span>
                            </button>
                            <button
                              onClick={() => openAddPayment(s.tedarikci_id)}
                              title="Ödeme Yap / Düş"
                              className="inline-flex items-center gap-1 rounded-full border border-[#D0E0D4] bg-[#EEF4F0] px-2.5 py-1.5 text-xs font-bold text-[#2D4C3A] hover:bg-[#DCEEE0] transition"
                            >
                              <ArrowUpRight className="h-3.5 w-3.5" />
                              <span>Ödeme</span>
                            </button>
                            <button
                              onClick={() => openEditSupplier(s)}
                              title="Firmayı Düzenle"
                              className="rounded-full p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              disabled={deletingId !== null}
                              title="Firmayı Sil"
                              className="rounded-full p-1.5 text-[#6B7280] hover:bg-red-50 hover:text-red-600 transition disabled:opacity-40"
                            >
                              {deletingId === s.tedarikci_id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobil Kartlar */}
            <div className="divide-y divide-[#E5E0D8] md:hidden">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-[#4B5563]">
                  <Building2 className="mx-auto h-8 w-8 text-[#9CA3AF]" />
                  <p className="mt-2 text-sm font-semibold">Firma bulunamadı.</p>
                </div>
              ) : (
                filtered.map((s) => (
                  <div
                    key={s.tedarikci_id}
                    onClick={() => openDetail(s)}
                    className="p-4 space-y-3 cursor-pointer hover:bg-[#F3EFEA] active:bg-[#EDE9E3] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-[#111827]">{s.firma_adi}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-[#6B7280]">
                          {s.yetkili_kisi && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" /> <span>{s.yetkili_kisi}</span>
                            </span>
                          )}
                          {s.telefon && (
                            <span className="flex items-center gap-1 font-semibold text-[#111827]">
                              <Phone className="h-3 w-3 text-[#2D4C3A]" /> <span>{s.telefon}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block font-extrabold text-sm tabular-nums px-2.5 py-1 rounded-lg ${
                            s.kalan_borc > 0
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-[#EEF4F0] text-[#2D4C3A] border border-[#D0E0D4]"
                          }`}
                        >
                          <span>{formatCurrency(s.kalan_borc)}</span>
                        </span>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between gap-2 pt-1 border-t border-[#EAE6DF]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openDetail(s)}
                        className="inline-flex items-center gap-1 rounded-full border border-[#8D5B28] bg-[#FAF3EB] px-3 py-1.5 text-xs font-bold text-[#8D5B28]"
                      >
                        <FileSpreadsheet className="h-3.5 w-3.5" />
                        <span>Ekstre</span>
                      </button>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openAddDebt(s.tedarikci_id)}
                          className="rounded-full bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700"
                        >
                          <span>+ Borç</span>
                        </button>
                        <button
                          onClick={() => openAddPayment(s.tedarikci_id)}
                          className="rounded-full bg-[#EEF4F0] border border-[#D0E0D4] px-3 py-1.5 text-xs font-bold text-[#2D4C3A]"
                        >
                          <span>+ Ödeme</span>
                        </button>
                        <button
                          onClick={() => openEditSupplier(s)}
                          className="p-1.5 text-[#6B7280]"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={deletingId !== null}
                          className="p-1.5 text-[#6B7280] disabled:opacity-40"
                        >
                          {deletingId === s.tedarikci_id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[#E5E0D8] px-6 py-4 text-xs text-[#4B5563] bg-[#FAF8F5]/50 rounded-b-2xl">
              <span>
                <span>Toplam </span>
                <strong className="text-[#111827]">{filtered.length}</strong>
                <span> firma listeleniyor</span>
              </span>
              <span className="text-[#9CA3AF]">
                <span>Detaylar ve ekstre için satıra veya &quot;Ekstre&quot; butonuna tıklayın</span>
              </span>
            </div>
          </div>
        </main>
      </div>

      {/* Modaller */}
      <SupplierDetailModal
        isOpen={detailOpen}
        supplier={selectedSupplier}
        onClose={() => setDetailOpen(false)}
        onAddDebt={openAddDebt}
        onAddPayment={openAddPayment}
        onDataChanged={handleDataChanged}
      />

      <SupplierFormModal
        isOpen={formOpen}
        mode={formMode}
        supplier={formSupplier}
        onClose={() => setFormOpen(false)}
        onSuccess={handleDataChanged}
      />
    </>
  );
}
