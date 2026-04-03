"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type NavLink = {
  id: string;
  label: string;
};

type Props = {
  hasIncludes: boolean;
  hasGoodToKnow: boolean;
  labels: {
    overview: string;
    includes: string;
    location: string;
    reviews: string;
    goodToKnow: string;
  };
};

export function ActivityAnchorNav({ hasIncludes, hasGoodToKnow, labels }: Props) {
  const [activeId, setActiveId] = useState<string>("about-section");

  const links: NavLink[] = [
    { id: "about-section",       label: labels.overview },
    ...(hasIncludes ? [{ id: "includes-section", label: labels.includes }] : []),
    { id: "location-section",    label: labels.location },
    { id: "reviews-section",     label: labels.reviews },
    ...(hasGoodToKnow ? [{ id: "good-to-know-section", label: labels.goodToKnow }] : []),
  ];

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    links.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasIncludes, hasGoodToKnow]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveId(id);
  }

  return (
    <nav
      aria-label="Page sections"
      className="sticky top-16 z-30 bg-white border-b border-gray-100 -mx-4 md:-mx-20 px-4 md:px-20"
    >
      <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {links.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => handleClick(e, id)}
            className={cn(
              "shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeId === id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}
