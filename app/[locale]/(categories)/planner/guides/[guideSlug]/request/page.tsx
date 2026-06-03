import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getGuideBySlug } from "@/lib/actions/guides";
import { RequestPlanForm } from "./_components/RequestPlanForm";
import { ArrowLeft } from "lucide-react";
import { FaCircleCheck } from "react-icons/fa6";

type Props = {
  params: Promise<{ locale: string; guideSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { guideSlug, locale } = await params;
  const [guide, t] = await Promise.all([
    getGuideBySlug(guideSlug),
    getTranslations({ locale, namespace: "RequestPlanPage" }),
  ]);
  return {
    title: guide
      ? `${t("requestTitle")} — ${guide.displayName} — Guidni`
      : t("requestTitle"),
  };
}

export default async function RequestPlanPage({ params }: Props) {
  const { locale, guideSlug } = await params;

  const [guide, session, t] = await Promise.all([
    getGuideBySlug(guideSlug),
    auth.api.getSession({ headers: await headers() }),
    getTranslations({ locale, namespace: "RequestPlanPage" }),
  ]);

  if (!guide) notFound();
  if (!session?.user) redirect(`/${locale}/login?callbackUrl=/${locale}/planner/guides/${guideSlug}/request`);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Back */}
      <Link
        href={`/${locale}/planner/guides/${guideSlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {t("backTo", { name: guide.displayName })}
      </Link>

      {/* Guide strip */}
      <div className="flex items-center gap-4 mb-8 bg-white border border-gray-100 rounded-2xl p-5">
        <div className="relative h-14 w-14 rounded-full overflow-hidden bg-gray-100 shrink-0">
          {guide.avatarUrl ? (
            <Image src={guide.avatarUrl} alt={guide.displayName} fill className="object-cover" sizes="56px" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xl font-bold text-gray-400">
              {guide.displayName.charAt(0)}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{guide.displayName}</p>
            {guide.isVerified && <FaCircleCheck className="h-4 w-4 text-blue-600" />}
          </div>
          <p className="text-sm text-gray-400">
            {guide.destination?.city ?? t("localGuide")}
            {" · "}
            {t("publishedPlans", { count: guide.planCount })}
          </p>
        </div>
      </div>

      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t("requestTitle")}</h1>
        <p className="text-gray-400 text-sm mt-1.5 leading-relaxed max-w-lg">
          {t("requestSubtitle", { name: guide.displayName.split(" ")[0] })}
        </p>
      </div>

      <RequestPlanForm
        guideId={guide.id}
        guideName={guide.displayName}
        locale={locale}
      />
    </div>
  );
}
