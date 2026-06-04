import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FAQPage" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function FAQPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FAQPage" });

  const travelers = t.raw("travelers") as Array<{ q: string; a: string }>;
  const partners  = t.raw("partners")  as Array<{ q: string; a: string }>;
  const platform  = t.raw("platform")  as Array<{ q: string; a: string }>;

  const tabs = [
    { key: "travelers", label: t("tabs.travelers"), items: travelers },
    { key: "partners",  label: t("tabs.partners"),  items: partners },
    { key: "platform",  label: t("tabs.platform"),  items: platform },
  ];

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-12">

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          {t("title")}
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">{t("subtitle")}</p>
      </div>

      {/* Tabbed FAQ */}
      <Tabs defaultValue="travelers">
        <TabsList className="w-full mb-8 h-auto p-1 bg-gray-100 rounded-xl grid grid-cols-3">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="rounded-lg text-sm py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <Accordion className="space-y-2">
              {tab.items.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="bg-white border border-gray-100 rounded-2xl px-5 data-[state=open]:shadow-sm transition-shadow"
                >
                  <AccordionTrigger className="text-sm font-semibold text-gray-900 text-left hover:no-underline py-4">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-500 leading-relaxed pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        ))}
      </Tabs>

      {/* CTA */}
      <div className="mt-12 bg-white border border-gray-100 rounded-2xl p-8 text-center">
        <h2 className="font-semibold text-gray-900 mb-2">{t("cta.title")}</h2>
        <p className="text-sm text-gray-500 mb-5">{t("cta.body")}</p>
        <Link
          href={`/${locale}/contact`}
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          {t("cta.button")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}
