"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, X, Loader2, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { verifyAdminPassword } from "@/lib/actions";

interface PasswordModalProps {
  isOpen: boolean;
  actionLabel: string; // Örn: "Müşteri Ekle", "Borç Yaz", "Kayıt Sil"
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PasswordModal({
  isOpen,
  actionLabel,
  onSuccess,
  onCancel,
}: PasswordModalProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Modal açıldığında sıfırla ve fokusla
  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setError(null);
      setShowPassword(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // ESC ile kapat
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setError("Lütfen admin şifresini giriniz.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await verifyAdminPassword(password);
      if (result.ok) {
        onSuccess();
      } else {
        setError("Hatalı şifre. Lütfen tekrar deneyiniz.");
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Doğrulama sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#1F2922]/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-[#EAE6DF] bg-white shadow-2xl animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EAE6DF] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAF3EB] border border-[#E8DCCB]">
              <Lock className="h-4 w-4 text-[#8D5B28]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F2937]">Admin Doğrulama</p>
              <p className="text-xs text-[#6B7280]">
                <span className="font-semibold text-[#8D5B28]">{actionLabel}</span> için şifre gerekli
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 text-[#6B776D] hover:bg-[#FAF8F5] hover:text-[#1F2922] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#374151]">
              Admin Şifresi
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Şifrenizi giriniz..."
                className={`w-full rounded-xl border px-4 py-2.5 pr-10 text-sm text-[#111827] placeholder-[#9CA3AF] focus:outline-none transition ${
                  error
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-[#D1D5DB] bg-[#FAF8F5] focus:border-[#2D4C3A] focus:bg-white"
                }`}
                autoComplete="current-password"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-[#9CA3AF] hover:text-[#6B7280]"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Hata mesajı */}
            {error && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Butonlar */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-[#D1D5DB] bg-white px-4 py-2.5 text-sm font-medium text-[#374151] hover:bg-[#FAF8F5] transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D4C3A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1E3427] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Onayla</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
