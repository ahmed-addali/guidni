"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Section = "overview" | "menu" | "location" | "reviews";

type Props = {
  labels: {
    overview: string;
    menu: string;
    location: string;
    reviews: string;
  };
};

const SECTION_IDS: Section[] = ["overview", "menu", "location", "reviews"];

export function RestaurantAnchorNav({ labels }: Props) {
  const [active, setActive] = useState<Section>("overview");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current?.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id.replace("-section", "") as Section);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(`${id}-section`);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="sticky top-16 z-30 bg-white border-b border-gray-100 -mx-4 md:-mx-20 px-4 md:px-20">
      <nav className="flex overflow-x-auto scrollbar-hide gap-6">
        {SECTION_IDS.map((id) => (
          <a
            key={id}
            href={`#${id}-section`}
            className={cn(
              "shrink-0 py-3 text-sm font-medium border-b-2 transition-colors",
              active === id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {labels[id]}
          </a>
        ))}
      </nav>
    </div>
  );
}
