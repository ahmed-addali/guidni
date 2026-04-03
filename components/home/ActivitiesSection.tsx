import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getActivities } from "@/lib/actions/activities";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getBadgesForListings } from "@/lib/actions/badges";
import { ArrowRight } from "lucide-react";
import { ActivitiesCarousel } from "./ActivitiesCarousel";

interface Props {
  locale: string;
}

export async function ActivitiesSection({ locale }: Props) {
  const destinationSlug = await getDestinationSlug();
  const [activities, t] = await Promise.all([
    getActivities(destinationSlug, undefined, true, 8),
    getTranslations({ locale, namespace: "HomePage.activities" }),
  ]);
  const badgesMap = await getBadgesForListings(activities.map((a) => a.id), "ACTIVITY");

  if (activities.length === 0) return null;

  return (
    <section className="py-12 w-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/activities`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <ActivitiesCarousel activities={activities} locale={locale} badgesMap={badgesMap} />
    </section>
  );
}
