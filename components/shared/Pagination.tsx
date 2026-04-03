"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { cn } from "@/lib/utils";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  previousLabel: string;
  nextLabel: string;
};

function buildHref(
  pathname: string,
  searchParams: URLSearchParams,
  page: number
) {
  const params = new URLSearchParams(searchParams.toString());
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("…");

  pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  previousLabel,
  nextLabel,
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1.5 mt-10"
    >
      {/* Previous */}
      {hasPrev ? (
        <Link
          href={buildHref(pathname, searchParams, currentPage - 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <FiChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{previousLabel}</span>
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-300 border border-gray-100 cursor-not-allowed">
          <FiChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">{previousLabel}</span>
        </span>
      )}

      {/* Page numbers */}
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-sm text-gray-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={buildHref(pathname, searchParams, p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              "min-w-[36px] h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-colors",
              p === currentPage
                ? "bg-primary text-white"
                : "text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            {p}
          </Link>
        )
      )}

      {/* Next */}
      {hasNext ? (
        <Link
          href={buildHref(pathname, searchParams, currentPage + 1)}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <span className="hidden sm:inline">{nextLabel}</span>
          <FiChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium text-gray-300 border border-gray-100 cursor-not-allowed">
          <span className="hidden sm:inline">{nextLabel}</span>
          <FiChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
