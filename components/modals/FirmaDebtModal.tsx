"use client";

import { useState, useEffect } from "react";
import {
  X,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  FirmaBorc,
  getFirmaBorclar,
  addFirmaBorc,
  toggleFirmaBorcOdendi,
  deleteFirmaBorc,
} from "@/lib/actions";
import { formatCurrency } from "@/components/StatCards";

interface FirmaDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FirmaDebtModal({ isOpen, onClose }: FirmaDebtModalProps) {
  const [borclar, setBorclar] = useState<FirmaBorc[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [alacakli, setAlacakli] = useState("");
  const [tutar, setTutar] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [tarih, setTarih] = useState(() => new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBorclar();
    } else {
      setBorclar([]);
      setShowForm(false);
      resetForm();
    }
  }, [isOpen]);

  function resetForm() {
    setAlacakli("");
    setTutar("");
    setAciklama("");
    setTarih(new Date().toISOString().split("T")[0]);
    setFormError(null);
  }

  async function loadBorclar() {
    setLoading(true);
    setError(null);
    try {
      const data = await getFirmaBorclar();
      setBorclar(data);
    } catch (err) {
      setError("Firma borçları yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const tutarNum = parseFloat(tutar.replace(",", "."));
    if (!alacakli.trim()) {
      setFormError("Alacaklı adı zorunludur.");
      return;
    }
    if (!tutar || isNaN(tutarNum) || tutarNum <= 0) {
      setFormError("Geçerli bir tutar giriniz.");
      return;
    }
    setFormLoading(true);
    setFormError(null);
    try {
      await addFirmaBorc({ alacakli, tutar: tutarNum, aciklama, tarih });
      resetForm();
      setShowForm(false);
      await loadBorclar();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(id: number) {
    setActionLoading(`toggle-${id}`);
    try {
      await toggleFirmaBorcOdendi(id);
      await loadBorclar();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: number, alacakliAdi: string) {
    if (!confirm(`"${alacakliAdi}" borcunu silmek istediğinize emin misiniz?`)) return;
    setActionLoading(`delete-${id}`);
    try {
      await deleteFirmaBorc(id);
      await loadBorclar();
    } finally {
      setActionLoading(null);
    }
  }

  if (!isOpen) return null;

  const bekleyenBorclar = borclar.filter((b) => !b.odendi);
  const odenenBorclar = borclar.filter((b) => b.odendi);
  const toplamBekleyen = bekleyenBorclar.reduce((s, b) => s + b.tutar, 0);
  const toplamOdenen = odenenBorclar.reduce((s, b) => s + b.tutar, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#1F2922]/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-2xl border border-[#EAE6DF] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE6DF] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF3EB] border border-[#E8DCCB]">
              <Building2 className="h-5 w-5 text-[#8D5B28]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1F2922]">Firma Borçları</h3>
              <p className="text-xs text-[#6B776D]">Tedarikçilere ve dışarıya ödenmesi gereken borçlar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowForm((v) => !v); setFormError(null); }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#8D5B28] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#72481F] transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Borç Ekle
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-[#6B776D] hover:bg-[#FAF8F5] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-2 gap-3 border-b border-[#EAE6DF] bg-[#FAF8F5] px-5 py-3">
          <div className="rounded-xl border border-[#E8DCCB] bg-[#FAF3EB] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8D5B28]">Bekleyen Borç</p>
            <p className="mt-0.5 text-xl font-extrabold text-[#8D5B28] tabular-nums">
              {formatCurrency(toplamBekleyen)}
            </p>
            <p className="text-[10px] text-[#6B776D]">{bekleyenBorclar.length} adet ödenmemiş</p>
          </div>
          <div className="rounded-xl border border-[#D0E0D4] bg-[#EEF4F0] p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#2D4C3A]">Ödenen Borç</p>
            <p className="mt-0.5 text-xl font-extrabold text-[#2D4C3A] tabular-nums">
              {formatCurrency(toplamOdenen)}
            </p>
            <p className="text-[10px] text-[#6B776D]">{odenenBorclar.length} adet ödendi</p>
          </div>
        </div>

        {/* Yeni Borç Formu */}
        {showForm && (
          <form
            onSubmit={handleAdd}
            className="border-b border-[#EAE6DF] bg-[#FDFAF7] px-5 py-4 space-y-3"
          >
            <p className="text-xs font-bold text-[#8D5B28] uppercase tracking-wide">Yeni Borç Girişi</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Alacaklı (Kim?)</label>
                <input
                  type="text"
                  value={alacakli}
                  onChange={(e) => setAlacakli(e.target.value)}
                  placeholder="Tedarikçi / Kişi adı..."
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#8D5B28] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Tutar (₺)</label>
                <input
                  type="number"
                  value={tutar}
                  onChange={(e) => setTutar(e.target.value)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#8D5B28] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Tarih</label>
                <input
                  type="date"
                  value={tarih}
                  onChange={(e) => setTarih(e.target.value)}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] focus:border-[#8D5B28] focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Açıklama (İsteğe Bağlı)</label>
                <input
                  type="text"
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  placeholder="Ne için borçlanıldı..."
                  className="w-full rounded-xl border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#8D5B28] focus:outline-none transition"
                />
              </div>
            </div>
            {formError && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                {formError}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="flex-1 rounded-xl border border-[#D1D5DB] bg-white px-4 py-2 text-xs font-semibold text-[#374151] hover:bg-[#FAF8F5] transition"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#8D5B28] px-4 py-2 text-xs font-semibold text-white hover:bg-[#72481F] disabled:opacity-50 transition"
              >
                {formLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Kaydet
              </button>
            </div>
          </form>
        )}

        {/* Borç Listesi */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#8D5B28]" />
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-700">{error}</div>
          ) : borclar.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-[#6B776D]">
              <Building2 className="h-10 w-10 text-[#D1D5DB]" />
              <p className="mt-2 text-sm font-medium">Henüz firma borcu kaydedilmemiş.</p>
              <p className="text-xs mt-1">Yukarıdan "Borç Ekle" butonuna tıklayın.</p>
            </div>
          ) : (
            <>
              {/* Ödenmemiş Borçlar */}
              {bekleyenBorclar.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8D5B28] px-1">
                    Ödenmemiş ({bekleyenBorclar.length})
                  </p>
                  {bekleyenBorclar.map((borc) => (
                    <BorcRow
                      key={borc.id}
                      borc={borc}
                      actionLoading={actionLoading}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}

              {/* Ödenmiş Borçlar */}
              {odenenBorclar.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#2D4C3A] px-1">
                    Ödendi ({odenenBorclar.length})
                  </p>
                  {odenenBorclar.map((borc) => (
                    <BorcRow
                      key={borc.id}
                      borc={borc}
                      actionLoading={actionLoading}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#EAE6DF] px-5 py-3 bg-[#FAF8F5] rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full border border-[#D1D5DB] bg-white px-5 py-1.5 text-xs font-semibold text-[#1F2922] hover:bg-[#FAF8F5] transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

function BorcRow({
  borc,
  actionLoading,
  onToggle,
  onDelete,
}: {
  borc: FirmaBorc;
  actionLoading: string | null;
  onToggle: (id: number) => void;
  onDelete: (id: number, name: string) => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
        borc.odendi
          ? "border-[#D0E0D4] bg-[#EEF4F0]/50"
          : "border-[#E8DCCB] bg-[#FAF3EB]/40"
      }`}
    >
      {/* Ödendi Toggle */}
      <button
        onClick={() => onToggle(borc.id)}
        disabled={actionLoading !== null}
        title={borc.odendi ? "Ödenmedi olarak işaretle" : "Ödendi olarak işaretle"}
        className="flex-shrink-0 text-[#2D4C3A] disabled:opacity-40 transition-opacity"
      >
        {actionLoading === `toggle-${borc.id}` ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : borc.odendi ? (
          <CheckCircle2 className="h-5 w-5 text-[#2D4C3A]" />
        ) : (
          <Circle className="h-5 w-5 text-[#8D5B28]" />
        )}
      </button>

      {/* Bilgiler */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-bold truncate ${
              borc.odendi ? "text-[#6B776D] line-through" : "text-[#1F2922]"
            }`}
          >
            {borc.alacakli}
          </span>
          {borc.odendi && (
            <span className="inline-block rounded-full bg-[#2D4C3A] px-2 py-0.5 text-[9px] font-bold text-white">
              Ödendi
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-[#6B776D]">{borc.tarih}</span>
          {borc.aciklama && (
            <span className="text-xs text-[#6B776D] truncate">· {borc.aciklama}</span>
          )}
        </div>
      </div>

      {/* Tutar */}
      <span
        className={`text-base font-extrabold tabular-nums flex-shrink-0 ${
          borc.odendi ? "text-[#6B776D]" : "text-[#8D5B28]"
        }`}
      >
        {formatCurrency(borc.tutar)}
      </span>

      {/* Sil */}
      <button
        onClick={() => onDelete(borc.id, borc.alacakli)}
        disabled={actionLoading !== null}
        title="Sil"
        className="flex-shrink-0 rounded-full p-1 text-[#9CA3AF] hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition"
      >
        {actionLoading === `delete-${borc.id}` ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
