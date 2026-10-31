"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  Sprout,
  User,
  LogIn,
} from "lucide-react";
import { loginAction } from "@/lib/actions";
import BrandLogo from "@/components/BrandLogo";

export default function LoginPage() {
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loginInputRef.current?.focus();
  }, []);

  async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword) {
      setError("Lütfen kullanıcı adı ve şifrenizi giriniz.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await loginAction({
        kullanici_adi: loginUsername.trim(),
        sifre: loginPassword,
      });
      if (res && !res.ok) {
        setError(res.error || "Giriş başarısız. Lütfen bilgilerinizi kontrol ediniz.");
        setLoading(false);
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string; digest?: string };
      if (
        errorObj?.message?.includes("NEXT_REDIRECT") ||
        errorObj?.digest?.includes("NEXT_REDIRECT")
      ) {
        return;
      }
      setError("Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyiniz.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-4 py-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#2D4C3A]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#8D5B28]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center justify-center">
            <BrandLogo className="h-20 w-20 filter drop-shadow-sm" />
          </div>
          <h1 className="font-serif-brand text-3xl font-extrabold tracking-[0.06em] text-[#2D4C3A]">
            AKINOĞLU TARIM
          </h1>
          <p className="mt-1 text-sm font-medium text-[#6B7280]">
            Zirai İlaç • Fide • Gübre • Tohum
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#E5E0D8] bg-white px-3.5 py-1 text-xs font-semibold text-[#4B5563] shadow-xs">
            <Sprout className="h-3.5 w-3.5 text-[#6F8B67]" />
            Cari &amp; Borç Takip Portalı
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-xl shadow-[#2D4C3A]/5">
          <h2 className="mb-6 text-center font-serif-brand text-xl font-bold text-[#2D4C3A]">
            Güvenli Giriş
          </h2>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  ref={loginInputRef}
                  type="text"
                  value={loginUsername}
                  onChange={(e) => {
                    setLoginUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Kullanıcı adınızı giriniz"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] pl-10 pr-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[#374151]">
                Şifre
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Şifrenizi giriniz"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] pl-10 pr-11 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowLoginPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#9CA3AF] hover:text-[#6B7280]"
                  aria-label={showLoginPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !loginUsername.trim() || !loginPassword}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D4C3A] py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#1E3427] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Giriş Yap</span>
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-[#6B7280]">
            Yalnızca veritabanında kayıtlı kullanıcılar giriş yapabilir.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-[#9CA3AF]">
          © {new Date().getFullYear()} Akınoğlu Tarım — Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
