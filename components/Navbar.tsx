"use client";

import BrandLogo from "@/components/BrandLogo";
import {
  UserPlus,
  Plus,
  ArrowDownLeft,
  LogOut,
  User,
  Package,
  Eye,
  EyeOff,
} from "lucide-react";
import { logoutAction } from "@/lib/actions";
import { usePrivacy } from "@/lib/privacy";

interface NavbarProps {
  onOpenNewCustomer: () => void;
  onOpenNewDebt: () => void;
  onOpenNewPayment: () => void;
  onOpenProductCatalog: () => void;
  currentUser?: { name?: string; username?: string } | null;
}

export default function Navbar({
  onOpenNewCustomer,
  onOpenNewDebt,
  onOpenNewPayment,
  onOpenProductCatalog,
  currentUser,
}: NavbarProps) {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  const todayFormatted = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E0D8] bg-[#FAF8F5]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        {/* Brand Group with Prominent Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <BrandLogo className="h-12 w-12 sm:h-16 sm:w-16 shrink-0 filter drop-shadow-xs" />
          <div className="flex flex-col">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-serif-brand text-xl sm:text-3xl font-extrabold tracking-[0.08em] text-[#2D4C3A]">
                AKINOĞLU TARIM
              </span>
              <span className="hidden xl:inline-block rounded-full bg-[#FAF3EB] border border-[#E8DCCB] px-2.5 py-0.5 text-xs font-bold text-[#8D5B28]">
                Zirai İlaç • Fide • Gübre • Tohum
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm font-semibold text-[#374151]">
                Cari &amp; Borç Takip Portalı
              </span>
              <span className="hidden sm:inline text-[#D1D5DB]">•</span>
              <span className="hidden sm:inline text-xs font-medium text-[#6B7280] capitalize">
                {todayFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mahremiyet / Gizlilik Modu (Ses kaydı isteği: 'Borcu çok büyük gözükmesin ortada, millet bakacak olur') */}
          <button
            onClick={togglePrivacyMode}
            type="button"
            title={
              isPrivacyMode
                ? "Mahremiyet Modu Açık (Borçlar Gizli). Göstermek için tıklayın."
                : "Mahremiyet Modu: Borç tutarlarını meraklı gözlerden gizle"
            }
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              isPrivacyMode
                ? "bg-amber-100 border-amber-300 text-amber-900 shadow-inner"
                : "bg-white border-[#D1D5DB] text-[#4B5563] hover:bg-[#FAF8F5] hover:text-[#1F2922]"
            }`}
          >
            {isPrivacyMode ? (
              <>
                <EyeOff className="h-4 w-4 text-amber-700" />
                <span className="hidden md:inline">Borçlar Gizli</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 text-[#6B7280]" />
                <span className="hidden md:inline">Gizlilik Modu</span>
              </>
            )}
          </button>

          {/* Ürün & Fiyat Kataloğu Butonu (Ses kaydı isteği: 'İlaçlar gübreler diye bir altyapı olacak') */}
          <button
            onClick={onOpenProductCatalog}
            type="button"
            title="Zirai İlaç & Gübre Kataloğu (Fiyat ve Kod Yönetimi)"
            className="group inline-flex items-center gap-1.5 rounded-full border border-[#D1D5DB] bg-white px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#1F2937] transition hover:border-[#8D5B28] hover:bg-[#FAF3EB] hover:text-[#8D5B28]"
          >
            <Package className="h-4 w-4 text-[#8D5B28] transition-transform group-hover:scale-110" />
            <span className="hidden lg:inline">Ürün &amp; Fiyatlar</span>
            <span className="lg:hidden">Ürünler</span>
          </button>

          {/* Yeni Müşteri */}
          <button
            onClick={onOpenNewCustomer}
            type="button"
            className="group inline-flex items-center gap-1.5 rounded-full border border-[#D1D5DB] bg-white px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-[#1F2937] transition hover:border-[#2D4C3A] hover:bg-[#F4EFEA] hover:text-[#2D4C3A]"
          >
            <UserPlus className="h-4 w-4 text-[#6F8B67] transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Müşteri</span>
          </button>

          {/* Borç Yaz */}
          <button
            onClick={onOpenNewDebt}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#8D5B28] bg-[#8D5B28] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#72481F]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Borç Yaz</span>
            <span className="sm:hidden">Borç</span>
          </button>

          {/* Tahsilat Al */}
          <button
            onClick={onOpenNewPayment}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#2D4C3A] bg-[#2D4C3A] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#1E3427]"
          >
            <ArrowDownLeft className="h-4 w-4 stroke-[2.5] text-[#FAF8F5]" />
            <span className="hidden sm:inline">Tahsilat Al</span>
            <span className="sm:hidden">Tahsilat</span>
          </button>

          {/* Kullanıcı Rozeti */}
          {currentUser?.name && (
            <div
              title={`Oturum: ${currentUser.name} (@${currentUser.username})`}
              className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-[#E8DCCB] bg-[#FAF3EB] px-3 py-1.5 text-xs font-semibold text-[#8D5B28]"
            >
              <User className="h-3.5 w-3.5 text-[#8D5B28]" />
              <span className="max-w-[120px] truncate">{currentUser.name}</span>
            </div>
          )}

          {/* Çıkış Butonu */}
          <form action={logoutAction}>
            <button
              type="submit"
              title="Çıkış Yap"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E0D8] bg-white p-2 text-xs font-semibold text-[#6B7280] hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
