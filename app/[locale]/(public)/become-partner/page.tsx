import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { FiArrowRight, FiBarChart2, FiHeadphones, FiLayers, FiStar, FiUsers } from "react-icons/fi";
import { FiCheck } from "react-icons/fi";
import { ShieldCheck, Star, BookOpen, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BecomePartner" });
  return { title: t("hero.title") };
}

export default async function BecomePartnerPage({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BecomePartner" });

  const benefits = [
    { icon: FiUsers,      key: "reach"   },
    { icon: FiLayers,     key: "manage"  },
    { icon: FiBarChart2,  key: "earn"    },
    { icon: FiHeadphones, key: "support" },
  ] as const;

  const steps = ["step1", "step2", "step3"] as const;

  // Raw arrays from translations
  const testimonials = t.raw("testimonials.items") as { name: string; business: string; quote: string }[];
  const faqs = t.raw("faq.items") as { question: string; answer: string }[];

  return (
    <div className="min-h-screen">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-white to-primary/5 py-24 px-4">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
            {t("hero.badge")}
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight">
            {t("hero.title")}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href={`/${locale}/become-partner/apply`}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              {t("hero.cta")}
              <FiArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/${locale}/login`}
              className="text-sm text-gray-400 hover:text-gray-700 underline-offset-4 hover:underline transition-colors"
            >
              {t("hero.login")}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Benefits ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-3">
            {t("benefits.title")}
          </h2>
          <p className="text-center text-gray-400 text-sm mb-12 max-w-xl mx-auto">
            {t("hero.subtitle")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="group bg-gray-50 hover:bg-primary/5 border border-transparent hover:border-primary/10 rounded-2xl p-6 space-y-3 transition-all"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900">{t(`benefits.${key}.title`)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`benefits.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-screen-md mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-12">
            {t("howItWorks.title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map((key, i) => (
              <div key={key} className="relative space-y-4">
                {/* connector line between steps */}
                {i < 2 && (
                  <div className="hidden sm:block absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-px bg-primary/20" />
                )}
                <div className="h-12 w-12 rounded-full bg-primary text-white text-lg font-bold flex items-center justify-center mx-auto ring-4 ring-primary/10">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-gray-900">{t(`howItWorks.${key}.title`)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`howItWorks.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Badges & Trust ────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-screen-lg mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
              Trust & Quality
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Earn badges that <span className="text-blue-600">set you apart</span>
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Guidni badges are displayed on your listing and on search results. They signal quality to travellers and drive more bookings.
            </p>
          </div>

          {/* Badge grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Reviewed by Guidni — featured */}
            <div className="sm:col-span-2 border border-primary/20 bg-primary/5 rounded-2xl p-8">
              <div className="flex items-start gap-5">
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">Reviewed by Guidni</h3>
                  <p className="text-sm text-gray-500 font-medium">Our highest trust signal — a Guidni team member personally visited.</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    A member of the Guidni team visits your listing as a real guest — they dine, stay, or join your activity — and writes an independent editorial review. The review is published on your listing page and shared on our Instagram, Facebook, and TikTok.
                  </p>
                  <div className="pt-2 bg-white rounded-xl p-4 border border-primary/10 text-sm text-gray-600 space-y-1">
                    <p className="font-semibold text-gray-800">How it works for you as a partner:</p>
                    <p>You request a review from your dashboard and propose an offer (e.g. a free table for 2 with your full menu, a complimentary stay, or a free activity experience). Our team selects requests based on platform priorities. If selected, a reviewer visits <em>unannounced</em> within your declared availability window and evaluates everything — quality, service, prices, atmosphere. The result is always honest, including any "worth knowing" notes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verified */}
            <div className="border border-blue-200 bg-blue-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900">Verified</h3>
                  <p className="text-xs text-gray-500 font-medium">Documents, photos, and information validated by Guidni.</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Assigned after our ops team reviews your business registration, contact details, and photos. Processing takes up to 5 business days after you submit your documents.
                  </p>
                </div>
              </div>
            </div>

            {/* Guest Favorite */}
            <div className="border border-amber-200 bg-amber-50 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <Star className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-gray-900">Guest Favorite</h3>
                  <p className="text-xs text-gray-500 font-medium">Consistently loved by guests — rating ≥ 4.7 with 25+ reviews.</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Awarded automatically when your listing sustains a 4.7+ average across 25+ reviews. Recalculated weekly — earned through real guest satisfaction, no shortcuts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA to badges page */}
          <div className="text-center">
            <Link
              href={`/${locale}/badges`}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              Learn about all Guidni badges
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-screen-lg mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-12">
            {t("testimonials.title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-2xl p-6 space-y-4 border border-gray-100"
              >
                {/* stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <FiStar key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed italic">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.business}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
            {t("faq.title")}
          </h2>
          <Accordion className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-white rounded-xl border border-gray-100 px-5 shadow-sm"
              >
                <AccordionTrigger className="text-sm font-semibold text-gray-800 hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-gray-500 leading-relaxed pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────── */}
      <section className="py-20 px-4 bg-primary">
        <div className="max-w-xl mx-auto text-center space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{t("cta.title")}</h2>
          <p className="text-white/70 text-sm">{t("cta.subtitle")}</p>
          <Link
            href={`/${locale}/become-partner/apply`}
            className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all shadow-lg"
          >
            {t("cta.button")}
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
