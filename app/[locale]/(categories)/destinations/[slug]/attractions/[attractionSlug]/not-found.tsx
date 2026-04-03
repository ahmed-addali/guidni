import Link from "next/link";
import { getLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import { MaxWidthWrapper } from "@/components/shared/MaxWidthWrapper";

export default async function AttractionNotFound() {
  const locale = await getLocale();

  return (
    <MaxWidthWrapper className="py-24 text-center">
      <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Attraction not found
      </h1>
      <p className="text-muted-foreground mb-6">
        This attraction doesn&apos;t exist or has been removed.
      </p>
      <Link
        href={`/${locale}/destinations`}
        className="inline-flex items-center gap-2 bg-primary text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Browse destinations
      </Link>
    </MaxWidthWrapper>
  );
}
