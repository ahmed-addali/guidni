import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getMyGuideProfile } from "@/lib/actions/partner-guides";
import { getReviews } from "@/lib/actions/reviews";
import { RelationType } from "@prisma/client";
import { FiChevronLeft } from "react-icons/fi";
import { GuideReviewsClient } from "./_components/GuideReviewsClient";

type Params = Promise<{ locale: string }>;

export const metadata = { title: "Guide Reviews — Guidni" };

export default async function GuideReviewsPage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect(`/${locale}/login`);

  const [profile, t] = await Promise.all([
    getMyGuideProfile(),
    getTranslations({ locale, namespace: "PartnerDashboard.guideReviews" }),
  ]);

  if (!profile) notFound();

  const reviews = await getReviews(profile.id, RelationType.GUIDE);

  const serialized = reviews.map((r) => ({
    id:           r.id,
    rating:       r.rating,
    title:        r.title,
    comment:      r.comment,
    response:     r.response,
    createdAt:    r.createdAt.toISOString(),
    user: {
      name:  r.user.name,
      image: r.user.image,
    },
  }));

  return (
    <div className="space-y-6 max-w-screen-md">
      {/* Header */}
      <div>
        <Link
          href={`/${locale}/partner/guide`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-2"
        >
          <FiChevronLeft className="h-4 w-4" />
          {t("backLabel")}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t("pageTitle")}</h1>
        <p className="text-sm text-gray-400 mt-1">{t("pageSubtitle")}</p>
      </div>

      <GuideReviewsClient reviews={serialized} />
    </div>
  );
}
