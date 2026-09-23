import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giriş — Akınoğlu Tarım Cari Takip",
  description: "Akınoğlu Tarım Borç & Müşteri Takip Sistemine giriş yapın.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
