"use client";

import { useState, useEffect, useTransition } from "react";
import { Menu, X, MapPin, Globe, Check, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useDestinationStore } from "@/stores/destinationStore";
import { setDestinationCookie } from "@/lib/actions/destination-cookie";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

type DestinationOption = { slug: string; city: string; country: string };
type Props = { destinations: DestinationOption[] };

export function NavbarMobileMenu({ destinations }: Props) {
  const tNav  = useTranslations("Navbar");
  const tDest = useTranslations("DestinationPicker");
  const tLang = useTranslations("LanguageCurrency");
  const locale   = useLocale();
  const router   = useRouter();
  const pathname = usePathname();
  const { destination, setDestination } = useDestinationStore();

  const [open, setOpen]                         = useState(false);
  const [isPending, startTransition]            = useTransition();
  const [selectedLang, setSelectedLang]         = useState(locale);
  const [selectedCurrency, setSelectedCurrency] = useState("TND");

  useEffect(() => {
    const stored = localStorage.getItem("currency");
    if (stored) setSelectedCurrency(stored);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  async function selectDestination(dest: DestinationOption) {
    setDestination(dest);
    setOpen(false);
    await setDestinationCookie(dest.slug);
    router.refresh();
  }

  function handleSave() {
    startTransition(() => {
      localStorage.setItem("currency", selectedCurrency);
      if (selectedLang !== locale) {
        const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
        router.replace(`/${selectedLang}${pathWithoutLocale}`);
      } else {
        toast.success(tLang("successMessage"));
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={tNav("mobileMenuLabel")}
        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Side drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[61] h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{tNav("mobileMenuTitle")}</h2>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* Destination */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">{tDest("title")}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {destinations.map((d) => {
                const isSelected = destination.slug === d.slug;
                return (
                  <button
                    key={d.slug}
                    onClick={() => selectDestination(d)}
                    className={cn(
                      "relative flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors text-left cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-gray-200 text-gray-700 hover:border-primary/40 hover:bg-gray-50"
                    )}
                  >
                    <MapPin className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-primary" : "text-gray-400")} />
                    <span className="truncate">{d.city}</span>
                    {isSelected && <Check className="h-3 w-3 shrink-0 ml-auto text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Language */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">{tLang("languageLabel")}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LANGUAGES.map((l) => {
                const active = selectedLang === l.value;
                return (
                  <button
                    key={l.value}
                    onClick={() => setSelectedLang(l.value)}
                    className={cn(
                      "relative py-2.5 px-2 rounded-xl text-xs font-medium border transition-colors text-center",
                      active
                        ? "bg-primary text-white border-primary"
                        : "text-gray-700 border-gray-200 hover:border-primary/40 hover:bg-gray-50"
                    )}
                  >
                    {l.label}
                    {active && <Check className="absolute top-1.5 right-1.5 h-3 w-3 text-white/80" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Currency */}
          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-gray-700">{tLang("currencyLabel")}</p>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCIES.map((c) => {
                const active = selectedCurrency === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setSelectedCurrency(c.value)}
                    className={cn(
                      "relative flex flex-col items-center justify-center py-3 rounded-xl border transition-colors",
                      active
                        ? "bg-primary/5 border-primary"
                        : "border-gray-200 hover:border-primary/40 hover:bg-gray-50"
                    )}
                  >
                    <span className={cn("text-base font-bold", active ? "text-primary" : "text-gray-900")}>
                      {c.symbol}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">{c.label}</span>
                    {active && <Check className="absolute top-1.5 right-1.5 h-3 w-3 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Save — pinned at bottom */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{tLang("savingButton")}</>
            ) : (
              tLang("saveButton")
            )}
          </button>
        </div>
      </div>
    </>
  );
}
