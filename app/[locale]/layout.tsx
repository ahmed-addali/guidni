import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/shared/Navbar/Navbar";
import { CategoriesNav } from "@/components/shared/CategoriesNav/CategoriesNav";
import { Footer } from "@/components/shared/Footer/Footer";
import { Toaster } from "sonner";
import { getDestinations } from "@/lib/actions/destinations";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const [messages, destinations] = await Promise.all([
    import(`../../messages/${locale}.json`).then((m) => m.default),
    getDestinations(),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="sticky top-0 z-50 bg-white">
        <Navbar destinations={destinations} />
        <CategoriesNav />
      </div>
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster richColors position="top-right" />
    </NextIntlClientProvider>
  );
}
