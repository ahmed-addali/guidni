"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useDestination() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const destination = searchParams.get("destination") ?? null;

  const setDestination = useCallback(
    (slug: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set("destination", slug);
      } else {
        params.delete("destination");
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return { destination, setDestination };
}
