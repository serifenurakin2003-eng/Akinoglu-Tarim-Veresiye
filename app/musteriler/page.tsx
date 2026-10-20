import type { Metadata } from "next";
import CustomerDirectoryClient from "@/components/CustomerDirectoryClient";
import { getCurrentUser, getCustomers, getNeighborhoods, getProducts } from "@/lib/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Müşteriler — Akınoğlu Tarım",
  description: "Tüm müşteri kayıtları ve cari hesapları",
};

export default async function MusterilerPage() {
  const [customers, neighborhoods, products, currentUser] = await Promise.all([
    getCustomers(),
    getNeighborhoods(),
    getProducts(),
    getCurrentUser(),
  ]);

  return (
    <CustomerDirectoryClient
      customers={customers}
      neighborhoods={neighborhoods}
      products={products}
      currentUser={currentUser}
    />
  );
}
