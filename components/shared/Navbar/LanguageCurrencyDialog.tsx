"use client";

import { useState, useTransition, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Globe, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CURRENCIES = [
  { value: "TND", label: "Dinar",  symbol: "TND" },
  { value: "EUR", label: "Euro",   symbol: "EUR" },
  { value: "USD", label: "Dollar", symbol: "USD" },
];

const LANGUAGES = [
  { value: "ar", label: "العربية", short: "AR" },
  { value: "en", label: "English", short: "EN" },
  { value: "fr", label: "Français", short: "FR" },
];

export function LanguageCurrencyDialog() {
  const locale   = useLocale();
  const t        = useTranslations("LanguageCurrency");
  const router   = useRouter();
  const pathname = usePathname();

  const [open, setOpen]                         = useState(false);
  const [isPending, startTransition]            = useTransition();
  const [selectedLang, setSelectedLang]         = useState(locale);
  const [selectedCurrency, setSelectedCurrency] = useState("TND");

  useEffect(() => {
    const stored = localStorage.getItem("currency");
    if (stored) setSelectedCurrency(stored);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const currentLang     = LANGUAGES.find((l) => l.value === locale);
  const currentCurrency = CURRENCIES.find((c) => c.value === selectedCurrency);

  function handleSave() {
    startTransition(() => {
      localStorage.setItem("currency", selectedCurrency);
      window.dispatchEvent(new Event("currencyChange"));
      if (selectedLang !== locale) {
        const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
        router.replace(`/${selectedLang}${pathWithoutLocale}`);
      } else {
        toast.success(t("successMessage"));
        setOpen(false);
      }
    });
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t("title")}
        className="flex items-center gap-1.5 h-9 px-3 rounded-xl sm:border sm:border-gray-200 text-gray-700 hover:border-primary/50 hover:bg-gray-50 transition-colors cursor-pointer text-xs font-semibold"
      >
        <Globe className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">{currentLang?.short}</span>
        <span className="w-px h-3.5 bg-gray-200 hidden sm:block" aria-hidden />
        <span className="hidden sm:inline">{currentCurrency?.symbol}</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          {/* Panel */}
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{t("title")}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{t("subtitle")}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">

              {/* Language */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <p className="text-sm font-semibold text-gray-700">{t("languageLabel")}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((l) => {
                    const active = selectedLang === l.value;
                    return (
                      <button
                        key={l.value}
                        onClick={() => setSelectedLang(l.value)}
                        className={cn(
                          "relative py-2.5 px-3 rounded-xl text-sm font-medium border transition-colors text-center",
                          active
                            ? "bg-primary text-white border-primary"
                            : "text-gray-700 border-gray-200 hover:border-primary/40 hover:bg-gray-50"
                        )}
                      >
                        {l.label}
                        {active && (
                          <Check className="absolute top-1.5 right-1.5 h-3 w-3 text-white/80" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Currency */}
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-gray-700">{t("currencyLabel")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {CURRENCIES.map((c) => {
                    const active = selectedCurrency === c.value;
                    return (
                      <button
                        key={c.value}
                        onClick={() => setSelectedCurrency(c.value)}
                        className={cn(
                          "relative flex flex-col items-center justify-center py-3.5 rounded-xl border transition-colors",
                          active
                            ? "bg-primary/5 border-primary"
                            : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"
                        )}
                      >
                        <span className={cn("text-base font-bold", active ? "text-primary" : "text-gray-900")}>
                          {c.symbol}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-0.5">{c.label}</span>
                        {active && (
                          <Check className="absolute top-1.5 right-1.5 h-3 w-3 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("savingButton")}
                  </>
                ) : (
                  t("saveButton")
                )}
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
