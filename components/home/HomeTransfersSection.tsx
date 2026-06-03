import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getFeaturedTransfers } from "@/lib/actions/transfers";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getBadgesForListings } from "@/lib/actions/badges";
import { getRecommendedOrder } from "@/lib/recommendation/client";
import { TransfersCarousel } from "./TransfersCarousel";

interface Props {
  locale: string;
}

export async function HomeTransfersSection({ locale }: Props) {
  const destinationSlug = await getDestinationSlug();
  const [transfers, t, session] = await Promise.all([
    getFeaturedTransfers(destinationSlug),
    getTranslations({ locale, namespace: "HomePage.transfers" }),
    auth.api.getSession({ headers: await headers() }).catch(() => null),
  ]);
  const badgesMap = await getBadgesForListings(transfers.map((tr) => tr.id), "TRANSFER");

  if (transfers.length === 0) return null;

  const rankedIds = await getRecommendedOrder(
    "homepage_transfer", "TRANSFER", destinationSlug, session?.user?.id,
  );

  const sorted = rankedIds.length > 0
    ? rankedIds
        .map((id) => transfers.find((tr) => tr.id === id))
        .filter(Boolean)
        .concat(transfers.filter((tr) => !rankedIds.includes(tr.id)))
    : transfers;

  return (
    <section className="py-12 w-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/transport`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <TransfersCarousel transfers={sorted as typeof transfers} locale={locale} badgesMap={badgesMap} />
    </section>
  );
}
