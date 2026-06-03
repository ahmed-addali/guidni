"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "@/lib/auth/client";
import { ShoppingBag } from "lucide-react";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { UserButton } from "./UserButton";
import { NavbarDestinationPicker } from "./NavbarDestinationPicker";
import { LanguageCurrencyDialog } from "./LanguageCurrencyDialog";
import { NavbarMobileMenu } from "./NavbarMobileMenu";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCartStore } from "@/stores/cartStore";

type DestinationOption = {
  slug: string;
  city: string;
  country: string;
};

type Props = {
  destinations: DestinationOption[];
};

export function Navbar({ destinations }: Props) {
  const t = useTranslations("Navbar");
  const locale = useLocale();
  const { data: session } = useSession();
  const [cartOpen, setCartOpen] = useState(false);
  const [mounted, setMounted]   = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);
  useEffect(() => setMounted(true), []);

  return (
    <div className="w-full bg-white">
      <header className="bg-white border-b border-gray-200">
        <MaxWidthWrapper>

          {/* ── Main row: Logo | Center | Right actions ── */}
          <div className="flex items-center h-16">

            {/* Left — Logo */}
            <Link href={`/${locale}`} className="flex items-center shrink-0">
              <Image
                src="/images/guidni-logo.png"
                alt="Guidni"
                width={110}
                height={48}
                priority
                className="h-9 lg:h-11 w-auto object-contain"
              />
            </Link>

            {/* Center — Destination picker (desktop only) */}
            <div className="hidden sm:flex flex-1 justify-center">
              <NavbarDestinationPicker destinations={destinations} />
            </div>

            {/* Right — action buttons */}
            <div className="ml-auto sm:ml-0 flex items-center gap-0.5 shrink-0">

              {/* Cart */}
              <button
                onClick={() => setCartOpen(true)}
                aria-label="Open cart"
                className="relative w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer rounded-xl"
              >
                <ShoppingBag className="h-4 w-4 shrink-0" />
                {mounted && totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>

              {/* Language / Currency (desktop only) */}
              <div className="hidden sm:flex">
                <LanguageCurrencyDialog />
              </div>

              {/* Mobile menu (mobile only) */}
              <div className="sm:hidden">
                <NavbarMobileMenu destinations={destinations} />
              </div>

              {/* User / Login */}
              {session?.user ? (
                <UserButton />
              ) : (
                <Link
                  href={`/${locale}/login`}
                  className="inline-flex items-center px-4 h-9 rounded-xl border border-primary text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-colors"
                >
                  {t("login")}
                </Link>
              )}
            </div>

            <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
          </div>

        </MaxWidthWrapper>
      </header>
    </div>
  );
}
