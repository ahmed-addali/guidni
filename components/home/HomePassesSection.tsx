import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getFeaturedPasses } from "@/lib/actions/passes";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { PassesCarousel } from "./PassesCarousel";

interface Props {
  locale: string;
}

export async function HomePassesSection({ locale }: Props) {
  const destinationSlug = await getDestinationSlug();
  const [passes, t] = await Promise.all([
    getFeaturedPasses(destinationSlug ?? undefined),
    getTranslations({ locale, namespace: "HomePage.packages" }),
  ]);

  // No passes for this destination — omit the section entirely
  if (passes.length === 0) return null;

  return (
    <section className="py-12 w-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Link
          href={`/${locale}/passes`}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline shrink-0"
        >
          {t("viewAll")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <PassesCarousel
        passes={passes}
        locale={locale}
        labels={{
          popular: t("popular"),
          perPerson: t("perPerson"),
          included: t("included"),
          optional: t("optional"),
          bookNow: t("bookNow"),
        }}
      />
    </section>
  );
}
