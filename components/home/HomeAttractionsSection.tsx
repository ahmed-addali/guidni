import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getAttractionsByDestination } from "@/lib/actions/attractions";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { AttractionsCarousel } from "./AttractionsCarousel";

interface Props {
  locale: string;
}

export async function HomeAttractionsSection({ locale }: Props) {
  const destinationSlug = await getDestinationSlug();
  const [attractions, t] = await Promise.all([
    getAttractionsByDestination(destinationSlug, locale),
    getTranslations({ locale, namespace: "HomePage.attractions" }),
  ]);

  if (attractions.length === 0) return null;

  return (
    <section className="py-12 w-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/destinations/${destinationSlug}`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <AttractionsCarousel
        attractions={attractions}
        destinationSlug={destinationSlug}
        locale={locale}
      />
    </section>
  );
}
