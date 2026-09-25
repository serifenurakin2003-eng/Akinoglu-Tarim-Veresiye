"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, getSessionUser, type SessionUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export interface CustomerWithBalance {
  musteri_id: number;
  ad_soyad: string;
  telefon: string | null;
  mahalle: string | null;
  kayit_tarihi: string | null;
  toplam_borc: number;
  toplam_tahsilat: number;
  kalan_bakiye: number;
}

export interface ProductItem {
  urun_id: number;
  kod: string;
  ad: string;
  kategori: string | null;
  birim: string;
  fiyat: number;
  aktif: boolean;
}

export interface StatementDebtItemLine {
  kalem_id: number;
  urun_id?: number | null;
  urun_kodu?: string | null;
  urun_adi: string;
  miktar: number;
  birim: string | null;
  birim_fiyat: number;
  toplam_fiyat: number;
}

export interface StatementItem {
  id: number;
  tip: "borc" | "tahsilat";
  tarih: string;
  tutar: number;
  aciklama: string | null;
  kalemler?: StatementDebtItemLine[];
}

export interface CustomerStatement {
  musteri: CustomerWithBalance;
  hareketler: StatementItem[];
}

export interface DailyRevenueItem {
  tarih: string; // YYYY-MM-DD
  toplamHasilat: number;
  islemSayisi: number;
}

export interface DayCollectionDetail {
  tahsilat_id: number;
  musteri_id: number;
  musteri_ad: string;
  odenen_tutar: number;
  tarih: string;
}

export interface DashboardStats {
  toplamBorc: number;
  toplamTahsilat: number;
  kalanAlacak: number;
  toplamMusteriSayisi: number;
  borcluMusteriSayisi: number;
  bugunTarih: string;
  bugunHasilat: number;
  bugunIslemSayisi: number;
  gunlukHasilatGecmisi: DailyRevenueItem[];
  sonHareketler: {
    id: string;
    musteri_id: number;
    musteri_ad: string;
    tip: "borc" | "tahsilat";
    tutar: number;
    aciklama: string | null;
    tarih: string;
  }[];
  enCokBorclular: {
    musteri_id: number;
    ad_soyad: string;
    mahalle: string | null;
    bakiye: number;
  }[];
}

// 1. Dashboard İstatistikleri
export async function getDashboardStats(): Promise<DashboardStats> {
  const [musterilerList, borclarList, tahsilatlarList, tumTahsilatlar] = await Promise.all([
    prisma.musteriler.findMany({
      include: {
        borclar: true,
        tahsilatlar: true,
      },
    }),
    prisma.borclar.findMany({
      take: 10,
      orderBy: { borc_id: "desc" },
      include: {
        musteriler: {
          select: { ad_soyad: true },
        },
      },
    }),
    prisma.tahsilatlar.findMany({
      take: 10,
      orderBy: { tahsilat_id: "desc" },
      include: {
        musteriler: {
          select: { ad_soyad: true },
        },
      },
    }),
    prisma.tahsilatlar.findMany({
      orderBy: { tarih: "desc" },
      select: {
        tahsilat_id: true,
        odenen_tutar: true,
        tarih: true,
      },
    }),
  ]);

  let toplamBorc = 0;
  let toplamTahsilat = 0;
  let borcluMusteriSayisi = 0;

  const musteriBakiyeleri = musterilerList.map((m) => {
    const musteriBorc = m.borclar.reduce(
      (sum, b) => sum + Number(b.tutar || 0),
      0
    );
    const musteriTahsilat = m.tahsilatlar.reduce(
      (sum, t) => sum + Number(t.odenen_tutar || 0),
      0
    );
    const bakiye = musteriBorc - musteriTahsilat;

    toplamBorc += musteriBorc;
    toplamTahsilat += musteriTahsilat;

    if (bakiye > 0) {
      borcluMusteriSayisi++;
    }

    return {
      musteri_id: m.musteri_id,
      ad_soyad: m.ad_soyad,
      mahalle: m.mahalle,
      bakiye,
    };
  });

  const enCokBorclular = musteriBakiyeleri
    .filter((m) => m.bakiye > 0)
    .sort((a, b) => b.bakiye - a.bakiye)
    .slice(0, 5);

  // Günlük hasılat geçmişi hesaplama (Tarih bazında gruplama)
  const gunlukMap = new Map<string, { toplamHasilat: number; islemSayisi: number }>();
  for (const t of tumTahsilatlar) {
    const dStr = t.tarih ? t.tarih.toISOString().split("T")[0] : "";
    if (!dStr) continue;
    const item = gunlukMap.get(dStr) || { toplamHasilat: 0, islemSayisi: 0 };
    item.toplamHasilat += Number(t.odenen_tutar || 0);
    item.islemSayisi += 1;
    gunlukMap.set(dStr, item);
  }

  const gunlukHasilatGecmisi: DailyRevenueItem[] = Array.from(gunlukMap.entries())
    .map(([tarih, data]) => ({
      tarih,
      toplamHasilat: data.toplamHasilat,
      islemSayisi: data.islemSayisi,
    }))
    .sort((a, b) => b.tarih.localeCompare(a.tarih));

  // Türkiye saatine göre bugünün tarihi (YYYY-MM-DD)
  const now = new Date();
  const bugunTarih = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const bugunData = gunlukMap.get(bugunTarih);
  const bugunHasilat = bugunData?.toplamHasilat || 0;
  const bugunIslemSayisi = bugunData?.islemSayisi || 0;

  // Son hareketleri birleştir ve sırala
  const sonBorclar = borclarList.map((b) => ({
    id: `b-${b.borc_id}`,
    musteri_id: b.musteri_id,
    musteri_ad: b.musteriler?.ad_soyad || "Bilinmiyor",
    tip: "borc" as const,
    tutar: Number(b.tutar),
    aciklama: b.aciklama,
    tarih: b.tarih ? b.tarih.toISOString().split("T")[0] : "",
    rawDate: b.tarih ? new Date(b.tarih).getTime() : 0,
  }));

  const sonTahsilatlar = tahsilatlarList.map((t) => ({
    id: `t-${t.tahsilat_id}`,
    musteri_id: t.musteri_id,
    musteri_ad: t.musteriler?.ad_soyad || "Bilinmiyor",
    tip: "tahsilat" as const,
    tutar: Number(t.odenen_tutar),
    aciklama: "Tahsilat / Ödeme",
    tarih: t.tarih ? t.tarih.toISOString().split("T")[0] : "",
    rawDate: t.tarih ? new Date(t.tarih).getTime() : 0,
  }));

  const sonHareketler = [...sonBorclar, ...sonTahsilatlar]
    .sort((a, b) => b.rawDate - a.rawDate)
    .slice(0, 8)
    .map(({ rawDate, ...rest }) => rest);

  return {
    toplamBorc,
    toplamTahsilat,
    kalanAlacak: toplamBorc - toplamTahsilat,
    toplamMusteriSayisi: musterilerList.length,
    borcluMusteriSayisi,
    bugunTarih,
    bugunHasilat,
    bugunIslemSayisi,
    gunlukHasilatGecmisi,
    sonHareketler,
    enCokBorclular,
  };
}

// 2. Müşterileri Filtreli Getirme
export async function getCustomers(
  search?: string,
  mahalle?: string
): Promise<CustomerWithBalance[]> {
  const whereClause: Record<string, unknown> = {};

  if (search && search.trim() !== "") {
    whereClause.OR = [
      { ad_soyad: { contains: search.trim(), mode: "insensitive" } },
      { telefon: { contains: search.trim() } },
    ];
  }

  if (mahalle && mahalle !== "all") {
    whereClause.mahalle = mahalle;
  }

  const musterilerList = await prisma.musteriler.findMany({
    where: whereClause,
    include: {
      borclar: true,
      tahsilatlar: true,
    },
    orderBy: {
      ad_soyad: "asc",
    },
  });

  return musterilerList.map((m) => {
    const toplam_borc = m.borclar.reduce(
      (sum, b) => sum + Number(b.tutar || 0),
      0
    );
    const toplam_tahsilat = m.tahsilatlar.reduce(
      (sum, t) => sum + Number(t.odenen_tutar || 0),
      0
    );
    const kalan_bakiye = toplam_borc - toplam_tahsilat;

    return {
      musteri_id: m.musteri_id,
      ad_soyad: m.ad_soyad,
      telefon: m.telefon,
      mahalle: m.mahalle,
      kayit_tarihi: m.kayit_tarihi
        ? m.kayit_tarihi.toISOString().split("T")[0]
        : null,
      toplam_borc,
      toplam_tahsilat,
      kalan_bakiye,
    };
  });
}

// 3. Mahalle Listesi (Filtreleme için)
export async function getNeighborhoods(): Promise<string[]> {
  const mahalleler = await prisma.musteriler.findMany({
    where: {
      mahalle: { not: null },
    },
    select: {
      mahalle: true,
    },
    distinct: ["mahalle"],
    orderBy: {
      mahalle: "asc",
    },
  });

  return mahalleler
    .map((m) => m.mahalle)
    .filter((m): m is string => Boolean(m && m.trim() !== ""));
}

// 4. Müşteri Oluşturma
export async function createCustomer(formData: {
  ad_soyad: string;
  telefon?: string;
  mahalle?: string;
}) {
  const trimmedName = formData.ad_soyad?.trim();
  if (!trimmedName) {
    throw new Error("Müşteri adı ve soyadı zorunludur.");
  }

  // 11 haneli telefon zorunluluğu
  const cleanPhone = formData.telefon?.replace(/\D/g, "") || "";
  if (cleanPhone.length !== 11) {
    throw new Error("Telefon numarası 11 haneli olmalıdır (Örn: 05XXXXXXXXX).");
  }

  // Aynı isimde müşteri kontrolü (case-insensitive)
  const existingCustomer = await prisma.musteriler.findFirst({
    where: {
      ad_soyad: {
        equals: trimmedName,
        mode: "insensitive",
      },
    },
  });

  if (existingCustomer) {
    throw new Error(`"${trimmedName}" isimli bir müşteri zaten kayıtlı.`);
  }

  const newCustomer = await prisma.musteriler.create({
    data: {
      ad_soyad: trimmedName,
      telefon: cleanPhone,
      mahalle: formData.mahalle?.trim() || null,
      kayit_tarihi: new Date(),
    },
  });

  revalidatePath("/");
  return {
    success: true,
    musteri_id: newCustomer.musteri_id,
    ad_soyad: newCustomer.ad_soyad,
    telefon: newCustomer.telefon,
    mahalle: newCustomer.mahalle,
    kayit_tarihi: newCustomer.kayit_tarihi
      ? newCustomer.kayit_tarihi.toISOString().split("T")[0]
      : null,
  };
}

// 5. Müşteri Güncelleme
export async function updateCustomer(
  musteri_id: number,
  formData: {
    ad_soyad: string;
    telefon?: string;
    mahalle?: string;
  }
) {
  const trimmedName = formData.ad_soyad?.trim();
  if (!trimmedName) {
    throw new Error("Müşteri adı ve soyadı zorunludur.");
  }

  // 11 haneli telefon zorunluluğu
  const cleanPhone = formData.telefon?.replace(/\D/g, "") || "";
  if (cleanPhone.length !== 11) {
    throw new Error("Telefon numarası 11 haneli olmalıdır (Örn: 05XXXXXXXXX).");
  }

  // Başka bir müşteride aynı isim var mı kontrolü
  const duplicateCustomer = await prisma.musteriler.findFirst({
    where: {
      ad_soyad: {
        equals: trimmedName,
        mode: "insensitive",
      },
      NOT: {
        musteri_id,
      },
    },
  });

  if (duplicateCustomer) {
    throw new Error(`"${trimmedName}" isimli başka bir müşteri zaten kayıtlı.`);
  }

  const updated = await prisma.musteriler.update({
    where: { musteri_id },
    data: {
      ad_soyad: trimmedName,
      telefon: cleanPhone,
      mahalle: formData.mahalle?.trim() || null,
    },
  });

  revalidatePath("/");
  return {
    success: true,
    musteri_id: updated.musteri_id,
    ad_soyad: updated.ad_soyad,
    telefon: updated.telefon,
    mahalle: updated.mahalle,
    kayit_tarihi: updated.kayit_tarihi
      ? updated.kayit_tarihi.toISOString().split("T")[0]
      : null,
  };
}

// 6. Müşteri Silme
export async function deleteCustomer(musteri_id: number) {
  // Müşterinin var olup olmadığını kontrol et
  const musteri = await prisma.musteriler.findUnique({
    where: { musteri_id },
  });
  if (!musteri) {
    throw new Error("Müşteri bulunamadı veya zaten silinmiş.");
  }

  // İnteraktif transaction ile ilişkili kayıtları ve müşteriyi sil
  await prisma.$transaction(async (tx) => {
    await tx.borclar.deleteMany({ where: { musteri_id } });
    await tx.tahsilatlar.deleteMany({ where: { musteri_id } });
    await tx.musteriler.delete({ where: { musteri_id } });
  });

  revalidatePath("/");
  return { success: true };
}

// 6b. Admin Şifre Doğrulama
export async function verifyAdminPassword(password: string): Promise<{ ok: boolean }> {
  const adminPassword = process.env.ADMIN_PASSWORD || "AkinAdmin*9841#";
  return { ok: password === adminPassword };
}

export interface DebtItemInput {
  urun_id?: number | null;
  urun_kodu?: string | null;
  urun_adi: string;
  miktar: number;
  birim?: string;
  birim_fiyat: number;
  toplam_fiyat: number;
}

// 7. Müşteri Ekstresi (Cari Hesap Dökümü)
export async function getCustomerStatement(
  musteri_id: number
): Promise<CustomerStatement> {
  const musteri = await prisma.musteriler.findUnique({
    where: { musteri_id },
    include: {
      borclar: {
        orderBy: { tarih: "asc" },
        include: {
          borc_kalemleri: true,
        },
      },
      tahsilatlar: {
        orderBy: { tarih: "asc" },
      },
    },
  });

  if (!musteri) {
    throw new Error("Müşteri bulunamadı.");
  }

  const toplam_borc = musteri.borclar.reduce(
    (sum, b) => sum + Number(b.tutar || 0),
    0
  );
  const toplam_tahsilat = musteri.tahsilatlar.reduce(
    (sum, t) => sum + Number(t.odenen_tutar || 0),
    0
  );

  const customerWithBalance: CustomerWithBalance = {
    musteri_id: musteri.musteri_id,
    ad_soyad: musteri.ad_soyad,
    telefon: musteri.telefon,
    mahalle: musteri.mahalle,
    kayit_tarihi: musteri.kayit_tarihi
      ? musteri.kayit_tarihi.toISOString().split("T")[0]
      : null,
    toplam_borc,
    toplam_tahsilat,
    kalan_bakiye: toplam_borc - toplam_tahsilat,
  };

  const borcItems: (StatementItem & { rawDate: number })[] =
    musteri.borclar.map((b) => ({
      id: b.borc_id,
      tip: "borc" as const,
      tarih: b.tarih ? b.tarih.toISOString().split("T")[0] : "",
      tutar: Number(b.tutar),
      aciklama: b.aciklama,
      kalemler: (b.borc_kalemleri || []).map((k) => ({
        kalem_id: k.kalem_id,
        urun_id: k.urun_id,
        urun_kodu: k.urun_kodu,
        urun_adi: k.urun_adi,
        miktar: Number(k.miktar),
        birim: k.birim,
        birim_fiyat: Number(k.birim_fiyat),
        toplam_fiyat: Number(k.toplam_fiyat),
      })),
      rawDate: b.tarih ? new Date(b.tarih).getTime() : 0,
    }));

  const tahsilatItems: (StatementItem & { rawDate: number })[] =
    musteri.tahsilatlar.map((t) => ({
      id: t.tahsilat_id,
      tip: "tahsilat" as const,
      tarih: t.tarih ? t.tarih.toISOString().split("T")[0] : "",
      tutar: Number(t.odenen_tutar),
      aciklama: "Tahsilat / Ödeme",
      rawDate: t.tarih ? new Date(t.tarih).getTime() : 0,
    }));

  // Kronolojik sırala (en yeniden en eskiye veya tam tersi)
  const hareketler = [...borcItems, ...tahsilatItems]
    .sort((a, b) => b.rawDate - a.rawDate)
    .map(({ rawDate, ...item }) => item);

  return {
    musteri: customerWithBalance,
    hareketler,
  };
}

// 8. Borç Ekleme (Detaylı Ürün Kalemleri Desteği ile)
export async function addDebt(data: {
  musteri_id: number;
  tutar: number;
  aciklama?: string;
  tarih?: string;
  kalemler?: DebtItemInput[];
}) {
  if (!data.musteri_id || isNaN(data.musteri_id)) {
    throw new Error("Geçerli bir müşteri seçmelisiniz.");
  }
  if (!data.tutar || data.tutar <= 0) {
    throw new Error("Geçerli bir borç tutarı giriniz.");
  }

  // Kalemler varsa ve açıklama boşsa otomatik ürün özeti oluştur
  let generatedAciklama = data.aciklama?.trim() || "";
  if (!generatedAciklama && data.kalemler && data.kalemler.length > 0) {
    generatedAciklama = data.kalemler
      .map((k) => `${k.miktar} ${k.birim || "Adet"} ${k.urun_adi}`)
      .join(", ");
    if (generatedAciklama.length > 250) {
      generatedAciklama = generatedAciklama.slice(0, 247) + "...";
    }
  }

  const record = await prisma.$transaction(async (tx) => {
    const createdBorc = await tx.borclar.create({
      data: {
        musteri_id: data.musteri_id,
        tutar: data.tutar,
        aciklama: generatedAciklama || null,
        tarih: data.tarih ? new Date(data.tarih) : new Date(),
      },
    });

    if (data.kalemler && data.kalemler.length > 0) {
      await tx.borc_kalemleri.createMany({
        data: data.kalemler.map((item) => ({
          borc_id: createdBorc.borc_id,
          urun_id: item.urun_id || null,
          urun_kodu: item.urun_kodu?.trim() || null,
          urun_adi: item.urun_adi.trim(),
          miktar: item.miktar,
          birim: item.birim?.trim() || "Adet",
          birim_fiyat: item.birim_fiyat,
          toplam_fiyat: item.toplam_fiyat,
        })),
      });
    }

    return createdBorc;
  });

  revalidatePath("/");
  return {
    success: true,
    borc_id: record.borc_id,
    musteri_id: record.musteri_id,
    tutar: Number(record.tutar),
    aciklama: record.aciklama,
    tarih: record.tarih ? record.tarih.toISOString().split("T")[0] : null,
  };
}

// 9. Borç Silme
export async function deleteDebt(borc_id: number) {
  await prisma.borclar.delete({
    where: { borc_id },
  });

  revalidatePath("/");
  return { success: true };
}

// 10. Tahsilat Ekleme
export async function addCollection(data: {
  musteri_id: number;
  odenen_tutar: number;
  tarih?: string;
}) {
  if (!data.musteri_id || isNaN(data.musteri_id)) {
    throw new Error("Geçerli bir müşteri seçmelisiniz.");
  }
  if (!data.odenen_tutar || data.odenen_tutar <= 0) {
    throw new Error("Geçerli bir tahsilat tutarı giriniz.");
  }

  const record = await prisma.tahsilatlar.create({
    data: {
      musteri_id: data.musteri_id,
      odenen_tutar: data.odenen_tutar,
      tarih: data.tarih ? new Date(data.tarih) : new Date(),
    },
  });

  revalidatePath("/");
  return {
    success: true,
    tahsilat_id: record.tahsilat_id,
    musteri_id: record.musteri_id,
    odenen_tutar: Number(record.odenen_tutar),
    tarih: record.tarih ? record.tarih.toISOString().split("T")[0] : null,
  };
}

// 11. Tahsilat Silme
export async function deleteCollection(tahsilat_id: number) {
  await prisma.tahsilatlar.delete({
    where: { tahsilat_id },
  });

  revalidatePath("/");
  return { success: true };
}

// Kullanıcı Tablosu Kontrolü
async function ensureUserTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS kullanicilar (
        kullanici_id SERIAL PRIMARY KEY,
        ad_soyad VARCHAR(100) NOT NULL,
        kullanici_adi VARCHAR(50) NOT NULL UNIQUE,
        sifre_hash VARCHAR(255) NOT NULL,
        kayit_tarihi DATE DEFAULT CURRENT_DATE
      );
    `);
  } catch (err) {
    console.error("Error creating kullanicilar table:", err);
  }
}

// Kayıt Ol
export async function registerAction(data: {
  ad_soyad: string;
  kullanici_adi: string;
  sifre: string;
}): Promise<{ ok: boolean; error?: string }> {
  const ad_soyad = data.ad_soyad?.trim();
  const kullanici_adi = data.kullanici_adi?.trim();
  const sifre = data.sifre;

  if (!ad_soyad || ad_soyad.length < 2) {
    return { ok: false, error: "Ad Soyad en az 2 karakter olmalıdır." };
  }
  if (!kullanici_adi || kullanici_adi.length < 3) {
    return { ok: false, error: "Kullanıcı adı en az 3 karakter olmalıdır." };
  }
  if (!/^[\p{L}\p{N}._-]+$/u.test(kullanici_adi)) {
    return { ok: false, error: "Kullanıcı adı sadece harf, rakam, nokta ve alt tire içerebilir." };
  }
  if (!sifre || sifre.length < 4) {
    return { ok: false, error: "Şifre en az 4 karakter olmalıdır." };
  }

  await ensureUserTable();

  try {
    const existing = await prisma.$queryRawUnsafe<any[]>(
      `SELECT kullanici_id FROM kullanicilar WHERE LOWER(kullanici_adi) = LOWER($1) LIMIT 1`,
      kullanici_adi
    );

    if (existing && existing.length > 0) {
      return { ok: false, error: "Bu kullanıcı adı zaten alınmış. Farklı bir kullanıcı adı seçiniz." };
    }

    const hashed = hashPassword(sifre);
    const created = await prisma.$queryRawUnsafe<any[]>(
      `INSERT INTO kullanicilar (ad_soyad, kullanici_adi, sifre_hash) VALUES ($1, $2, $3) RETURNING kullanici_id, ad_soyad, kullanici_adi`,
      ad_soyad,
      kullanici_adi,
      hashed
    );

    const user = created[0];
    await createSession({
      id: user.kullanici_id,
      username: user.kullanici_adi,
      name: user.ad_soyad,
    });
  } catch (err: any) {
    console.error("registerAction error:", err);
    return { ok: false, error: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyiniz." };
  }

  redirect("/");
}

// Giriş Yap
export async function loginAction(data: {
  kullanici_adi: string;
  sifre: string;
}): Promise<{ ok: boolean; error?: string }> {
  const kullanici_adi = data.kullanici_adi?.trim();
  const sifre = data.sifre;

  if (!kullanici_adi || !sifre) {
    return { ok: false, error: "Kullanıcı adı ve şifre zorunludur." };
  }

  await ensureUserTable();

  try {
    const users = await prisma.$queryRawUnsafe<any[]>(
      `SELECT kullanici_id, ad_soyad, kullanici_adi, sifre_hash FROM kullanicilar WHERE LOWER(kullanici_adi) = LOWER($1) LIMIT 1`,
      kullanici_adi
    );

    if (!users || users.length === 0) {
      return { ok: false, error: "Kullanıcı adı veya şifre hatalı." };
    }

    const user = users[0];
    const isValid = verifyPassword(sifre, user.sifre_hash);
    if (!isValid) {
      return { ok: false, error: "Kullanıcı adı veya şifre hatalı." };
    }

    await createSession({
      id: user.kullanici_id,
      username: user.kullanici_adi,
      name: user.ad_soyad,
    });
  } catch (err: any) {
    console.error("loginAction error:", err);
    return { ok: false, error: "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyiniz." };
  }

  redirect("/");
}

// Oturum Açan Kullanıcı Bilgisi
export async function getCurrentUser(): Promise<SessionUser | null> {
  return await getSessionUser();
}

// Çıkış
export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// -------------------------------------------------------------
// ÜRÜN & İLAÇ & GÜBRE ALTYAPISI (SES KAYDI İSTEĞİ)
// -------------------------------------------------------------

const DEFAULT_SAMPLE_PRODUCTS = [
  { kod: "01", ad: "Çil İlacı (Meyve & Bağ)", kategori: "Zirai İlaç", birim: "Litre", fiyat: 450 },
  { kod: "02", ad: "Ot Zehiri (Geniş Yapraklı)", kategori: "Zirai İlaç", birim: "Litre", fiyat: 380 },
  { kod: "03", ad: "Kurt Zehiri (Böcek İlacı)", kategori: "Zirai İlaç", birim: "Litre", fiyat: 520 },
  { kod: "04", ad: "Taban Gübresi (20-20-0 Kompoze)", kategori: "Gübre", birim: "Torba", fiyat: 850 },
  { kod: "05", ad: "Üre Gübresi (%46 Azot)", kategori: "Gübre", birim: "Torba", fiyat: 920 },
  { kod: "06", ad: "Damlama Gübresi (18-18-18)", kategori: "Gübre", birim: "Torba", fiyat: 780 },
  { kod: "07", ad: "Sertifikalı Buğday Tohumu", kategori: "Tohum", birim: "Torba", fiyat: 650 },
  { kod: "08", ad: "Hibrit Domates Fidesi", kategori: "Fide", birim: "Adet", fiyat: 8.5 },
];

export async function getProducts(search?: string, kategori?: string): Promise<ProductItem[]> {
  try {
    const count = await prisma.urunler.count();
    if (count === 0) {
      // İlk açılışta ses kaydında geçen örnek zirai ürünleri ekle
      await prisma.urunler.createMany({
        data: DEFAULT_SAMPLE_PRODUCTS.map((p) => ({
          kod: p.kod,
          ad: p.ad,
          kategori: p.kategori,
          birim: p.birim,
          fiyat: p.fiyat,
          aktif: true,
        })),
      });
    }

    const whereClause: Record<string, unknown> = {
      aktif: true,
    };

    if (search && search.trim() !== "") {
      const q = search.trim();
      whereClause.OR = [
        { kod: { contains: q, mode: "insensitive" } },
        { ad: { contains: q, mode: "insensitive" } },
      ];
    }

    if (kategori && kategori !== "all") {
      whereClause.kategori = kategori;
    }

    const list = await prisma.urunler.findMany({
      where: whereClause,
      orderBy: { kod: "asc" },
    });

    return list.map((u) => ({
      urun_id: u.urun_id,
      kod: u.kod,
      ad: u.ad,
      kategori: u.kategori,
      birim: u.birim,
      fiyat: Number(u.fiyat),
      aktif: u.aktif,
    }));
  } catch (err) {
    console.error("getProducts error:", err);
    return [];
  }
}

export async function createProduct(formData: {
  kod: string;
  ad: string;
  kategori?: string;
  birim?: string;
  fiyat: number;
}) {
  const cleanCode = formData.kod?.trim().toUpperCase();
  const cleanName = formData.ad?.trim();

  if (!cleanCode) throw new Error("Ürün kodu zorunludur (Örn: 01, GBR-01).");
  if (!cleanName) throw new Error("Ürün adı zorunludur.");
  if (isNaN(formData.fiyat) || formData.fiyat < 0) {
    throw new Error("Geçerli bir birim fiyat giriniz.");
  }

  // Kod tekilliği kontrolü
  const existing = await prisma.urunler.findUnique({
    where: { kod: cleanCode },
  });

  if (existing) {
    throw new Error(`"${cleanCode}" kodlu bir ürün zaten kayıtlı (${existing.ad}).`);
  }

  const newProduct = await prisma.urunler.create({
    data: {
      kod: cleanCode,
      ad: cleanName,
      kategori: formData.kategori?.trim() || "Diğer",
      birim: formData.birim?.trim() || "Adet",
      fiyat: formData.fiyat,
      aktif: true,
    },
  });

  revalidatePath("/");
  return {
    success: true,
    urun_id: newProduct.urun_id,
    kod: newProduct.kod,
    ad: newProduct.ad,
    fiyat: Number(newProduct.fiyat),
  };
}

export async function updateProduct(
  urun_id: number,
  formData: {
    kod: string;
    ad: string;
    kategori?: string;
    birim?: string;
    fiyat: number;
  }
) {
  const cleanCode = formData.kod?.trim().toUpperCase();
  const cleanName = formData.ad?.trim();

  if (!cleanCode) throw new Error("Ürün kodu zorunludur.");
  if (!cleanName) throw new Error("Ürün adı zorunludur.");
  if (isNaN(formData.fiyat) || formData.fiyat < 0) {
    throw new Error("Geçerli bir birim fiyat giriniz.");
  }

  const existing = await prisma.urunler.findFirst({
    where: {
      kod: cleanCode,
      NOT: { urun_id },
    },
  });

  if (existing) {
    throw new Error(`"${cleanCode}" kodu başka bir üründe kullanılıyor.`);
  }

  const updated = await prisma.urunler.update({
    where: { urun_id },
    data: {
      kod: cleanCode,
      ad: cleanName,
      kategori: formData.kategori?.trim() || "Diğer",
      birim: formData.birim?.trim() || "Adet",
      fiyat: formData.fiyat,
    },
  });

  revalidatePath("/");
  return {
    success: true,
    urun_id: updated.urun_id,
    kod: updated.kod,
    ad: updated.ad,
    fiyat: Number(updated.fiyat),
  };
}

export async function deleteProduct(urun_id: number) {
  // Kalemlerde kullanılıyorsa aktif = false yap, kullanılmıyorsa sil
  const kalemCount = await prisma.borc_kalemleri.count({
    where: { urun_id },
  });

  if (kalemCount > 0) {
    await prisma.urunler.update({
      where: { urun_id },
      data: { aktif: false },
    });
  } else {
    await prisma.urunler.delete({
      where: { urun_id },
    });
  }

  revalidatePath("/");
  return { success: true };
}

// 17. Belirli Bir Tarihe Ait Tahsilat Listesini Getirme
export async function getDailyCollections(tarihStr: string): Promise<DayCollectionDetail[]> {
  if (!tarihStr) return [];

  const list = await prisma.tahsilatlar.findMany({
    orderBy: { tahsilat_id: "desc" },
    include: {
      musteriler: {
        select: { ad_soyad: true },
      },
    },
  });

  return list
    .filter((t) => {
      const dStr = t.tarih ? t.tarih.toISOString().split("T")[0] : "";
      return dStr === tarihStr;
    })
    .map((t) => ({
      tahsilat_id: t.tahsilat_id,
      musteri_id: t.musteri_id,
      musteri_ad: t.musteriler?.ad_soyad || "Bilinmiyor",
      odenen_tutar: Number(t.odenen_tutar),
      tarih: tarihStr,
    }));
}



