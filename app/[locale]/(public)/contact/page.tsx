import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Mail, Phone, Clock } from "lucide-react";
import { ContactForm } from "./_components/ContactForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ContactPage" });

  const info = [
    { icon: Mail,  label: t("info.emailLabel"), value: t("info.email"),  href: `mailto:${t("info.email")}` },
    { icon: Phone, label: t("info.phoneLabel"), value: t("info.phone"),  href: `tel:${t("info.phone")}` },
    { icon: Clock, label: t("info.hoursLabel"), value: t("info.hours"),  href: null },
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

      <div className="grid lg:grid-cols-2 gap-10">

        {/* Left: Contact info */}
        <div className="space-y-6">
          <h2 className="font-semibold text-gray-900">{t("info.title")}</h2>

          {info.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-4 bg-white border border-gray-100 rounded-2xl p-5">
              <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                {href ? (
                  <a href={href} className="text-sm font-medium text-gray-900 hover:text-primary transition-colors">
                    {value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-gray-900">{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Form */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-5">{t("form.title")}</h2>
          <ContactForm />
        </div>

      </div>
    </div>
  );
}
