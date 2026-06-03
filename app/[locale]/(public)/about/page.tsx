import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Shield, MapPin, BadgeCheck, Globe, Users, Sparkles, ArrowRight } from "lucide-react";
import { FaFacebook, FaInstagram, FaTiktok, FaYoutube } from "react-icons/fa";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "AboutPage" });

  const stats = [
    { icon: Globe,     value: "2+",   label: t("stats.destinations") },
    { icon: Users,     value: "50+",  label: t("stats.partners") },
    { icon: Sparkles,  value: "300+", label: t("stats.experiences") },
    { icon: BadgeCheck,value: "2025", label: t("stats.founded") },
  ];

  const values = [
    { icon: Shield,     title: t("values.trust.title"),   body: t("values.trust.body") },
    { icon: MapPin,     title: t("values.local.title"),   body: t("values.local.body") },
    { icon: BadgeCheck, title: t("values.quality.title"), body: t("values.quality.body") },
  ];

  const social = [
    { Icon: FaFacebook,  href: "https://www.facebook.com/profile.php?id=61578036814669", label: "Facebook",  count: "4" },
    { Icon: FaInstagram, href: "https://www.instagram.com/guidni.travel/",               label: "Instagram", count: "86" },
    { Icon: FaTiktok,    href: "#",                                                        label: "TikTok",    count: "—" },
    { Icon: FaYoutube,   href: "#",                                                        label: "YouTube",   count: "—" },
  ];

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-12">

      {/* Hero */}
      <section className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          {t("hero.title")} <span className="text-blue-600">Guidni</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          {t("hero.subtitle")}
        </p>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-6 text-center">
            <s.icon className="h-5 w-5 mx-auto mb-3 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">{t("story.title")}</h2>
        <div className="bg-white border border-gray-100 rounded-2xl p-8 space-y-4">
          <p className="text-gray-600 leading-relaxed">{t("story.p1")}</p>
          <p className="text-gray-600 leading-relaxed">{t("story.p2")}</p>
          <p className="text-gray-600 leading-relaxed">{t("story.p3")}</p>
        </div>
      </section>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">{t("values.title")}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {values.map((v) => (
            <div key={v.title} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <v.icon className="h-5 w-5 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">{t("social.title")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {social.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
            >
              <s.Icon className="h-5 w-5 mx-auto mb-2 text-gray-400" />
              <p className="text-lg font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </a>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-3">{t("cta.title")}</h2>
        <p className="text-white/80 mb-6 max-w-xl mx-auto">{t("cta.body")}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href={`/${locale}/activities`}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-primary rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
          >
            {t("cta.explore")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/${locale}/become-partner`}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white/10 border border-white/30 text-white rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors"
          >
            {t("cta.partner")}
          </Link>
        </div>
      </div>

    </div>
  );
}
