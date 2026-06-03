"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signIn } from "@/lib/auth/client";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";

type Props = {
  locale: string;
};

export function LoginForm({ locale }: Props) {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? `/${locale}`;
  const t = useTranslations("LoginPage");

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn.social({
      provider: "google",
      callbackURL: callbackUrl,
    });
    setLoading(false);
  }

  const trustItems = [
    { icon: "🔒", label: t("trustSecure") },
    { icon: "⚡", label: t("trustInstant") },
    { icon: "🌍", label: t("trustLanguages") },
  ];

  return (
    <div className="flex flex-col gap-8">

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* Sign-in buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <FcGoogle className="h-5 w-5 shrink-0" />
          )}
          {loading ? t("signingIn") : t("continueGoogle")}
        </button>

        {/* Divider */}
        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider shrink-0">{t("or")}</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Future email login placeholder */}
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
        >
          {t("continueEmail")}
          <span className="ml-auto text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-md font-medium leading-none">
            {t("soon")}
          </span>
        </button>
      </div>

      {/* Trust strip */}
      <div className="grid grid-cols-3 gap-3">
        {trustItems.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 py-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="text-base">{item.icon}</span>
            <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Legal */}
      <p className="text-xs text-gray-400 text-center leading-relaxed">
        {t("legalPrefix")}{" "}
        <Link href={`/${locale}/terms`} className="text-gray-600 hover:text-gray-900 underline underline-offset-2 transition-colors">
          {t("terms")}
        </Link>{" "}
        {/* "and" connector — reuse existing key or add inline */}
        &amp;{" "}
        <Link href={`/${locale}/privacy`} className="text-gray-600 hover:text-gray-900 underline underline-offset-2 transition-colors">
          {t("privacy")}
        </Link>.
      </p>

    </div>
  );
}
