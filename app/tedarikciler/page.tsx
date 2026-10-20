import { getSuppliers, type SupplierWithBalance } from "@/lib/supplier-actions";
import SupplierClient from "@/components/SupplierClient";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Firma Borçları — Akınoğlu Tarım",
  description: "Tedarikçi firmalara olan borçlarımız, yapılan ödemeler ve cari hesap geçmişi",
};

export default async function TedarikcilerPage() {
  let suppliers: SupplierWithBalance[] = [];
  try {
    suppliers = await getSuppliers();
  } catch (err) {
    console.error("Error loading suppliers:", err);
    suppliers = [];
  }

  return (
    <>
      {/* Üst Bar: Ana Sayfaya Dön Linki */}
      <div className="sticky top-0 z-40 border-b border-[#E5E0D8] bg-[#FAF8F5]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D1D5DB] bg-white px-3.5 py-1.5 text-xs font-bold text-[#1F2937] hover:bg-[#FAF8F5] transition shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Ana Sayfaya Dön (Müşteriler)</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-serif-brand text-lg font-bold text-[#2D4C3A]">
              AKINOĞLU TARIM
            </span>
            <span className="hidden sm:inline text-xs text-[#9CA3AF]">/ Firma Borçları Portalı</span>
          </div>
        </div>
      </div>

      <SupplierClient initialSuppliers={suppliers} />
    </>
  );
}
