"use client";

import { useEffect, useState } from "react";

export function useCurrency() {
  const [currency, setCurrency] = useState<string>("TND");

  useEffect(() => {
    const stored = localStorage.getItem("currency");
    if (stored) {
      setCurrency(stored);
    }

    // Listen to changes in localStorage from other tabs/windows
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "currency" && e.newValue) {
        setCurrency(e.newValue);
      }
    };

    // Listen to custom event for single-page immediate updates
    const handleCustomChange = () => {
      const storedVal = localStorage.getItem("currency");
      if (storedVal) {
        setCurrency(storedVal);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("currencyChange", handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("currencyChange", handleCustomChange);
    };
  }, []);

  const convertPrice = (priceInTnd: number): { amount: number; symbol: string; formatted: string } => {
    let amount = priceInTnd;
    let symbol = "TND";

    if (currency === "EUR") {
      amount = priceInTnd / 3.5;
      symbol = "€";
    } else if (currency === "USD") {
      amount = priceInTnd / 3.0;
      symbol = "$";
    }

    // Format: e.g. "$40", "40 €", or "40 TND"
    const formattedAmount = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(1);
    const formatted = symbol === "$" ? `$${formattedAmount}` : `${formattedAmount} ${symbol}`;

    return { amount, symbol, formatted };
  };

  return { currency, convertPrice };
}
