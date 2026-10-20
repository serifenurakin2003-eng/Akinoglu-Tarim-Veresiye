"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatCards from "@/components/StatCards";
import RecentActivities from "@/components/RecentActivities";
import CustomerModal from "@/components/modals/CustomerModal";
import TransactionModal from "@/components/modals/TransactionModal";
import StatementModal from "@/components/modals/StatementModal";
import PasswordModal from "@/components/modals/PasswordModal";
import ProductCatalogModal from "@/components/modals/ProductCatalogModal";
import FirmaDebtModal from "@/components/modals/FirmaDebtModal";
import {
  CustomerWithBalance,
  DashboardStats,
  ProductItem,
  getDailyCollections,
} from "@/lib/actions";
import { PrivacyProvider } from "@/lib/privacy";

interface DashboardClientProps {
  initialStats: DashboardStats;
  initialCustomers: CustomerWithBalance[];
  initialProducts?: ProductItem[];
  currentUser?: { name?: string; username?: string } | null;
}

export default function DashboardClient({
  initialStats,
  initialCustomers,
  initialProducts = [],
  currentUser,
}: DashboardClientProps) {
  const router = useRouter();

  // Tarih ve Günlük Hasılat State'i
  const todayStr =
    initialStats.bugunTarih ||
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [customDailyData, setCustomDailyData] = useState<{
    [date: string]: { revenue: number; count: number };
  }>({});

  // Seçili tarihin hasılatını hesapla
  const { selectedRevenue, selectedCount } = useMemo(() => {
    if (customDailyData[selectedDate]) {
      return {
        selectedRevenue: customDailyData[selectedDate].revenue,
        selectedCount: customDailyData[selectedDate].count,
      };
    }
    const found = initialStats.gunlukHasilatGecmisi?.find(
      (d) => d.tarih === selectedDate
    );
    if (found) {
      return {
        selectedRevenue: found.toplamHasilat,
        selectedCount: found.islemSayisi,
      };
    }
    if (selectedDate === initialStats.bugunTarih) {
      return {
        selectedRevenue: initialStats.bugunHasilat || 0,
        selectedCount: initialStats.bugunIslemSayisi || 0,
      };
    }
    return { selectedRevenue: 0, selectedCount: 0 };
  }, [selectedDate, initialStats, customDailyData]);

  // Listede olmayan geçmiş bir tarih seçildiğinde sunucudan tahsilatları çek
  useEffect(() => {
    const inList = initialStats.gunlukHasilatGecmisi?.some(
      (d) => d.tarih === selectedDate
    );
    if (
      !inList &&
      selectedDate !== initialStats.bugunTarih &&
      !customDailyData[selectedDate]
    ) {
      getDailyCollections(selectedDate)
        .then((items) => {
          const total = items.reduce((sum, item) => sum + item.odenen_tutar, 0);
          setCustomDailyData((prev) => ({
            ...prev,
            [selectedDate]: { revenue: total, count: items.length },
          }));
        })
        .catch(() => {});
    }
  }, [selectedDate, initialStats, customDailyData]);

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
    <PrivacyProvider>
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
          {/* 1. Stat Flow Section */}
          <section>
            <StatCards
              stats={initialStats}
              selectedDate={selectedDate}
              selectedRevenue={selectedRevenue}
              selectedCount={selectedCount}
              todayStr={todayStr}
              onSelectDate={setSelectedDate}
            />
          </section>

          {/* 2. Günlük Hasılat & Kasa Akışı */}
          <section>
            <RecentActivities
              dailyRevenues={initialStats.gunlukHasilatGecmisi || []}
              selectedDate={selectedDate}
              selectedRevenue={selectedRevenue}
              selectedCount={selectedCount}
              todayStr={todayStr}
              onSelectDate={setSelectedDate}
              enCokBorclular={initialStats.enCokBorclular}
              onOpenStatement={handleOpenStatement}
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
    </PrivacyProvider>
  );
}
