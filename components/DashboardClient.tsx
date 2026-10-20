"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import CustomerModal from "@/components/modals/CustomerModal";
import TransactionModal from "@/components/modals/TransactionModal";
import StatementModal from "@/components/modals/StatementModal";
import PasswordModal from "@/components/modals/PasswordModal";
import ProductCatalogModal from "@/components/modals/ProductCatalogModal";
import FirmaDebtModal from "@/components/modals/FirmaDebtModal";
import {
  CustomerWithBalance,
  ProductItem,
} from "@/lib/actions";

interface DashboardClientProps {
  initialCustomers: CustomerWithBalance[];
  initialProducts?: ProductItem[];
  currentUser?: { name?: string; username?: string } | null;
}

export default function DashboardClient({
  initialCustomers,
  initialProducts = [],
  currentUser,
}: DashboardClientProps) {
  const router = useRouter();

  // Modal States
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"borc" | "tahsilat">("borc");
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState<
    number | null
  >(null);

  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [statementCustomerId, setStatementCustomerId] = useState<number | null>(
    null
  );

  const [productCatalogOpen, setProductCatalogOpen] = useState(false);
  const [firmaDebtOpen, setFirmaDebtOpen] = useState(false);

  // Şifre Modal State (sadece login'de kullanılıyor, burada tutmaya devam ediyoruz
  // ama işlem şifrelerini kaldırdık — şifre yalnızca ilk girişte sorulacak)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordActionLabel, setPasswordActionLabel] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  function handleDataChanged() {
    router.refresh();
  }

  /** Şifre koruması — artık sadece kritik silme işlemleri için kullanılıyor */
  function requirePassword(label: string, action: () => void) {
    setPasswordActionLabel(label);
    setPendingAction(() => action);
    setPasswordModalOpen(true);
  }

  function handlePasswordSuccess() {
    setPasswordModalOpen(false);
    pendingAction?.();
    setPendingAction(null);
  }

  function handlePasswordCancel() {
    setPasswordModalOpen(false);
    setPendingAction(null);
  }

  // Navbar handlers — artık şifresiz doğrudan açılıyor
  function handleOpenNewCustomer() {
    setCustomerModalOpen(true);
  }

  function handleOpenNewDebt(customerId?: number) {
    setTransactionType("borc");
    setPreSelectedCustomerId(customerId ?? null);
    setTransactionModalOpen(true);
  }

  function handleOpenNewPayment(customerId?: number) {
    setTransactionType("tahsilat");
    setPreSelectedCustomerId(customerId ?? null);
    setTransactionModalOpen(true);
  }

  // Müşteri Bilgileri & Ekstre — şifresiz açılıyor (sadece görüntüleme)
  function handleOpenStatement(customerId: number) {
    setStatementCustomerId(customerId);
    setStatementModalOpen(true);
  }

  // Ürün & Fiyat Kataloğu — şifresiz görüntülenebilir
  function handleOpenProductCatalog() {
    setProductCatalogOpen(true);
  }

  return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1F2922]">
        {/* Top Navbar */}
        <Navbar
          onOpenNewCustomer={handleOpenNewCustomer}
          onOpenNewDebt={() => handleOpenNewDebt()}
          onOpenNewPayment={() => handleOpenNewPayment()}
          onOpenProductCatalog={handleOpenProductCatalog}
          onOpenFirmaDebt={() => setFirmaDebtOpen(true)}
          currentUser={currentUser}
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          <Link
            href="/musteriler"
            className="block max-w-xl rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition hover:border-[#2D4C3A]/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#4B5563]">
                  Kayıtlı çiftçi &amp; müşteri
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tight text-[#111827] tabular-nums">
                    {initialCustomers.length.toLocaleString("tr-TR")}
                  </span>
                  <span className="text-sm font-semibold text-[#4B5563]">Aktif cari</span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#8D5B28]">
                  <span className="h-2 w-2 rounded-full bg-[#8D5B28]" />
                  {initialCustomers.filter((customer) => customer.kalan_bakiye > 0).length} müşteride açık bakiye mevcut
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E5E0D8] bg-[#FAF8F5] text-[#2D4C3A]">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-xs font-semibold text-[#2D4C3A]">Tüm müşterileri görüntüle →</p>
          </Link>

          <section className="rounded-2xl border border-[#E5E0D8] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <h1 className="text-xl font-bold text-[#2D4C3A]">Ana Sayfa</h1>
            <p className="mt-1 text-sm text-[#6B776D]">
              Kasa ve cari özetlerine Raporlar bölümünden, tüm müşteri kayıtlarına Müşteriler bölümünden ulaşabilirsiniz.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/raporlar"
                className="rounded-full bg-[#2D4C3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1E3427]"
              >
                Raporları Aç
              </Link>
              <Link
                href="/musteriler"
                className="rounded-full border border-[#D1D5DB] bg-white px-4 py-2 text-sm font-semibold text-[#2D4C3A] hover:bg-[#F4EFEA]"
              >
                Müşterileri Gör
              </Link>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-16 border-t border-[#EAE6DF] py-6 text-center text-xs text-[#6B776D]">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-serif-brand font-semibold tracking-wider text-[#2D4C3A]">
              AKINOĞLU TARIM — Zirai İlaç • Fide • Gübre • Tohum
            </p>
            <p>© {new Date().getFullYear()} Borç &amp; Cari Takip Sistemi. Tüm hakları saklıdır.</p>
          </div>
        </footer>

        {/* Modals */}
        <PasswordModal
          isOpen={passwordModalOpen}
          actionLabel={passwordActionLabel}
          onSuccess={handlePasswordSuccess}
          onCancel={handlePasswordCancel}
        />

        <CustomerModal
          isOpen={customerModalOpen}
          onClose={() => setCustomerModalOpen(false)}
          onSuccess={handleDataChanged}
        />

        <TransactionModal
          isOpen={transactionModalOpen}
          type={transactionType}
          onClose={() => setTransactionModalOpen(false)}
          onSuccess={handleDataChanged}
          preSelectedCustomerId={preSelectedCustomerId}
          customers={initialCustomers}
          availableProducts={initialProducts}
          onOpenProductCatalog={handleOpenProductCatalog}
        />

        <StatementModal
          isOpen={statementModalOpen}
          customerId={statementCustomerId}
          onClose={() => setStatementModalOpen(false)}
          onOpenDebt={handleOpenNewDebt}
          onOpenPayment={handleOpenNewPayment}
          onDataChanged={handleDataChanged}
          requirePassword={requirePassword}
        />

        <ProductCatalogModal
          isOpen={productCatalogOpen}
          onClose={() => setProductCatalogOpen(false)}
          onProductsChanged={handleDataChanged}
          requirePassword={requirePassword}
        />

        <FirmaDebtModal
          isOpen={firmaDebtOpen}
          onClose={() => setFirmaDebtOpen(false)}
        />
      </div>
  );
}
