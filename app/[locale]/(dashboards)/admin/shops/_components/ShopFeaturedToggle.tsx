"use client";

import { useState, useTransition } from "react";
import { toggleShopFeatured } from "@/lib/actions/admin-shops";

interface Props {
  shopId:   string;
  featured: boolean;
}

export function ShopFeaturedToggle({ shopId, featured }: Props) {
  const [isFeatured, setIsFeatured] = useState(featured);
  const [pending, start] = useTransition();

  function handleToggle() {
    const next = !isFeatured;
    setIsFeatured(next);
    start(async () => {
      const res = await toggleShopFeatured(shopId, next);
      if (!res.success) setIsFeatured(!next);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      role="switch"
      aria-checked={isFeatured}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 ${
        isFeatured ? "bg-primary" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
          isFeatured ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
