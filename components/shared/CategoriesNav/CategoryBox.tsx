"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconType } from "react-icons";

interface CategoryBoxProps {
  icon: IconType;
  label: string;
  route: string;
  selected?: boolean;
  color: string;
  variant?: "desktop" | "mobile";
}

export function CategoryBox({
  icon: Icon,
  label,
  route,
  selected,
  color,
  variant = "desktop",
}: CategoryBoxProps) {
  if (variant === "mobile") {
    return (
      <Link
        href={route}
        aria-label={label}
        className={cn(
          "flex items-center justify-center w-11 h-11 mx-0.5 my-1.5 rounded-xl shrink-0 transition-colors",
          selected ? "bg-primary" : "hover:bg-gray-100"
        )}
      >
        <Icon size={20} className={selected ? "text-white" : "text-gray-400"} />
      </Link>
    );
  }

  // Desktop variant — unchanged
  return (
    <Link
      href={route}
      className={cn(
        "flex flex-col items-center justify-center gap-1.5 px-4 py-3 border-b-2 transition-colors cursor-pointer min-w-[70px] group",
        selected
          ? "border-b-blue-600"
          : "border-transparent hover:border-b-gray-200"
      )}
    >
      <Icon
        size={22}
        className={cn(
          "transition-colors",
          selected ? color : "text-gray-400 group-hover:text-gray-600"
        )}
      />
      <span
        className={cn(
          "text-xs whitespace-nowrap transition-colors",
          selected
            ? "font-semibold text-gray-900"
            : "font-medium text-gray-500 group-hover:text-gray-700"
        )}
      >
        {label}
      </span>
    </Link>
  );
}
