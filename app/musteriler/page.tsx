import type { Metadata } from "next";
import CustomerDirectoryClient from "@/components/CustomerDirectoryClient";
import { getCurrentUser, getCustomers, getNeighborhoods, getProducts } from "@/lib/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Müşteriler — Akınoğlu Tarım",
  description: "Tüm müşteri kayıtları ve cari hesapları",
};

export default async function MusterilerPage({
  searchParams,
}: {
  searchParams: Promise<{ musteriId?: string }>;
}) {
  const params = await searchParams;
  const parsedCustomerId = Number(params.musteriId);
  const initialSelectedCustomerId =
    Number.isInteger(parsedCustomerId) && parsedCustomerId > 0
      ? parsedCustomerId
      : null;
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
      initialSelectedCustomerId={initialSelectedCustomerId}
    />
  );
}
