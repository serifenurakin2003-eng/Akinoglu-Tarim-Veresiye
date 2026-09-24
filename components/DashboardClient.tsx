"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatCards from "@/components/StatCards";
import RecentActivities from "@/components/RecentActivities";
import CustomerTable from "@/components/CustomerTable";
import CustomerModal from "@/components/modals/CustomerModal";
import TransactionModal from "@/components/modals/TransactionModal";
import StatementModal from "@/components/modals/StatementModal";
import PasswordModal from "@/components/modals/PasswordModal";
import ProductCatalogModal from "@/components/modals/ProductCatalogModal";
import {
  CustomerWithBalance,
  DashboardStats,
  ProductItem,
} from "@/lib/actions";
import { PrivacyProvider } from "@/lib/privacy";

interface DashboardClientProps {
  initialStats: DashboardStats;
  initialCustomers: CustomerWithBalance[];
  neighborhoods: string[];
  initialProducts?: ProductItem[];
  currentUser?: { name?: string; username?: string } | null;
}

export default function DashboardClient({
  initialStats,
  initialCustomers,
  neighborhoods,
  initialProducts = [],
  currentUser,
}: DashboardClientProps) {
  const router = useRouter();

  // Modal States
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] =
    useState<CustomerWithBalance | null>(null);

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

  // Şifre Modal State
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordActionLabel, setPasswordActionLabel] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  function handleDataChanged() {
    router.refresh();
  }

  /** Herhangi bir yazma işleminden önce şifre modal'ını aç */
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

  // Navbar handlers — şifre korumalı
  function handleOpenNewCustomer() {
    requirePassword("Yeni Müşteri Ekle", () => {
      setEditingCustomer(null);
      setCustomerModalOpen(true);
    });
  }

  function handleOpenNewDebt(customerId?: number) {
    requirePassword("Borç Yaz", () => {
      setTransactionType("borc");
      setPreSelectedCustomerId(customerId ?? null);
      setTransactionModalOpen(true);
    });
  }

  function handleOpenNewPayment(customerId?: number) {
    requirePassword("Tahsilat Al", () => {
      setTransactionType("tahsilat");
      setPreSelectedCustomerId(customerId ?? null);
      setTransactionModalOpen(true);
    });
  }

  function handleEditCustomer(customer: CustomerWithBalance) {
    requirePassword("Müşteri Düzenle", () => {
      setEditingCustomer(customer);
      setCustomerModalOpen(true);
    });
  }

  // Ekstre — şifresiz açılıyor (sadece görüntüleme)
  function handleOpenStatement(customerId: number) {
    setStatementCustomerId(customerId);
    setStatementModalOpen(true);
  }

  // Ürün & Fiyat Kataloğu — şifresiz görüntülenebilir
  function handleOpenProductCatalog() {
    setProductCatalogOpen(true);
  }

  return (
    <PrivacyProvider>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1F2922]">
        {/* Top Navbar */}
        <Navbar
          onOpenNewCustomer={handleOpenNewCustomer}
          onOpenNewDebt={() => handleOpenNewDebt()}
          onOpenNewPayment={() => handleOpenNewPayment()}
          onOpenProductCatalog={handleOpenProductCatalog}
          currentUser={currentUser}
        />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          {/* 1. Stat Flow Section */}
          <section>
            <StatCards stats={initialStats} />
          </section>

          {/* 2. Recent Ledger Stream & Top Debtors */}
          <section>
            <RecentActivities
              sonHareketler={initialStats.sonHareketler}
              enCokBorclular={initialStats.enCokBorclular}
              onOpenStatement={handleOpenStatement}
            />
          </section>

          {/* 3. Customer Ledger Table */}
          <section className="space-y-3">
            <CustomerTable
              customers={initialCustomers}
              neighborhoods={neighborhoods}
              onOpenStatement={handleOpenStatement}
              onOpenDebt={handleOpenNewDebt}
              onOpenPayment={handleOpenNewPayment}
              onEditCustomer={handleEditCustomer}
              onDataChanged={handleDataChanged}
              requirePassword={requirePassword}
            />
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
          customer={editingCustomer}
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
      </div>
    </PrivacyProvider>
  );
}
