"use client";

import { useState, useTransition } from "react";
import { toggleActivityFeatured, toggleStayFeatured } from "@/lib/actions/admin";

interface Props {
  id: string;
  type: "activity" | "stay";
  featured: boolean;
}

export function FeaturedToggle({ id, type, featured }: Props) {
  const [isFeatured, setIsFeatured] = useState(featured);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    const next = !isFeatured;
    setIsFeatured(next);
    startTransition(async () => {
      const action = type === "activity" ? toggleActivityFeatured : toggleStayFeatured;
      const result = await action(id, next);
      if (!result.success) setIsFeatured(!next);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 ${
        isFeatured ? "bg-primary" : "bg-gray-200"
      }`}
      role="switch"
      aria-checked={isFeatured}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
          isFeatured ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
