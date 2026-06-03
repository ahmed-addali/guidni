"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FiGrid, FiMap } from "react-icons/fi";

export function ActivityViewToggle({ gridLabel, mapLabel }: { gridLabel: string; mapLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("view") ?? "grid";

  function setView(v: "grid" | "map") {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "grid") {
      params.delete("view");
    } else {
      params.set("view", v);
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
      <button
        onClick={() => setView("grid")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          current === "grid"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <FiGrid className="h-3.5 w-3.5" />
        {gridLabel}
      </button>
      <button
        onClick={() => setView("map")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          current === "map"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        <FiMap className="h-3.5 w-3.5" />
        {mapLabel}
      </button>
    </div>
  );
}
