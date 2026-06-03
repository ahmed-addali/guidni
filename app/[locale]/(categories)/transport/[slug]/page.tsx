import { redirect } from "next/navigation";

type Params = Promise<{ locale: string; slug: string }>;

export default async function OldRentalSlugRedirect({ params }: { params: Params }) {
  const { locale, slug } = await params;
  redirect(`/${locale}/transport/rentals/${slug}`);
}
