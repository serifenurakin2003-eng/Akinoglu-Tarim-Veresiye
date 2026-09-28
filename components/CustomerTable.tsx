"use client";

import { useState, useMemo } from "react";
import {
  Search,
  MapPin,
  Users,
  Phone,
  ChevronRight,
} from "lucide-react";
import { CustomerWithBalance } from "@/lib/actions";

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
}: CustomerTableProps) {
  const [search, setSearch] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("all");

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

      return matchesSearch && matchesNeighborhood;
    });
  }, [customers, search, selectedNeighborhood]);

  return (
    <div className="rounded-2xl border border-[#E5E0D8] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Header & Filter Bar */}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-[#E5E0D8]">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-[#1F2937]">
            Cari Hesap &amp; Müşteri Defteri
          </h3>
          <p className="text-xs font-medium text-[#4B5563]">
            Tohum, gübre ve zirai ilaç alışverişi yapan tüm müstahsiller
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
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
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-[#E5E0D8] text-left text-sm">
          <thead className="bg-[#FAF8F5] text-xs font-bold uppercase tracking-wider text-[#374151]">
            <tr>
              <th className="px-4 py-4 w-12 text-center">#</th>
              <th className="px-5 py-4">Müstahsil / Çiftçi Adı</th>
              <th className="px-5 py-4">İletişim</th>
              <th className="px-5 py-4">Köy / Mahalle</th>
              <th className="px-5 py-4">Kayıt Tarihi</th>
              <th className="px-4 py-4 text-center">Hesap Detayı</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E0D8]">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-14 text-center text-[#4B5563]">
                  <Users className="mx-auto h-8 w-8 text-[#9CA3AF]" />
                  <p className="mt-2 text-sm font-semibold">
                    Arama kriterine uygun cari kayıt bulunamadı.
                  </p>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer, index) => (
                <tr
                  key={customer.musteri_id}
                  onClick={() => onOpenStatement(customer.musteri_id)}
                  className="hover:bg-[#F3EFEA] transition-colors cursor-pointer group"
                >
                  {/* Sıra No */}
                  <td className="px-4 py-4 text-center text-xs font-bold text-[#9CA3AF] tabular-nums">
                    {index + 1}
                  </td>

                  {/* Ad Soyad */}
                  <td className="px-5 py-4">
                    <div className="text-base font-bold text-[#111827] group-hover:text-[#2D4C3A] transition-colors">
                      {customer.ad_soyad}
                    </div>
                  </td>

                  {/* Telefon */}
                  <td className="px-5 py-4 text-sm text-[#4B5563]">
                    {customer.telefon ? (
                      <div className="flex items-center gap-1.5 font-semibold text-[#111827]">
                        <Phone className="h-3.5 w-3.5 text-[#2D4C3A]" />
                        <span
                          onClick={(e) => e.stopPropagation()}
                        >
                          <a
                            href={`tel:${customer.telefon}`}
                            className="hover:text-[#2D4C3A] hover:underline"
                          >
                            {customer.telefon}
                          </a>
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#9CA3AF] italic text-xs">Tel yok</span>
                    )}
                  </td>

                  {/* Köy */}
                  <td className="px-5 py-4">
                    {customer.mahalle ? (
                      <div className="flex items-center gap-1 text-sm font-semibold text-[#8D5B28]">
                        <MapPin className="h-3.5 w-3.5 text-[#8D5B28]" />
                        {customer.mahalle}
                      </div>
                    ) : (
                      <span className="text-[#9CA3AF] italic text-xs">—</span>
                    )}
                  </td>

                  {/* Kayıt Tarihi */}
                  <td className="px-5 py-4 text-xs text-[#6B7280]">
                    {customer.kayit_tarihi || "—"}
                  </td>

                  {/* Hesap Detayı */}
                  <td className="px-4 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#2D4C3A] bg-[#EEF4F0] px-3 py-1 text-xs font-bold text-[#2D4C3A] group-hover:bg-[#2D4C3A] group-hover:text-white transition-all">
                      Hesabı Aç
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </td>
                </tr>
              ))
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
          filteredCustomers.map((customer, index) => (
            <div
              key={customer.musteri_id}
              onClick={() => onOpenStatement(customer.musteri_id)}
              className="flex items-center gap-3 p-4 hover:bg-[#F3EFEA] transition-colors cursor-pointer group"
            >
              {/* Sıra No */}
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-sm font-extrabold text-[#6B7280]">
                {index + 1}
              </div>

              {/* Bilgiler */}
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-[#111827] group-hover:text-[#2D4C3A] transition-colors">
                  {customer.ad_soyad}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  {customer.telefon && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#374151]">
                      <Phone className="h-3 w-3 text-[#2D4C3A]" />
                      {customer.telefon}
                    </span>
                  )}
                  {customer.mahalle && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#8D5B28]">
                      <MapPin className="h-3 w-3" />
                      {customer.mahalle}
                    </span>
                  )}
                </div>
              </div>

              <ChevronRight className="h-5 w-5 text-[#9CA3AF] group-hover:text-[#2D4C3A] transition-colors flex-shrink-0" />
            </div>
          ))
        )}
      </div>

      {/* Footer Summary */}
      <div className="flex items-center justify-between border-t border-[#E5E0D8] px-6 py-4 text-xs font-medium text-[#4B5563] bg-[#FAF8F5]/50 rounded-b-2xl">
        <span>
          Toplam <strong className="text-[#111827]">{filteredCustomers.length}</strong> cari hesap listeleniyor
        </span>
        {search && (
          <button
            onClick={() => setSearch("")}
            className="text-[#2D4C3A] font-semibold hover:underline"
          >
            Aramayı Temizle
          </button>
        )}
      </div>
    </div>
  );
}
