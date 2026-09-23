import type { Metadata } from "next";
import { Inter, Cinzel } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "optional",
});

const cinzel = Cinzel({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "optional",
});

export const metadata: Metadata = {
  title: "Akınoğlu Tarım - Borç & Müşteri Takip Sistemi",
  description: "Zirai İlaç • Fide • Gübre • Tohum | Cari & Borç Takip Portalı",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${cinzel.variable} h-full`}
    >
      <body className="min-h-full bg-[#FAF8F5] text-[#111827] font-sans antialiased selection:bg-[#6F8B67]/20 selection:text-[#2D4C3A]">
        {children}
      </body>
    </html>
  );
}
