"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CustomerTable from "@/components/CustomerTable";
import Navbar from "@/components/Navbar";
import CustomerModal from "@/components/modals/CustomerModal";
import FirmaDebtModal from "@/components/modals/FirmaDebtModal";
import PasswordModal from "@/components/modals/PasswordModal";
import ProductCatalogModal from "@/components/modals/ProductCatalogModal";
import StatementModal from "@/components/modals/StatementModal";
import TransactionModal from "@/components/modals/TransactionModal";
import { CustomerWithBalance, deleteCustomer, ProductItem } from "@/lib/actions";
import { PrivacyProvider } from "@/lib/privacy";

interface CustomerDirectoryClientProps {
  customers: CustomerWithBalance[];
  neighborhoods: string[];
  products: ProductItem[];
  currentUser?: { name?: string; username?: string } | null;
}

export default function CustomerDirectoryClient({
  customers,
  neighborhoods,
  products,
  currentUser,
}: CustomerDirectoryClientProps) {
  const router = useRouter();
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"borc" | "tahsilat">("borc");
  const [preSelectedCustomerId, setPreSelectedCustomerId] = useState<number | null>(null);
  const [statementCustomerId, setStatementCustomerId] = useState<number | null>(null);
  const [statementModalOpen, setStatementModalOpen] = useState(false);
  const [productCatalogOpen, setProductCatalogOpen] = useState(false);
  const [firmaDebtOpen, setFirmaDebtOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordActionLabel, setPasswordActionLabel] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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

  function openTransaction(type: "borc" | "tahsilat", customerId?: number) {
    setTransactionType(type);
    setPreSelectedCustomerId(customerId ?? null);
    setTransactionModalOpen(true);
  }

  function openStatement(customerId: number) {
    setStatementCustomerId(customerId);
    setStatementModalOpen(true);
  }

  function handleDeleteCustomer(customer: CustomerWithBalance) {
    const confirmed = window.confirm(
      `"${customer.ad_soyad}" müşterisini ve tüm borç/tahsilat kayıtlarını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
    );
    if (!confirmed) return;

    void deleteCustomer(customer.musteri_id)
      .then(refreshData)
      .catch((error: unknown) => {
        window.alert(
          error instanceof Error ? error.message : "Müşteri silinirken bir hata oluştu."
        );
      });
  }

  function refreshData() {
    router.refresh();
  }

  return (
    <PrivacyProvider>
      <div className="min-h-screen bg-[#FAF8F5] text-[#1F2922]">
        <Navbar
          onOpenNewCustomer={() => setCustomerModalOpen(true)}
          onOpenNewDebt={() => openTransaction("borc")}
          onOpenNewPayment={() => openTransaction("tahsilat")}
          onOpenProductCatalog={() => setProductCatalogOpen(true)}
          onOpenFirmaDebt={() => setFirmaDebtOpen(true)}
          currentUser={currentUser}
        />

        <main className="mx-auto max-w-7xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#2D4C3A]">Müşteriler</h1>
            <p className="mt-1 text-sm text-[#6B776D]">Kayıtlı tüm müşterilere buradan ulaşabilirsiniz.</p>
          </div>
          <CustomerTable
            customers={customers}
            neighborhoods={neighborhoods}
            onOpenStatement={openStatement}
            onDeleteCustomer={handleDeleteCustomer}
          />
        </main>

        <footer className="mt-16 border-t border-[#EAE6DF] py-6 text-center text-xs text-[#6B776D]">
          <p className="font-serif-brand font-semibold tracking-wider text-[#2D4C3A]">
            AKINOĞLU TARIM — Zirai İlaç • Fide • Gübre • Tohum
          </p>
        </footer>

        <PasswordModal
          isOpen={passwordModalOpen}
          actionLabel={passwordActionLabel}
          onSuccess={handlePasswordSuccess}
          onCancel={() => {
            setPasswordModalOpen(false);
            setPendingAction(null);
          }}
        />
        <CustomerModal
          isOpen={customerModalOpen}
          onClose={() => setCustomerModalOpen(false)}
          onSuccess={refreshData}
        />
        <TransactionModal
          isOpen={transactionModalOpen}
          type={transactionType}
          onClose={() => setTransactionModalOpen(false)}
          onSuccess={refreshData}
          preSelectedCustomerId={preSelectedCustomerId}
          customers={customers}
          availableProducts={products}
          onOpenProductCatalog={() => setProductCatalogOpen(true)}
        />
        <StatementModal
          isOpen={statementModalOpen}
          customerId={statementCustomerId}
          onClose={() => setStatementModalOpen(false)}
          onOpenDebt={(id) => openTransaction("borc", id)}
          onOpenPayment={(id) => openTransaction("tahsilat", id)}
          onDataChanged={refreshData}
          requirePassword={requirePassword}
        />
        <ProductCatalogModal
          isOpen={productCatalogOpen}
          onClose={() => setProductCatalogOpen(false)}
          onProductsChanged={refreshData}
          requirePassword={requirePassword}
        />
        <FirmaDebtModal isOpen={firmaDebtOpen} onClose={() => setFirmaDebtOpen(false)} />
      </div>
    </PrivacyProvider>
  );
}
