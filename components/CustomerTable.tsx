"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  FileSpreadsheet,
  Plus,
  ArrowDownLeft,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  Users,
  Loader2,
} from "lucide-react";
import { CustomerWithBalance, deleteCustomer } from "@/lib/actions";
import { formatCurrency } from "@/components/StatCards";
import { usePrivacy } from "@/lib/privacy";

interface CustomerTableProps {
  customers: CustomerWithBalance[];
  neighborhoods: string[];
  onOpenStatement: (customerId: number) => void;
  onOpenDebt: (customerId: number) => void;
  onOpenPayment: (customerId: number) => void;
  onEditCustomer: (customer: CustomerWithBalance) => void;
  onDataChanged: () => void;
  requirePassword: (label: string, action: () => void) => void;
}

export default function CustomerTable({
  customers,
  neighborhoods,
  onOpenStatement,
  onOpenDebt,
  onOpenPayment,
  onEditCustomer,
  onDataChanged,
  requirePassword,
}: CustomerTableProps) {
  const { isPrivacyMode } = usePrivacy();
  const [search, setSearch] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("all");
  const [balanceFilter, setBalanceFilter] = useState<"all" | "debtors" | "clean">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        customer.ad_soyad.toLowerCase().includes(q) ||
        (customer.telefon && customer.telefon.includes(q)) ||
        (customer.mahalle && customer.mahalle.toLowerCase().includes(q));

      const matchesNeighborhood =
        selectedNeighborhood === "all" ||
        customer.mahalle === selectedNeighborhood;

      let matchesBalance = true;
      if (balanceFilter === "debtors") {
        matchesBalance = customer.kalan_bakiye > 0;
      } else if (balanceFilter === "clean") {
        matchesBalance = customer.kalan_bakiye <= 0;
      }

      return matchesSearch && matchesNeighborhood && matchesBalance;
    });
  }, [customers, search, selectedNeighborhood, balanceFilter]);

  function handleDelete(customer: CustomerWithBalance) {
    if (deletingId !== null) return;
    requirePassword(`"${customer.ad_soyad}" Sil`, () => {
      const confirmMsg = `"${customer.ad_soyad}" isimli müşteriyi ve tüm cari kayıtlarını silmek istediğinize emin misiniz?`;
      if (!confirm(confirmMsg)) return;
      setDeletingId(customer.musteri_id);
      deleteCustomer(customer.musteri_id)
        .then(() => onDataChanged())
        .catch((err: unknown) => {
          alert(err instanceof Error ? err.message : "Müşteri silinirken hata oluştu.");
        })
        .finally(() => setDeletingId(null));
    });
  }

  return (
    <div className="rounded-2xl border border-[#E5E0D8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header & Filter Bar */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-[#E5E0D8]">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-[#1F2937]">
            Cari Hesap & Müşteri Defteri
          </h3>
          <p className="text-xs font-medium text-[#4B5563]">
            Tohum, gübre ve zirai ilaç alışverişi yapan tüm müstahsiller
          </p>
        </div>

        {/* Search & Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#6B7280]">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, telefon veya köy ara..."
              className="w-full rounded-full border border-[#D1D5DB] bg-[#FAF8F5] pl-9 pr-4 py-2 text-xs sm:text-sm text-[#111827] placeholder-[#6B7280] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Mahalle / Köy Seçimi */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#D1D5DB] bg-[#FAF8F5] px-3.5 py-2 text-xs sm:text-sm text-[#1F2937]">
            <MapPin className="h-4 w-4 text-[#6F8B67]" />
            <select
              value={selectedNeighborhood}
              onChange={(e) => setSelectedNeighborhood(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Tüm Köyler / Mahalleler</option>
              {neighborhoods.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Bakiye Durumu */}
          <div className="flex items-center gap-1.5 rounded-full border border-[#D1D5DB] bg-[#FAF8F5] px-3.5 py-2 text-xs sm:text-sm text-[#1F2937]">
            <Filter className="h-4 w-4 text-[#8D5B28]" />
            <select
              value={balanceFilter}
              onChange={(e) =>
                setBalanceFilter(e.target.value as "all" | "debtors" | "clean")
              }
              className="bg-transparent font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">Tüm Bakiyeler</option>
              <option value="debtors">Sadece Borçlular</option>
              <option value="clean">Borcu Kapanmışlar</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop & Tablet Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E0D8] text-left text-sm">
          <thead className="bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider text-[#374151]">
            <tr>
              <th className="px-6 py-4">Müstahsil / Çiftçi</th>
              <th className="px-5 py-4">İletişim & Konum</th>
              <th className="px-5 py-4 text-right">Toplam Borç</th>
              <th className="px-6 py-4 text-right">Kalan Net Bakiye</th>
              <th className="px-6 py-4 text-center">Müşteri Bilgileri &amp; İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D8]">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center text-[#4B5563]">
                  <Users className="mx-auto h-8 w-8 text-[#9CA3AF]" />
                  <p className="mt-2 text-sm font-semibold">
                    Arama kriterine uygun cari kayıt bulunamadı.
                  </p>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer) => {
                const bakiye = customer.kalan_bakiye;
                const hasDebt = bakiye > 0;
                const isClean = bakiye === 0;

                return (
                  <tr
                    key={customer.musteri_id}
                    className="hover:bg-[#F3EFEA] transition-colors"
                  >
                    {/* Müstahsil Adı (Tıklanabilir - Müşteri Bilgilerini Açar) */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => onOpenStatement(customer.musteri_id)}
                        className="text-left group cursor-pointer"
                        title="Müşteri Bilgilerini ve Cari Geçmişini Görüntüle"
                      >
                        <div className="text-base font-bold text-[#111827] group-hover:text-[#2D4C3A] transition-colors underline-offset-2 group-hover:underline">
                          {customer.ad_soyad}
                        </div>
                        {customer.kayit_tarihi && (
                          <div className="text-xs font-medium text-[#6B7280]">
                            Kayıt: {customer.kayit_tarihi}
                          </div>
                        )}
                      </button>
                    </td>

                    {/* İletişim / Köy */}
                    <td className="px-5 py-4 text-xs font-medium text-[#4B5563]">
                      {customer.telefon ? (
                        <div className="flex items-center gap-1.5 font-semibold text-[#111827]">
                          <Phone className="h-3.5 w-3.5 text-[#2D4C3A]" />
                          <a
                            href={`tel:${customer.telefon}`}
                            className="hover:text-[#2D4C3A] hover:underline"
                          >
                            {customer.telefon}
                          </a>
                        </div>
                      ) : (
                        <span className="text-[#9CA3AF] italic">Tel yok</span>
                      )}
                      {customer.mahalle && (
                        <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#8D5B28]">
                          <MapPin className="h-3.5 w-3.5 text-[#8D5B28]" />
                          {customer.mahalle}
                        </div>
                      )}
                    </td>

                    {/* Toplam Borç */}
                    <td className="px-5 py-4 text-right font-bold text-[#8D5B28] tabular-nums text-sm">
                      {isPrivacyMode ? "•••••• ₺" : formatCurrency(customer.toplam_borc)}
                    </td>

                    {/* Kalan Net Bakiye & Smart Tag */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-base font-extrabold tabular-nums text-[#111827]">
                          {isPrivacyMode ? "•••••• ₺" : formatCurrency(bakiye)}
                        </span>
                        {hasDebt ? (
                          <span className="inline-flex items-center rounded-full bg-[#FAF3EB] border border-[#E8DCCB] px-2.5 py-0.5 text-xs font-bold text-[#8D5B28]">
                            Bakiye Var
                          </span>
                        ) : isClean ? (
                          <span className="inline-flex items-center rounded-full bg-[#EEF4F0] border border-[#D0E0D4] px-2.5 py-0.5 text-xs font-bold text-[#2D4C3A]">
                            Kapanmış
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-[#EEF4F0] border border-[#D0E0D4] px-2.5 py-0.5 text-xs font-bold text-[#2D4C3A]">
                            Alacaklı
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Inline Contextual Actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => onOpenStatement(customer.musteri_id)}
                          title="Müşteri Bilgileri, Ödemeleri ve Cari Ekstresi"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#2D4C3A] bg-[#EEF4F0] px-3.5 py-1.5 text-xs font-bold text-[#2D4C3A] hover:bg-[#2D4C3A] hover:text-white transition-all shadow-xs"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                          <span>Müşteri Bilgileri</span>
                        </button>

                        <button
                          onClick={() => onOpenDebt(customer.musteri_id)}
                          title="Borç Ekle"
                          className="inline-flex items-center gap-1 rounded-full border border-[#E8DCCB] bg-[#FAF3EB] px-2.5 py-1.5 text-xs font-semibold text-[#8D5B28] hover:bg-[#F3E5D4] transition"
                        >
                          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Borç</span>
                        </button>

                        <button
                          onClick={() => onOpenPayment(customer.musteri_id)}
                          title="Tahsilat Al"
                          className="inline-flex items-center gap-1 rounded-full border border-[#D0E0D4] bg-[#EEF4F0] px-2.5 py-1.5 text-xs font-semibold text-[#2D4C3A] hover:bg-[#DCEEE0] transition"
                        >
                          <ArrowDownLeft className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>Tahsilat</span>
                        </button>

                        <button
                          onClick={() => onEditCustomer(customer)}
                          title="Müşteri Bilgilerini Düzenle"
                          className="rounded-full p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827] transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(customer)}
                          disabled={deletingId !== null}
                          title={
                            deletingId === customer.musteri_id
                              ? "Siliniyor..."
                              : "Müşteri Kaydını Sil"
                          }
                          className="rounded-full p-1.5 text-[#6B7280] hover:bg-[#FEE2E2] hover:text-[#DC2626] transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {deletingId === customer.musteri_id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[#DC2626]" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Flow */}
      <div className="divide-y divide-[#E5E0D8] md:hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-8 text-center text-[#4B5563]">
            <Users className="mx-auto h-8 w-8 text-[#9CA3AF]" />
            <p className="mt-2 text-sm font-semibold">Kayıt bulunamadı.</p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <div key={customer.musteri_id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4
                    onClick={() => onOpenStatement(customer.musteri_id)}
                    className="text-lg font-bold text-[#111827] cursor-pointer active:text-[#2D4C3A]"
                  >
                    {customer.ad_soyad}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-xs font-medium text-[#4B5563]">
                    {customer.telefon && (
                      <span className="flex items-center gap-1 font-semibold text-[#111827]">
                        <Phone className="h-3.5 w-3.5 text-[#2D4C3A]" />
                        {customer.telefon}
                      </span>
                    )}
                    {customer.mahalle && (
                      <span className="flex items-center gap-1 font-semibold text-[#8D5B28]">
                        <MapPin className="h-3.5 w-3.5 text-[#8D5B28]" />
                        {customer.mahalle}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-lg text-[#111827] tabular-nums">
                    {isPrivacyMode ? "•••••• ₺" : formatCurrency(customer.kalan_bakiye)}
                  </div>
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                      customer.kalan_bakiye > 0
                        ? "bg-[#FAF3EB] border-[#E8DCCB] text-[#8D5B28]"
                        : "bg-[#EEF4F0] border-[#D0E0D4] text-[#2D4C3A]"
                    }`}
                  >
                    {customer.kalan_bakiye > 0 ? "Bakiye Var" : "Kapanmış"}
                  </span>
                </div>
              </div>

              {/* Debt Summary (Tahsilat burada gösterilmez, Müşteri Bilgileri modalında detaylıca yazar) */}
              <div className="flex items-center justify-between text-xs bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D8]">
                <span className="text-[#4B5563] font-medium">Toplam Açık Borç Kaydı:</span>
                <span className="font-bold text-[#8D5B28] tabular-nums text-sm">
                  {isPrivacyMode ? "•••••• ₺" : formatCurrency(customer.toplam_borc)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => onOpenStatement(customer.musteri_id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#2D4C3A] bg-[#EEF4F0] px-3.5 py-1.5 text-xs font-bold text-[#2D4C3A]"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Müşteri Bilgileri
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenDebt(customer.musteri_id)}
                    className="rounded-full bg-[#FAF3EB] border border-[#E8DCCB] px-3 py-1.5 text-xs font-bold text-[#8D5B28]"
                  >
                    + Borç
                  </button>
                  <button
                    onClick={() => onOpenPayment(customer.musteri_id)}
                    className="rounded-full bg-[#EEF4F0] border border-[#D0E0D4] px-3 py-1.5 text-xs font-bold text-[#2D4C3A]"
                  >
                    + Tahsilat
                  </button>
                  <button
                    onClick={() => onEditCustomer(customer)}
                    className="p-1 text-[#6B7280]"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(customer)}
                    disabled={deletingId !== null}
                    className="p-1 text-[#6B7280] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deletingId === customer.musteri_id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#DC2626]" />
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

      {/* Footer Summary */}
      <div className="flex items-center justify-between border-t border-[#E5E0D8] px-6 py-4 text-xs font-medium text-[#4B5563] bg-[#FAF8F5]/50 rounded-b-2xl">
        <span>Toplam <strong className="text-[#111827]">{filteredCustomers.length}</strong> cari hesap listeleniyor</span>
        <span>
          Filtrelenen Net Alacak:{" "}
          <strong className="text-[#2D4C3A] font-extrabold text-base tabular-nums">
            {formatCurrency(
              filteredCustomers.reduce((acc, c) => acc + c.kalan_bakiye, 0)
            )}
          </strong>
        </span>
      </div>
    </div>
  );
}
