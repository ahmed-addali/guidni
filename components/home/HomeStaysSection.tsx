import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getStays } from "@/lib/actions/stays";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getBadgesForListings } from "@/lib/actions/badges";
import { getRecommendedOrder } from "@/lib/recommendation/client";
import { ArrowRight } from "lucide-react";
import { StaysCarousel } from "./StaysCarousel";

interface Props {
  locale: string;
}

export async function HomeStaysSection({ locale }: Props) {
  const destinationSlug = await getDestinationSlug();
  const [stays, t, tStays, session] = await Promise.all([
    getStays(destinationSlug, undefined, true, 8),
    getTranslations({ locale, namespace: "HomePage.stays" }),
    getTranslations({ locale, namespace: "StaysPage" }),
    auth.api.getSession({ headers: await headers() }).catch(() => null),
  ]);
  const badgesMap = await getBadgesForListings(stays.map((s) => s.id), "STAY");

  if (stays.length === 0) return null;

  const rankedIds = await getRecommendedOrder(
    "homepage_stay", "STAY", destinationSlug, session?.user?.id,
  );

  const sorted = rankedIds.length > 0
    ? rankedIds
        .map((id) => stays.find((s) => s.id === id))
        .filter(Boolean)
        .concat(stays.filter((s) => !rankedIds.includes(s.id)))
    : stays;

  return (
    <section className="py-12 w-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/stays`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <StaysCarousel stays={sorted as typeof stays} locale={locale} badgesMap={badgesMap} perNight={tStays("perNight")} currency={tStays("currency")} />
    </section>
  );
}
