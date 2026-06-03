"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  labels: {
    overview: string;
    details:  string;
    reviews:  string;
  };
}

const SECTIONS = [
  { id: "product-overview", key: "overview" as const },
  { id: "product-details",  key: "details"  as const },
  { id: "product-reviews",  key: "reviews"  as const },
];

export function ProductAnchorNav({ labels }: Props) {
  const [active, setActive] = useState("product-overview");

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  return (
    <nav
      aria-label="Page sections"
      className="sticky top-16 z-30 bg-white border-b border-gray-100 -mx-4 md:-mx-20 px-4 md:px-20 mt-6"
    >
      <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {SECTIONS.map(({ id, key }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => handleClick(e, id)}
            className={cn(
              "shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              active === id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            {labels[key]}
          </a>
        ))}
      </div>
    </nav>
  );
}
