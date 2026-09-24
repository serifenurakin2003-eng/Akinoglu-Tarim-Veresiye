"use client";

import { useState, useRef, useEffect } from "react";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  Sprout,
  User,
  UserPlus,
  LogIn,
} from "lucide-react";
import { loginAction, registerAction } from "@/lib/actions";
import BrandLogo from "@/components/BrandLogo";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginInputRef = useRef<HTMLInputElement>(null);
  const regInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setError(null);
    if (mode === "login") {
      loginInputRef.current?.focus();
    } else {
      regInputRef.current?.focus();
    }
  }, [mode]);

  async function handleLoginSubmit(e: React.FormEvent) {
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

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regPassword) {
      setError("Lütfen tüm alanları doldurunuz.");
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setError("Girdiğiniz şifreler birbiriyle eşleşmiyor.");
      return;
    }
    if (regPassword.length < 4) {
      setError("Şifreniz en az 4 karakter olmalıdır.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await registerAction({
        ad_soyad: regName.trim(),
        kullanici_adi: regUsername.trim(),
        sifre: regPassword,
      });
      if (res && !res.ok) {
        setError(res.error || "Kayıt oluşturulamadı.");
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
      setError("Kayıt işlemi sırasında bir hata oluştu. Lütfen tekrar deneyiniz.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center px-4 py-8">
      {/* Arka plan deseni */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#2D4C3A]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#8D5B28]/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo & Başlık */}
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
            Cari & Borç Takip Portalı
          </div>
        </div>

        {/* Giriş & Kayıt Kartı */}
        <div className="rounded-2xl border border-[#E5E0D8] bg-white p-6 sm:p-8 shadow-xl shadow-[#2D4C3A]/5">
          {/* Tab Seçimi */}
          <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#FAF8F5] p-1 border border-[#E8DCCB]/60">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs sm:text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-white text-[#2D4C3A] shadow-xs"
                  : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs sm:text-sm font-bold transition-all ${
                mode === "register"
                  ? "bg-white text-[#2D4C3A] shadow-xs"
                  : "text-[#6B7280] hover:text-[#1F2937]"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Kayıt Ol
            </button>
          </div>

          {/* Hata Bildirimi */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {mode === "login" ? (
            /* GİRİŞ FORMU */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
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
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
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
                    onClick={() => setShowLoginPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#9CA3AF] hover:text-[#6B7280]"
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2D4C3A] py-3 text-sm font-semibold text-white hover:bg-[#1E3427] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs mt-2"
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

              {/* Hızlı Yönetici Giriş Butonu */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginUsername("akin");
                    setLoginPassword("123456");
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-dashed border-[#8D5B28]/40 bg-[#FAF3EB]/50 py-2 text-xs font-semibold text-[#8D5B28] hover:bg-[#FAF3EB] transition-colors"
                >
                  🌾 Yönetici Bilgilerini Doldur (akin / 123456)
                </button>
              </div>

              <div className="pt-2 text-center">
                <span className="text-xs text-[#6B7280]">Hesabınız yok mu? </span>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-xs font-bold text-[#8D5B28] hover:underline"
                >
                  Hemen Kayıt Olun
                </button>
              </div>
            </form>
          ) : (
            /* KAYIT FORMU */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Ad Soyad
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF]">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    ref={regInputRef}
                    type="text"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Örn: Ahmet Akınoğlu"
                    autoComplete="name"
                    required
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] pl-10 pr-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF]">
                    <span className="text-xs font-bold text-[#9CA3AF]">@</span>
                  </div>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => {
                      setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ""));
                      if (error) setError(null);
                    }}
                    placeholder="Örn: ahmetakinoglu"
                    autoComplete="username"
                    required
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] pl-10 pr-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
                <p className="mt-1 text-[11px] text-[#9CA3AF]">
                  Boşluksuz, küçük harf ve rakamlardan oluşmalıdır.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Şifreniz
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPassword}
                    onChange={(e) => {
                      setRegPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="En az 4 karakterli şifre"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] pl-10 pr-11 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowRegPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-[#9CA3AF] hover:text-[#6B7280]"
                  >
                    {showRegPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showRegPassword ? "text" : "password"}
                    value={regPasswordConfirm}
                    onChange={(e) => {
                      setRegPasswordConfirm(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Şifrenizi tekrar giriniz"
                    autoComplete="new-password"
                    required
                    className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF8F5] pl-10 pr-4 py-2.5 text-sm text-[#111827] placeholder-[#9CA3AF] focus:border-[#2D4C3A] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !regName.trim() ||
                  !regUsername.trim() ||
                  !regPassword ||
                  !regPasswordConfirm
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#8D5B28] py-3 text-sm font-semibold text-white hover:bg-[#72481F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Hesap oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Kayıt Ol ve Giriş Yap</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <span className="text-xs text-[#6B7280]">Zaten hesabınız var mı? </span>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-xs font-bold text-[#2D4C3A] hover:underline"
                >
                  Giriş Yapın
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Alt bilgi */}
        <p className="mt-6 text-center text-xs text-[#9CA3AF]">
          © {new Date().getFullYear()} Akınoğlu Tarım — Tüm hakları saklıdır.
        </p>
      </div>
    </div>
  );
}
