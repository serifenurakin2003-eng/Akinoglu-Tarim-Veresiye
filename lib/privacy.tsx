"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  formatMasked: (amount: number, fallback?: string) => string;
}

const PrivacyContext = createContext<PrivacyContextType>({
  isPrivacyMode: false,
  togglePrivacyMode: () => {},
  formatMasked: (amount: number) => `${amount} ₺`,
});

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("akinoglu_privacy_mode");
      if (saved !== null) {
        setIsPrivacyMode(saved === "true");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  function togglePrivacyMode() {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("akinoglu_privacy_mode", String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }

  function formatMasked(amount: number, fallback = "•••••• ₺"): string {
    if (isPrivacyMode) {
      return fallback;
    }
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <PrivacyContext.Provider
      value={{
        isPrivacyMode,
        togglePrivacyMode,
        formatMasked,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
