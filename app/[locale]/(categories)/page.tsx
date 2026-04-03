import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";
import { HeroSection } from "@/components/home/HeroSection";
import { DestinationSelector } from "@/components/home/DestinationSelector";
import { DestinationSpotlight } from "@/components/home/DestinationSpotlight";
import { ActivitiesSection } from "@/components/home/ActivitiesSection";
import { HomeStaysSection } from "@/components/home/HomeStaysSection";
import { HomeRestaurantsSection } from "@/components/home/HomeRestaurantsSection";
import { HomePassesSection } from "@/components/home/HomePassesSection";
import { HomeShopsSection } from "@/components/home/HomeShopsSection";
import { HomeTransfersSection } from "@/components/home/HomeTransfersSection";
import { HomeAttractionsSection } from "@/components/home/HomeAttractionsSection";
import { HomeGuidesSection } from "@/components/home/HomeGuidesSection";
import { AIPlannerSection } from "@/components/home/AIPlannerSection";
import { BecomeAgentSection } from "@/components/home/BecomeAgentSection";
import { TrustStrip } from "@/components/home/TrustStrip";
import { InfoSection } from "@/components/home/InfoSection";
import { getDestinations } from "@/lib/actions/destinations";
import { Skeleton } from "@/components/ui/skeleton";

type Params = Promise<{ locale: string }>;

export default async function HomePage({ params }: { params: Params }) {
  const { locale } = await params;

  const [destinations, t] = await Promise.all([
    getDestinations(),
    getTranslations({ locale, namespace: "HomePage.destinations" }),
  ]);

  return (
    <MaxWidthWrapper>
      <HeroSection locale={locale} />

      {destinations.length > 0 && (
        <>
          <DestinationSelector destinations={destinations} title={t("title")} />
          <DestinationSpotlight destinations={destinations} />
        </>
      )}

      <div className="divide-y divide-gray-100">
        <Suspense fallback={<SectionSkeleton />}>
          <ActivitiesSection locale={locale} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomeStaysSection locale={locale} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomeRestaurantsSection locale={locale} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomePassesSection locale={locale} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomeShopsSection locale={locale} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomeTransfersSection locale={locale} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomeAttractionsSection locale={locale} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <HomeGuidesSection locale={locale} />
        </Suspense>

        <AIPlannerSection locale={locale} />

        {/* Trust strip — before partner/agent banners for credibility context */}
        <TrustStrip locale={locale} />

        <BecomeAgentSection locale={locale} />
        <InfoSection />
      </div>
    </MaxWidthWrapper>
  );
}

function SectionSkeleton() {
  return (
    <section className="py-8 w-full">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </section>
  );
}
