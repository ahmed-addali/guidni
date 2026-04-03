import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getFeaturedGuides } from "@/lib/actions/guides";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getDestinations } from "@/lib/actions/destinations";
import { GuidesCarousel } from "./GuidesCarousel";

interface Props {
  locale: string;
}

export async function HomeGuidesSection({ locale }: Props) {
  const [destinationSlug, destinations, t] = await Promise.all([
    getDestinationSlug(),
    getDestinations(),
    getTranslations({ locale, namespace: "HomePage.guides" }),
  ]);

  const currentDest = destinations.find((d) => d.slug === destinationSlug) ?? destinations[0];
  const guides = await getFeaturedGuides(currentDest?.id);

  if (guides.length === 0) return null;

  return (
    <section className="py-12 w-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/planner/guides`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <GuidesCarousel guides={guides} locale={locale} />
    </section>
  );
}
