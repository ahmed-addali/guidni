"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import Link from "next/link";
import { FiActivity, FiArrowLeft, FiArrowRight, FiCheck, FiCheckCircle, FiFileText, FiGlobe, FiHome, FiLayers, FiMapPin, FiPhone } from "react-icons/fi";
import { IoRestaurant } from "react-icons/io5";
import { TbCar, TbRoute } from "react-icons/tb";
import { FaStore, FaCompass } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createBusinessProfile } from "@/lib/actions/partner";

// ── Types ──────────────────────────────────────────────────────────────────────

type StepLabels = {
  category: string;
  details: string;
  location: string;
  review: string;
};

type CategoryLabels = {
  title: string;
  subtitle: string;
  activitiesLabel: string;
  activitiesDesc: string;
  staysLabel: string;
  staysDesc: string;
  bothLabel: string;
  bothDesc: string;
  restaurantLabel: string;
  restaurantDesc: string;
  rentalsLabel: string;
  rentalsDesc: string;
  transfersLabel: string;
  transfersDesc: string;
  shopLabel: string;
  shopDesc: string;
  guideLabel: string;
  guideDesc: string;
  registrationTitle: string;
  registrationSubtitle: string;
  comingSoon: string;
};

type DetailsLabels  = { title: string; subtitle: string };
type LocationLabels = { title: string; subtitle: string };

type ReviewLabels = {
  title: string; subtitle: string;
  name: string; category: string; type: string;
  location: string; address: string; phone: string; website: string; description: string;
};

type TermsLabels  = { agreeTo: string; termsLink: string; and: string; privacyLink: string; required: string };
type ButtonLabels = { back: string; next: string; confirm: string };

type FieldLabels = Record<string, string>;

export type WizardLabels = {
  steps: StepLabels;
  category: CategoryLabels;
  details: DetailsLabels;
  location: LocationLabels;
  reviewStep: ReviewLabels;
  terms: TermsLabels;
  buttons: ButtonLabels;
  fields: FieldLabels;
  submitting: string;
  success: string;
};

// ── Form state ─────────────────────────────────────────────────────────────────

type FormData = {
  category: string;
  type: string;
  companyRN: string;
  name: string;
  description: string;
  phone: string;
  website: string;
  instagram: string;
  facebook: string;
  languages: string;
  country: string;
  region: string;
  address: string;
  acceptedTerms: boolean;
};

const STEPS = { CATEGORY: 0, DETAILS: 1, LOCATION: 2, REVIEW: 3 } as const;

// ── Progress bar ───────────────────────────────────────────────────────────────

function StepProgress({
  current,
  labels,
}: {
  current: number;
  labels: StepLabels;
}) {
  const steps = [labels.category, labels.details, labels.location, labels.review];
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={i} className="flex-1 flex flex-col items-center relative">
            {/* connector */}
            {i > 0 && (
              <div
                className={`absolute top-5 right-1/2 left-[-50%] h-0.5 ${
                  done ? "bg-primary" : "bg-gray-200"
                }`}
              />
            )}
            <div
              className={`relative z-10 h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all ${
                done
                  ? "bg-primary border-primary text-white"
                  : active
                  ? "bg-white border-primary text-primary"
                  : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {done ? <FiCheck className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`mt-2 text-xs font-medium hidden sm:block ${active ? "text-primary" : done ? "text-gray-600" : "text-gray-400"}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Category option button ─────────────────────────────────────────────────────

function CategoryButton({
  value,
  selected,
  icon: Icon,
  label,
  description,
  onClick,
}: {
  value: string;
  selected: boolean;
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-start gap-4 ${
        selected
          ? "border-primary bg-primary/5"
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${selected ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className={`font-semibold text-sm ${selected ? "text-primary" : "text-gray-800"}`}>{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      {selected && (
        <FiCheckCircle className="h-5 w-5 text-primary ml-auto shrink-0 mt-0.5" />
      )}
    </button>
  );
}

// ── Review row ─────────────────────────────────────────────────────────────────

function ReviewRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function BecomePartnerForm({ labels }: { labels: WizardLabels }) {
  const locale  = useLocale();
  const router  = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<number>(STEPS.CATEGORY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const [form, setForm] = useState<FormData>({
    category: "",
    type: "INDIVIDUAL",
    companyRN: "",
    name: "",
    description: "",
    phone: "",
    website: "",
    instagram: "",
    facebook: "",
    languages: "",
    country: "",
    region: "",
    address: "",
    acceptedTerms: false,
  });

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  const setField = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (step === STEPS.CATEGORY) {
      if (!form.category) next.category = labels.fields.category + " is required";
      if (form.type === "COMPANY" && !form.companyRN) next.companyRN = labels.fields.companyRN + " is required";
    }
    if (step === STEPS.DETAILS) {
      if (!form.name.trim())        next.name        = labels.fields.name + " is required";
      if (form.description.trim().length < 20) next.description = "Description must be at least 20 characters";
    }
    if (step === STEPS.LOCATION) {
      if (!form.country.trim()) next.country = labels.fields.country + " is required";
      if (!form.region.trim())  next.region  = labels.fields.region  + " is required";
    }
    if (step === STEPS.REVIEW) {
      if (!form.acceptedTerms) next.acceptedTerms = labels.terms.required;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (step < STEPS.REVIEW) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    startTransition(async () => {
      const result = await createBusinessProfile({
        name:       form.name,
        description:form.description,
        category:   form.category,
        type:       form.type,
        country:    form.country,
        region:     form.region,
        address:    form.address   || undefined,
        phone:      form.phone     || undefined,
        companyRN:  form.companyRN || undefined,
        website:    form.website   || undefined,
        instagram:  form.instagram || undefined,
        facebook:   form.facebook  || undefined,
        languages:  form.languages || undefined,
      });
      if (result.success) {
        toast.success(labels.success);
        router.push(`/${locale}/partner/dashboard`);
      } else {
        toast.error(result.error ?? "Something went wrong.");
      }
    });
  };

  const f = labels.fields;
  const categoryOptions = [
    { value: "activities", icon: FiActivity,   label: labels.category.activitiesLabel, description: labels.category.activitiesDesc },
    { value: "stays",      icon: FiHome,       label: labels.category.staysLabel,      description: labels.category.staysDesc },
    { value: "restaurant", icon: IoRestaurant, label: labels.category.restaurantLabel, description: labels.category.restaurantDesc },
    { value: "rentals",    icon: TbCar,        label: labels.category.rentalsLabel,    description: labels.category.rentalsDesc },
    { value: "transfers",  icon: TbRoute,      label: labels.category.transfersLabel,  description: labels.category.transfersDesc },
    { value: "shop",       icon: FaStore,      label: labels.category.shopLabel,       description: labels.category.shopDesc },
    { value: "guide",      icon: FaCompass,    label: labels.category.guideLabel,      description: labels.category.guideDesc },
  ];

  const descriptionPlaceholders: Record<string, string> = {
    activities: "Describe your activities or experiences — what you offer, your specialty, what makes you different from other guides in the area...",
    stays:      "Describe your property — the style, unique features, atmosphere, and what guests love most about staying with you...",
    restaurant: "Describe your restaurant — the cuisine, ambiance, signature dishes, and what makes dining with you a memorable experience...",
    rentals:    "Describe your rental fleet — types of vehicles, condition, pickup locations, and what makes renting from you a great choice...",
    transfers:  "Describe your transfer service — types of trips you cover, vehicles available, languages spoken, and what makes your service reliable...",
    shop:       "Describe your shop — the products you make or sell, your craft, what inspires you, and why travellers should visit your shop...",
    guide:      "Tell travelers about yourself — your local expertise, how many years you've been here, your specialties, and why your plans are worth following...",
  };

  const categoryLabel = categoryOptions.find((o) => o.value === form.category)?.label ?? "";
  const typeLabel = form.type === "COMPANY" ? f.typeCompany : f.typeIndividual;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <StepProgress current={step} labels={labels.steps} />

      {/* ── Step 0: Category ──────────────────────────────── */}
      {step === STEPS.CATEGORY && (
        <div className="space-y-8">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">{labels.category.title}</h2>
            <p className="text-sm text-gray-400">{labels.category.subtitle}</p>
          </div>
          <div className="space-y-3">
            {categoryOptions.map((opt) => (
              <CategoryButton
                key={opt.value}
                value={opt.value}
                selected={form.category === opt.value}
                icon={opt.icon}
                label={opt.label}
                description={opt.description}
                onClick={() => setField("category", opt.value)}
              />
            ))}
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-semibold text-gray-800">{labels.category.registrationTitle}</h3>
            <p className="text-sm text-gray-400">{labels.category.registrationSubtitle}</p>
            <div className="grid grid-cols-2 gap-3">
              {(["INDIVIDUAL", "COMPANY"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setField("type", t)}
                  className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.type === t
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {t === "INDIVIDUAL" ? f.typeIndividual : f.typeCompany}
                </button>
              ))}
            </div>
            {form.type === "COMPANY" && (
              <div className="space-y-1.5">
                <Label htmlFor="companyRN">{f.companyRN}</Label>
                <Input id="companyRN" placeholder={f.companyRNPlaceholder} value={form.companyRN} onChange={set("companyRN")} maxLength={50} />
                {errors.companyRN && <p className="text-xs text-red-500">{errors.companyRN}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 1: Details ───────────────────────────────── */}
      {step === STEPS.DETAILS && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">{labels.details.title}</h2>
            <p className="text-sm text-gray-400">{labels.details.subtitle}</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{f.name} *</Label>
              <Input id="name" placeholder={f.namePlaceholder} value={form.name} onChange={set("name")} maxLength={100} />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">{f.description} *</Label>
              <Textarea id="description" placeholder={descriptionPlaceholders[form.category] ?? f.descriptionPlaceholder} value={form.description} onChange={set("description")} rows={4} maxLength={1000} />
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">{f.phone}</Label>
                <Input id="phone" placeholder={f.phonePlaceholder} value={form.phone} onChange={set("phone")} maxLength={30} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="website">{f.website}</Label>
                <Input id="website" type="url" placeholder={f.websitePlaceholder} value={form.website} onChange={set("website")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="instagram">{f.instagram}</Label>
                <Input id="instagram" placeholder={f.instagramPlaceholder} value={form.instagram} onChange={set("instagram")} maxLength={60} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="facebook">{f.facebook}</Label>
                <Input id="facebook" placeholder={f.facebookPlaceholder} value={form.facebook} onChange={set("facebook")} maxLength={100} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="languages">{f.languages}</Label>
                <Input id="languages" placeholder={f.languagesPlaceholder} value={form.languages} onChange={set("languages")} maxLength={100} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Location ──────────────────────────────── */}
      {step === STEPS.LOCATION && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">{labels.location.title}</h2>
            <p className="text-sm text-gray-400">{labels.location.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="country">{f.country} *</Label>
              <Input id="country" placeholder={f.countryPlaceholder} value={form.country} onChange={set("country")} maxLength={60} />
              {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="region">{f.region} *</Label>
              <Input id="region" placeholder={f.regionPlaceholder} value={form.region} onChange={set("region")} maxLength={60} />
              {errors.region && <p className="text-xs text-red-500">{errors.region}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">{f.address}</Label>
              <Input id="address" placeholder={f.addressPlaceholder} value={form.address} onChange={set("address")} maxLength={200} />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Review ────────────────────────────────── */}
      {step === STEPS.REVIEW && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900">{labels.reviewStep.title}</h2>
            <p className="text-sm text-gray-400">{labels.reviewStep.subtitle}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 space-y-0">
            <ReviewRow icon={FiLayers}   label={labels.reviewStep.category}    value={categoryLabel} />
            <ReviewRow icon={FiFileText} label={labels.reviewStep.type}        value={typeLabel} />
            <ReviewRow icon={FiActivity} label={labels.reviewStep.name}        value={form.name} />
            <ReviewRow icon={FiFileText} label={labels.reviewStep.description} value={form.description} />
            <ReviewRow icon={FiMapPin}   label={labels.reviewStep.location}    value={[form.country, form.region].filter(Boolean).join(", ")} />
            <ReviewRow icon={FiMapPin}   label={labels.reviewStep.address}     value={form.address} />
            <ReviewRow icon={FiPhone}    label={labels.reviewStep.phone}       value={form.phone} />
            <ReviewRow icon={FiGlobe}    label={labels.reviewStep.website}     value={form.website} />
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="terms"
              checked={form.acceptedTerms}
              onCheckedChange={(v) => setField("acceptedTerms", !!v)}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-sm text-gray-500 leading-relaxed cursor-pointer">
              {labels.terms.agreeTo}{" "}
              <Link href="/terms" className="text-primary hover:underline font-medium">{labels.terms.termsLink}</Link>
              {" "}{labels.terms.and}{" "}
              <Link href="/privacy" className="text-primary hover:underline font-medium">{labels.terms.privacyLink}</Link>
            </label>
          </div>
          {errors.acceptedTerms && <p className="text-xs text-red-500 -mt-2">{errors.acceptedTerms}</p>}
        </div>
      )}

      {/* ── Navigation ────────────────────────────────────── */}
      <div className="flex justify-between items-center pt-2">
        {step > STEPS.CATEGORY ? (
          <Button type="button" variant="outline" onClick={handleBack} disabled={isPending} className="gap-2">
            <FiArrowLeft className="h-4 w-4" /> {labels.buttons.back}
          </Button>
        ) : (
          <div />
        )}

        {step < STEPS.REVIEW ? (
          <Button type="button" onClick={handleNext} className="gap-2">
            {labels.buttons.next} <FiArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="submit" disabled={isPending} className="gap-2 min-w-40">
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {labels.submitting}
              </>
            ) : (
              <>
                <FiCheck className="h-4 w-4" /> {labels.buttons.confirm}
              </>
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
