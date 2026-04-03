"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { toggleWishlist } from "@/lib/actions/wishlist";

type WishlistRelationType = "ACTIVITY" | "STAY" | "RESTAURANT" | "RENTAL" | "SHOP" | "PRODUCT" | "TRANSFER";

interface WishlistButtonProps {
  listingId: string;
  relationType: WishlistRelationType;
  initialIsWishlisted?: boolean;
  className?: string;
  /** Accepted but unused — locale is read via useLocale() */
  locale?: string;
  /** "sm" renders a smaller button */
  size?: "sm" | "md";
}

export function WishlistButton({
  listingId,
  relationType,
  initialIsWishlisted = false,
  className,
  locale: _locale,
  size = "md",
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const locale = useLocale();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      const result = await toggleWishlist(listingId, relationType);
      if ("error" in result && result.error === "unauthenticated") {
        router.push(`/${locale}/login`);
        return;
      }
      if ("isWishlisted" in result) {
        setIsWishlisted(result.isWishlisted);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "flex items-center justify-center rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-all",
        size === "sm" ? "w-7 h-7" : "w-8 h-8",
        isPending && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          isWishlisted ? "fill-rose-500 text-rose-500" : "text-gray-500"
        )}
      />
    </button>
  );
}
