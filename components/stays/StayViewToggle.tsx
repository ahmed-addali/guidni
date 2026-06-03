"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, Map } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  gridLabel: string;
  mapLabel: string;
}

export function StayViewToggle({ gridLabel, mapLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMap = searchParams.get("view") === "map";

  function setView(view: "grid" | "map") {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "map") {
      params.set("view", "map");
    } else {
      params.delete("view");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  const btnBase = "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all";

  return (
    <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
      <button
        onClick={() => setView("grid")}
        className={cn(btnBase, !isMap ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        {gridLabel}
      </button>
      <button
        onClick={() => setView("map")}
        className={cn(btnBase, isMap ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
      >
        <Map className="h-3.5 w-3.5" />
        {mapLabel}
      </button>
    </div>
  );
}
