import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getFeaturedTransfers } from "@/lib/actions/transfers";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getBadgesForListings } from "@/lib/actions/badges";
import { TransfersCarousel } from "./TransfersCarousel";

interface Props {
  locale: string;
}

export async function HomeTransfersSection({ locale }: Props) {
  const destinationSlug = await getDestinationSlug();
  const [transfers, t] = await Promise.all([
    getFeaturedTransfers(destinationSlug),
    getTranslations({ locale, namespace: "HomePage.transfers" }),
  ]);
  const badgesMap = await getBadgesForListings(transfers.map((tr) => tr.id), "TRANSFER");

  if (transfers.length === 0) return null;

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
      <TransfersCarousel transfers={transfers} locale={locale} badgesMap={badgesMap} />
    </section>
  );
}
