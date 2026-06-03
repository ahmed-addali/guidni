"use client";

import Link from "next/link";

interface Props {
  href:     string;
  label:    string;
  subtitle: string;
}

export function GuideMobileCTA({ href, label, subtitle }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
      <div className="min-w-0">
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 inline-flex items-center px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors"
      >
        {label}
      </Link>
    </div>
  );
}
