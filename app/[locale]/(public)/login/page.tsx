import { LoginForm } from "@/components/auth/LoginForm";
import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function LoginPage() {
  const locale = await getLocale();

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — brand / image (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col">
        {/* Background photo */}
        <Image
          src="/images/djerba.jpg"
          alt="Djerba, Tunisia"
          fill
          priority
          className="object-cover"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        {/* Top-left logo */}
        <div className="relative z-10 p-10">
          <Link href={`/${locale}`}>
            <Image
              src="/images/guidni-logo.png"
              alt="Guidni"
              width={110}
              height={40}
              className="h-9 w-auto brightness-0 invert"
            />
          </Link>
        </div>

        {/* Bottom copy */}
        <div className="relative z-10 mt-auto p-10">
          <blockquote className="text-white">
            <p className="text-2xl font-semibold leading-snug">
              "One platform for every experience your trip deserves."
            </p>
            <footer className="mt-4 flex items-center gap-3">
              <div className="w-8 h-px bg-white/40" />
              <span className="text-sm text-white/70">Activities · Stays · Restaurants · Transport</span>
            </footer>
          </blockquote>

          {/* Destination label */}
          <div className="mt-6 flex items-center gap-2 text-white/60 text-xs">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Djerba, Tunisia
          </div>
        </div>
      </div>

      {/* ── Right panel — sign in form ── */}
      <div className="flex-1 flex flex-col">

        {/* Mobile logo (shown only on mobile) */}
        <div className="lg:hidden flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <Link href={`/${locale}`}>
            <Image
              src="/images/guidni-logo.png"
              alt="Guidni"
              width={90}
              height={34}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* Centered form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            <LoginForm locale={locale} />
          </div>
        </div>

        {/* Bottom legal */}
        <div className="px-6 py-6 text-center lg:text-left lg:px-12">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Guidni. All rights reserved.
          </p>
        </div>
      </div>

    </div>
  );
}
