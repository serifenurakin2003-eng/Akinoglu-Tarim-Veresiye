"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Bağlantı Hata Yönetimi ──────────────────────────────────────────────────

async function withRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    const isConnectionError =
      msg.includes("Connection terminated") ||
      msg.includes("Server has closed the connection") ||
      msg.includes("ConnectionClosed") ||
      msg.includes("ECONNRESET") ||
      msg.includes("ETIMEDOUT") ||
      msg.includes("Connection refused") ||
      msg.includes("P1017") ||
      msg.includes("P2024") ||
      msg.includes("P2010") ||
      msg.includes("timeout");

    if (retries > 0 && isConnectionError) {
      await new Promise((r) => setTimeout(r, 600));
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}

// ─── Tipler ──────────────────────────────────────────────────────────────────

export interface SupplierWithBalance {
  tedarikci_id: number;
  firma_adi: string;
  yetkili_kisi: string | null;
  telefon: string | null;
  adres: string | null;
  kayit_tarihi: string | null;
  toplam_borc: number;
  toplam_odeme: number;
  kalan_borc: number;
}

export interface SupplierDebtItem {
  firma_borc_id: number;
  tedarikci_id: number;
  tutar: number;
  aciklama: string | null;
  tarih: string;
}

export interface SupplierPaymentItem {
  firma_odeme_id: number;
  tedarikci_id: number;
  odenen_tutar: number;
  aciklama: string | null;
  tarih: string;
}

export interface SupplierStatement {
  tedarikci: SupplierWithBalance;
  borclar: SupplierDebtItem[];
  odemeler: SupplierPaymentItem[];
  hareketler: {
    id: string;
    tip: "borc" | "odeme";
    tarih: string;
    tutar: number;
    aciklama: string | null;
  }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateStr(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toISOString().split("T")[0];
}

// ─── 1. Tüm Tedarikçileri Getir (Bakiye Hesaplı) ────────────────────────────

export async function getSuppliers(): Promise<SupplierWithBalance[]> {
  return withRetry(async () => {
    const list = await prisma.tedarikciler.findMany({
      include: {
        firma_borclari: true,
        firma_odemeleri: true,
      },
      orderBy: { firma_adi: "asc" },
    });

    return list.map((t) => {
      const toplam_borc = t.firma_borclari.reduce(
        (sum, b) => sum + Number(b.tutar || 0),
        0
      );
      const toplam_odeme = t.firma_odemeleri.reduce(
        (sum, o) => sum + Number(o.odenen_tutar || 0),
        0
      );
      return {
        tedarikci_id: t.tedarikci_id,
        firma_adi: t.firma_adi,
        yetkili_kisi: t.yetkili_kisi,
        telefon: t.telefon,
        adres: t.adres,
        kayit_tarihi: toDateStr(t.kayit_tarihi),
        toplam_borc,
        toplam_odeme,
        kalan_borc: toplam_borc - toplam_odeme,
      };
    });
  });
}

// ─── 2. Tedarikçi Detay (Borçlar + Ödemeler + Birleşik Hareket) ─────────────

export async function getSupplierStatement(
  tedarikci_id: number
): Promise<SupplierStatement> {
  return withRetry(async () => {
    const t = await prisma.tedarikciler.findUniqueOrThrow({
      where: { tedarikci_id },
      include: {
        firma_borclari: { orderBy: { tarih: "desc" } },
        firma_odemeleri: { orderBy: { tarih: "desc" } },
      },
    });

    const toplam_borc = t.firma_borclari.reduce(
      (sum, b) => sum + Number(b.tutar || 0),
      0
    );
    const toplam_odeme = t.firma_odemeleri.reduce(
      (sum, o) => sum + Number(o.odenen_tutar || 0),
      0
    );

    const tedarikci: SupplierWithBalance = {
      tedarikci_id: t.tedarikci_id,
      firma_adi: t.firma_adi,
      yetkili_kisi: t.yetkili_kisi,
      telefon: t.telefon,
      adres: t.adres,
      kayit_tarihi: toDateStr(t.kayit_tarihi),
      toplam_borc,
      toplam_odeme,
      kalan_borc: toplam_borc - toplam_odeme,
    };

    const borclar: SupplierDebtItem[] = t.firma_borclari.map((b) => ({
      firma_borc_id: b.firma_borc_id,
      tedarikci_id: b.tedarikci_id,
      tutar: Number(b.tutar),
      aciklama: b.aciklama,
      tarih: toDateStr(b.tarih),
    }));

    const odemeler: SupplierPaymentItem[] = t.firma_odemeleri.map((o) => ({
      firma_odeme_id: o.firma_odeme_id,
      tedarikci_id: o.tedarikci_id,
      odenen_tutar: Number(o.odenen_tutar),
      aciklama: o.aciklama,
      tarih: toDateStr(o.tarih),
    }));

    // Birleşik hareket listesi (tarih sırası desc)
    const hareketler = [
      ...t.firma_borclari.map((b) => ({
        id: `b-${b.firma_borc_id}`,
        tip: "borc" as const,
        tarih: toDateStr(b.tarih),
        tutar: Number(b.tutar),
        aciklama: b.aciklama,
        _rawDate: b.tarih ? new Date(b.tarih).getTime() : 0,
      })),
      ...t.firma_odemeleri.map((o) => ({
        id: `o-${o.firma_odeme_id}`,
        tip: "odeme" as const,
        tarih: toDateStr(o.tarih),
        tutar: Number(o.odenen_tutar),
        aciklama: o.aciklama,
        _rawDate: o.tarih ? new Date(o.tarih).getTime() : 0,
      })),
    ]
      .sort((a, b) => b._rawDate - a._rawDate)
      .map(({ _rawDate, ...rest }) => rest);

    return { tedarikci, borclar, odemeler, hareketler };
  });
}

// ─── 3. Tedarikçi CRUD ───────────────────────────────────────────────────────

export async function createSupplier(data: {
  firma_adi: string;
  yetkili_kisi?: string;
  telefon?: string;
  adres?: string;
}) {
  const firma_adi = data.firma_adi?.trim();
  if (!firma_adi) throw new Error("Firma adı zorunludur.");

  const existing = await prisma.tedarikciler.findFirst({
    where: { firma_adi: { equals: firma_adi, mode: "insensitive" } },
  });
  if (existing)
    throw new Error(`"${firma_adi}" adında bir tedarikçi zaten kayıtlı.`);

  const record = await prisma.tedarikciler.create({
    data: {
      firma_adi,
      yetkili_kisi: data.yetkili_kisi?.trim() || null,
      telefon: data.telefon?.trim() || null,
      adres: data.adres?.trim() || null,
      kayit_tarihi: new Date(),
    },
  });

  revalidatePath("/tedarikciler");
  revalidatePath("/");
  return { success: true, tedarikci_id: record.tedarikci_id };
}

export async function updateSupplier(
  tedarikci_id: number,
  data: {
    firma_adi: string;
    yetkili_kisi?: string;
    telefon?: string;
    adres?: string;
  }
) {
  const firma_adi = data.firma_adi?.trim();
  if (!firma_adi) throw new Error("Firma adı zorunludur.");

  const duplicate = await prisma.tedarikciler.findFirst({
    where: {
      firma_adi: { equals: firma_adi, mode: "insensitive" },
      NOT: { tedarikci_id },
    },
  });
  if (duplicate)
    throw new Error(`"${firma_adi}" adında başka bir tedarikçi kayıtlı.`);

  await prisma.tedarikciler.update({
    where: { tedarikci_id },
    data: {
      firma_adi,
      yetkili_kisi: data.yetkili_kisi?.trim() || null,
      telefon: data.telefon?.trim() || null,
      adres: data.adres?.trim() || null,
    },
  });

  revalidatePath("/tedarikciler");
  revalidatePath("/");
  return { success: true };
}

export async function deleteSupplier(tedarikci_id: number) {
  await prisma.tedarikciler.delete({ where: { tedarikci_id } });
  revalidatePath("/tedarikciler");
  revalidatePath("/");
  return { success: true };
}

// ─── 4. Firma Borcu CRUD ─────────────────────────────────────────────────────

export async function createFirmaBorc(data: {
  tedarikci_id: number;
  tutar: number;
  aciklama?: string;
  tarih?: string;
}) {
  if (!data.tutar || data.tutar <= 0) throw new Error("Tutar 0'dan büyük olmalıdır.");

  await prisma.firma_borclari.create({
    data: {
      tedarikci_id: data.tedarikci_id,
      tutar: data.tutar,
      aciklama: data.aciklama?.trim() || null,
      tarih: data.tarih ? new Date(data.tarih) : new Date(),
    },
  });

  revalidatePath("/tedarikciler");
  revalidatePath("/");
  return { success: true };
}

export async function deleteFirmaBorc(firma_borc_id: number) {
  await prisma.firma_borclari.delete({ where: { firma_borc_id } });
  revalidatePath("/tedarikciler");
  revalidatePath("/");
  return { success: true };
}

// ─── 5. Firma Ödemesi CRUD ───────────────────────────────────────────────────

export async function createFirmaOdeme(data: {
  tedarikci_id: number;
  odenen_tutar: number;
  aciklama?: string;
  tarih?: string;
}) {
  if (!data.odenen_tutar || data.odenen_tutar <= 0)
    throw new Error("Ödeme tutarı 0'dan büyük olmalıdır.");

  // Kalan borç kontrolü
  const t = await prisma.tedarikciler.findUniqueOrThrow({
    where: { tedarikci_id: data.tedarikci_id },
    include: {
      firma_borclari: true,
      firma_odemeleri: true,
    },
  });

  const toplam_borc = t.firma_borclari.reduce(
    (sum, b) => sum + Number(b.tutar || 0),
    0
  );
  const toplam_odeme = t.firma_odemeleri.reduce(
    (sum, o) => sum + Number(o.odenen_tutar || 0),
    0
  );
  const kalan_borc = Math.max(0, Number((toplam_borc - toplam_odeme).toFixed(2)));

  if (kalan_borc <= 0) {
    throw new Error(`"${t.firma_adi}" firmasına ait ödenmesi gereken borç bulunmamaktadır.`);
  }

  if (data.odenen_tutar > kalan_borc) {
    throw new Error(
      `Ödeme tutarı (${data.odenen_tutar.toLocaleString("tr-TR")} ₺), firmanın kalan borcundan (${kalan_borc.toLocaleString("tr-TR")} ₺) fazla olamaz.`
    );
  }

  await prisma.firma_odemeleri.create({
    data: {
      tedarikci_id: data.tedarikci_id,
      odenen_tutar: data.odenen_tutar,
      aciklama: data.aciklama?.trim() || null,
      tarih: data.tarih ? new Date(data.tarih) : new Date(),
    },
  });

  revalidatePath("/tedarikciler");
  revalidatePath("/");
  return { success: true };
}

export async function deleteFirmaOdeme(firma_odeme_id: number) {
  await prisma.firma_odemeleri.delete({ where: { firma_odeme_id } });
  revalidatePath("/tedarikciler");
  revalidatePath("/");
  return { success: true };
}
