"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  hasHours:    boolean;
  hasLocation: boolean;
  labels: {
    products: string;
    about:    string;
    hours:    string;
    location: string;
    reviews:  string;
  };
}

export function ShopAnchorNav({ hasHours, hasLocation, labels }: Props) {
  const sections = [
    { id: "shop-products", key: "products" as const },
    { id: "shop-about",    key: "about"    as const },
    ...(hasHours    ? [{ id: "shop-hours",    key: "hours"    as const }] : []),
    ...(hasLocation ? [{ id: "shop-location", key: "location" as const }] : []),
    { id: "shop-reviews",  key: "reviews"  as const },
  ];

  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id }) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasHours, hasLocation]);

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
        {sections.map(({ id, key }) => (
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
