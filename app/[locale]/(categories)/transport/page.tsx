import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getRentalsPaginated } from "@/lib/actions/rentals";
import { getTransfersPaginated } from "@/lib/actions/transfers";
import { getDestinationSlug } from "@/lib/actions/destination-cookie";
import { getDestinationBySlug } from "@/lib/actions/destinations";
import { getBadgesForListings } from "@/lib/actions/badges";
import { RentalCard } from "@/components/rentals/RentalCard";
import { TransferCard } from "@/components/transfers/TransferCard";
import { CategoryPageHero } from "@/components/shared/CategoryPageHero";
import { Pagination } from "@/components/shared/Pagination";
import { TransportSearch } from "./_components/TransportSearch";
import { TransportFilterSheet } from "./_components/TransportFilterSheet";
import { TransportFilterChips } from "./_components/TransportFilterChips";
import { TbCar, TbRoute, TbCar as TbCarIcon } from "react-icons/tb";
import { FaTaxi } from "react-icons/fa6";
import { cn } from "@/lib/utils";

type SearchParams = Promise<{
  type?:    string;
  service?: string;
  search?:  string;
  page?:    string;
}>;
type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "TransportPage" });
  return { title: "Transport · Guidni", description: t("subtitle") };
}

export default async function TransportPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { locale }                                             = await params;
  const { type, service = "rentals", search, page: pageParam } = await searchParams;
  const t                                                      = await getTranslations({ locale, namespace: "TransportPage" });
  const destination                                            = await getDestinationSlug();
  const page                                                   = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  // Resolve transfer type from service tab
  const transferType =
    service === "chauffeur" ? "CHAUFFEUR" : (service === "transfers" ? type : undefined);

  const [rentalsResult, transfersResult, destinationRecord] = await Promise.all([
    service === "rentals"
      ? getRentalsPaginated({ destinationSlug: destination, type, search, page })
      : null,
    service === "transfers" || service === "chauffeur"
      ? getTransfersPaginated({ destinationSlug: destination, type: transferType, search, page })
      : null,
    getDestinationBySlug(destination),
  ]);

  const transfers  = transfersResult?.transfers ?? [];
  const rentals    = rentalsResult?.rentals ?? [];
  const total      = service === "rentals" ? (rentalsResult?.total ?? 0) : (transfersResult?.total ?? 0);
  const totalPages = service === "rentals" ? (rentalsResult?.totalPages ?? 1) : (transfersResult?.totalPages ?? 1);

  const transferBadgesMap = transfers.length > 0
    ? await getBadgesForListings(transfers.map((tr) => tr.id), "TRANSFER")
    : {};

  const destinationCity = destinationRecord?.city ?? null;

  const SERVICE_TABS = [
    { value: "rentals",   label: t("serviceRentals"),  icon: TbCarIcon },
    { value: "transfers", label: t("serviceTransfers"), icon: TbRoute   },
    { value: "chauffeur", label: t("serviceChauffeur"), icon: FaTaxi    },
  ];

  function serviceHref(s: string) {
    return `/${locale}/transport${s !== "rentals" ? `?service=${s}` : ""}`;
  }

  const isEmpty = service === "rentals" ? rentals.length === 0 : transfers.length === 0;

  return (
    <div className="pb-16 sm:pb-12">

      {/* Hero — clean, no search */}
      <CategoryPageHero
        title={t("titlePrefix")}
        accent={destinationCity ?? t("titleFallback")}
        subtitle={t("subtitle")}
      />

      {/* ── Service tabs ── */}
      <div className="border-b border-gray-100">
        <div className="mx-auto w-full max-w-screen-xl px-4 md:px-20 overflow-x-auto scrollbar-hide py-3">
          <div className="flex gap-1 w-fit mx-auto">
            {SERVICE_TABS.map(({ value, label, icon: Icon }) => {
              const active = service === value;
              return (
                <Link
                  key={value}
                  href={serviceHref(value)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-5 py-2 rounded-xl shrink-0 transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-gray-400 hover:text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon size={20} />
                  <span className={cn("text-xs whitespace-nowrap", active ? "font-semibold" : "font-medium")}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Search + Filter row (under service tabs) ── */}
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-20 py-3 border-b border-gray-100">
        <div className="flex justify-center">
          <Suspense>
            <div className="flex items-center gap-2 w-full max-w-xl">
              <div className="flex-1 min-w-0">
                <TransportSearch
                  placeholder={t("searchPlaceholder")}
                  clearLabel={t("clearSearch")}
                  defaultValue={search}
                />
              </div>
              <TransportFilterSheet service={service} />
            </div>
          </Suspense>
        </div>
      </div>

      {/* ── Results ── */}
      <section className="mx-auto w-full max-w-screen-xl px-4 md:px-20 py-8">

        {/* Active filter chip */}
        <Suspense>
          <div className="mb-4">
            <TransportFilterChips />
          </div>
        </Suspense>

        {/* Result count */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {t("resultsCount", { count: total })}
          </p>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              {service === "rentals"
                ? <TbCar className="h-6 w-6 text-gray-400" />
                : <TbRoute className="h-6 w-6 text-gray-400" />
              }
            </div>
            <p className="text-xl font-semibold text-gray-800">
              {service === "rentals" ? t("empty") : t("emptyTransfers")}
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              {service === "rentals" ? t("emptyHint") : t("emptyTransfersHint")}
            </p>
          </div>
        ) : (
          <>
            {service === "rentals" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rentals.map((r) => (
                  <RentalCard
                    key={r.id}
                    id={r.id}
                    slug={r.slug}
                    title={r.title}
                    type={r.type}
                    pricePerDay={r.pricePerDay}
                    capacity={r.capacity}
                    brand={r.brand}
                    model={r.model}
                    city={r.city}
                    country={r.country}
                    locale={locale}
                    coverImage={r.images[0]?.url ?? null}
                  />
                ))}
              </div>
            )}

            {(service === "transfers" || service === "chauffeur") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {transfers.map((tr) => (
                  <TransferCard
                    key={tr.id}
                    id={tr.id}
                    slug={tr.slug}
                    title={tr.title}
                    type={tr.type}
                    pricePerTrip={tr.pricePerTrip}
                    pricePerHour={tr.pricePerHour}
                    pricePerPerson={tr.pricePerPerson}
                    capacity={tr.capacity}
                    city={tr.city}
                    country={tr.country}
                    locale={locale}
                    coverImage={tr.images[0]?.url ?? null}
                    badges={transferBadgesMap[tr.id]}
                  />
                ))}
              </div>
            )}

            <Suspense>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                previousLabel={t("previous")}
                nextLabel={t("next")}
              />
            </Suspense>
          </>
        )}
      </section>
    </div>
  );
}
