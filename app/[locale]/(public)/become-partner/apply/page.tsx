import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FiCheck, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { auth } from "@/lib/auth";
import { getMyBusinessProfile } from "@/lib/actions/partner";
import { BecomePartnerForm } from "./_components/BecomePartnerForm";
import type { WizardLabels } from "./_components/BecomePartnerForm";

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "BecomePartner" });
  return { title: t("apply.title") };
}

export default async function BecomePartnerApplyPage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/become-partner/apply`);
  }

  const profile = await getMyBusinessProfile();
  if (profile) {
    redirect(`/${locale}/partner/dashboard`);
  }

  const t = await getTranslations({ locale, namespace: "BecomePartner" });

  const benefitItems = t.raw("apply.benefitsList.items") as string[];

  const labels: WizardLabels = {
    steps: {
      category: t("apply.steps.category"),
      details:  t("apply.steps.details"),
      location: t("apply.steps.location"),
      review:   t("apply.steps.review"),
    },
    category: {
      title:                t("apply.category.title"),
      subtitle:             t("apply.category.subtitle"),
      activitiesLabel:      t("apply.category.activitiesLabel"),
      activitiesDesc:       t("apply.category.activitiesDesc"),
      staysLabel:           t("apply.category.staysLabel"),
      staysDesc:            t("apply.category.staysDesc"),
      bothLabel:            t("apply.category.bothLabel"),
      bothDesc:             t("apply.category.bothDesc"),
      restaurantLabel:      t("apply.category.restaurantLabel"),
      restaurantDesc:       t("apply.category.restaurantDesc"),
      rentalsLabel:         t("apply.category.rentalsLabel"),
      rentalsDesc:          t("apply.category.rentalsDesc"),
      transfersLabel:       t("apply.category.transfersLabel"),
      transfersDesc:        t("apply.category.transfersDesc"),
      shopLabel:            t("apply.category.shopLabel"),
      shopDesc:             t("apply.category.shopDesc"),
      guideLabel:           t("apply.category.guideLabel"),
      guideDesc:            t("apply.category.guideDesc"),
      registrationTitle:    t("apply.category.registrationTitle"),
      registrationSubtitle: t("apply.category.registrationSubtitle"),
      comingSoon:           t("apply.category.comingSoon"),
    },
    details:  { title: t("apply.details.title"),  subtitle: t("apply.details.subtitle") },
    location: { title: t("apply.location.title"), subtitle: t("apply.location.subtitle") },
    reviewStep: {
      title:       t("apply.reviewStep.title"),
      subtitle:    t("apply.reviewStep.subtitle"),
      name:        t("apply.reviewStep.name"),
      category:    t("apply.reviewStep.category"),
      type:        t("apply.reviewStep.type"),
      location:    t("apply.reviewStep.location"),
      address:     t("apply.reviewStep.address"),
      phone:       t("apply.reviewStep.phone"),
      website:     t("apply.reviewStep.website"),
      description: t("apply.reviewStep.description"),
    },
    terms: {
      agreeTo:     t("apply.terms.agreeTo"),
      termsLink:   t("apply.terms.termsLink"),
      and:         t("apply.terms.and"),
      privacyLink: t("apply.terms.privacyLink"),
      required:    t("apply.terms.required"),
    },
    buttons: {
      back:    t("apply.buttons.back"),
      next:    t("apply.buttons.next"),
      confirm: t("apply.buttons.confirm"),
    },
    fields: {
      name:                t("apply.fields.name"),
      namePlaceholder:     t("apply.fields.namePlaceholder"),
      category:            t("apply.fields.category"),
      type:                t("apply.fields.type"),
      typeIndividual:      t("apply.fields.typeIndividual"),
      typeCompany:         t("apply.fields.typeCompany"),
      companyRN:           t("apply.fields.companyRN"),
      companyRNPlaceholder:t("apply.fields.companyRNPlaceholder"),
      country:             t("apply.fields.country"),
      countryPlaceholder:  t("apply.fields.countryPlaceholder"),
      region:              t("apply.fields.region"),
      regionPlaceholder:   t("apply.fields.regionPlaceholder"),
      address:             t("apply.fields.address"),
      addressPlaceholder:  t("apply.fields.addressPlaceholder"),
      description:         t("apply.fields.description"),
      descriptionPlaceholder: t("apply.fields.descriptionPlaceholder"),
      phone:               t("apply.fields.phone"),
      phonePlaceholder:    t("apply.fields.phonePlaceholder"),
      website:             t("apply.fields.website"),
      websitePlaceholder:  t("apply.fields.websitePlaceholder"),
      instagram:           t("apply.fields.instagram"),
      instagramPlaceholder:t("apply.fields.instagramPlaceholder"),
      facebook:            t("apply.fields.facebook"),
      facebookPlaceholder: t("apply.fields.facebookPlaceholder"),
      languages:           t("apply.fields.languages"),
      languagesPlaceholder:t("apply.fields.languagesPlaceholder"),
    },
    submitting: t("apply.submitting"),
    success:    t("apply.success"),
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-12">
      {/* Back link */}
      <Link
        href={`/${locale}/become-partner`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors"
      >
        ← {t("hero.badge")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* ── Form (2/3) ───────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="mb-8 space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">{t("apply.title")}</h1>
            <p className="text-gray-400 text-sm">{t("apply.subtitle")}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
            <BecomePartnerForm labels={labels} />
          </div>
        </div>

        {/* ── Sidebar (1/3) ────────────────────────────────── */}
        <div className="space-y-5">
          {/* Benefits */}
          <div className="bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">{t("apply.benefitsList.title")}</h3>
            <ul className="space-y-3">
              {benefitItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <FiCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900">{t("apply.support.title")}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{t("apply.support.description")}</p>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-gray-600">
                <FiMail className="h-4 w-4 text-primary shrink-0" />
                <span dir="ltr">{t("apply.support.email")}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-600">
                <FiPhone className="h-4 w-4 text-primary shrink-0" />
                <span dir="ltr">{t("apply.support.phone")}</span>
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-600">
                <FiMapPin className="h-4 w-4 text-primary shrink-0" />
                <span>{t("apply.support.address")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
