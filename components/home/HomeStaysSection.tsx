import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getStays } from "@/lib/actions/stays";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getBadgesForListings } from "@/lib/actions/badges";
import { ArrowRight } from "lucide-react";
import { StaysCarousel } from "./StaysCarousel";

interface Props {
  locale: string;
}

export async function HomeStaysSection({ locale }: Props) {
  const destinationSlug = await getDestinationSlug();
  const [stays, t] = await Promise.all([
    getStays(destinationSlug, undefined, true, 8),
    getTranslations({ locale, namespace: "HomePage.stays" }),
  ]);
  const badgesMap = await getBadgesForListings(stays.map((s) => s.id), "STAY");

  if (stays.length === 0) return null;

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
      <StaysCarousel stays={stays} locale={locale} badgesMap={badgesMap} />
    </section>
  );
}
