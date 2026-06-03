"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "about",   labelKey: "navAbout"   },
  { id: "plans",   labelKey: "navPlans"   },
  { id: "reviews", labelKey: "navReviews" },
] as const;

interface Props {
  labels: { navAbout: string; navPlans: string; navReviews: string };
}

export function GuideAnchorNav({ labels }: Props) {
  const [active, setActive] = useState("about");

  useEffect(() => {
    const ids = SECTIONS.map((s) => s.id);
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      obs.observe(el);
      return obs;
    });
    return () => observers.forEach((o) => o?.disconnect());
  }, []);

  return (
    <nav className="sticky top-16 z-20 bg-white border-b border-gray-100 -mx-4 px-4 md:-mx-20 md:px-20">
      <div className="flex gap-0 max-w-screen-xl mx-auto">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              setActive(s.id);
            }}
            className={cn(
              "px-5 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              active === s.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {labels[s.labelKey]}
          </a>
        ))}
      </div>
    </nav>
  );
}
