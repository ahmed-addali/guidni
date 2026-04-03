"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Section = "overview" | "amenities" | "location" | "reviews";

interface Props {
  labels: {
    overview: string;
    amenities: string;
    location: string;
    reviews: string;
  };
}

const SECTION_IDS: Section[] = ["overview", "amenities", "location", "reviews"];

export function StayAnchorNav({ labels }: Props) {
  const [active, setActive] = useState<Section>("overview");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("-section", "") as Section;
            setActive(id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(`${id}-section`);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <nav className="sticky top-16 z-30 bg-white border-b border-gray-100 -mx-4 md:-mx-20 px-4 md:px-20">
      <div className="flex gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden">
        {SECTION_IDS.map((id) => (
          <a
            key={id}
            href={`#${id}-section`}
            onClick={() => setActive(id)}
            className={cn(
              "shrink-0 py-4 px-4 text-sm font-medium border-b-2 transition-colors",
              active === id
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            {labels[id]}
          </a>
        ))}
      </div>
    </nav>
  );
}
