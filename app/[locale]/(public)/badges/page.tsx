import Link from "next/link";
import { ShieldCheck, Star, BookOpen, UserCheck, ArrowRight } from "lucide-react";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "Guidni Badges — How We Recognise Quality" };
}

const BADGES = [
  {
    key: "REVIEWED_BY_GUIDNI",
    icon: BookOpen,
    iconClass: "bg-primary text-white",
    name: "Reviewed by Guidni",
    tagline: "Our highest trust signal — a Guidni team member personally visited.",
    description:
      "A member of the Guidni team physically experienced this listing — ate there, stayed there, or joined the activity — and wrote an independent editorial review. The review is always honest, including any \"worth knowing\" notes. It is published on the listing page and shared on our Instagram, Facebook, and TikTok.",
    howToEarn:
      "Partners can request a review from their dashboard. Guidni selects which requests to fulfil based on platform priorities. The review cannot be purchased — it is earned through quality.",
    color: "border-primary/20 bg-primary/5",
  },
  {
    key: "VERIFIED",
    icon: ShieldCheck,
    iconClass: "bg-blue-600 text-white",
    name: "Verified",
    tagline: "Documents, photos, and information validated by Guidni.",
    description:
      "The listing has been reviewed and approved by our operations team. Business registration, contact details, and at least 3 real photos have been verified. You know exactly what you're booking.",
    howToEarn:
      "Assigned manually by the Guidni ops team after the partner submits their business documents. Processing takes up to 5 business days.",
    color: "border-blue-200 bg-blue-50",
  },
  {
    key: "GUEST_FAVORITE",
    icon: Star,
    iconClass: "bg-amber-500 text-white",
    name: "Guest Favorite",
    tagline: "Consistently loved by guests — rating ≥ 4.7 with 25+ reviews.",
    description:
      "This listing has earned a sustained average rating of 4.7 or above across at least 25 reviews. It's not just good — guests repeatedly say so. The badge is recalculated weekly and lost if the listing drops below the threshold for 30 consecutive days.",
    howToEarn:
      "Automatic. Earned by maintaining exceptional guest satisfaction over time. No shortcut — it requires real effort and consistency.",
    color: "border-amber-200 bg-amber-50",
  },
  {
    key: "OWNER_OPERATED",
    icon: UserCheck,
    iconClass: "bg-emerald-600 text-white",
    name: "Owner-Operated",
    tagline: "Managed directly by the owner — no agency or reseller.",
    description:
      "The listing is run personally by its owner. No intermediary, no franchise, no reseller. When you book, you're dealing directly with the person who built the place. We cross-validate this through document checks and periodic re-validation.",
    howToEarn:
      "Self-declared during onboarding, validated by Guidni against business registration documents. Reviewed annually.",
    color: "border-emerald-200 bg-emerald-50",
  },
];

export default async function BadgesPage({ params }: { params: Params }) {
  const { locale } = await params;

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/8 via-white to-primary/4 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
            Trust &amp; Quality
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Guidni <span className="text-blue-600">Badges</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Every badge on Guidni means something. They are earned — not bought, not given by default. Here is exactly what each one means.
          </p>
        </div>
      </section>

      {/* Badge cards */}
      <section className="max-w-4xl mx-auto px-4 py-16 space-y-8">
        {BADGES.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.key}
              className={`border rounded-2xl p-8 ${badge.color}`}
            >
              <div className="flex items-start gap-5">
                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${badge.iconClass}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{badge.name}</h2>
                    <p className="text-sm font-medium text-gray-500 mt-0.5">{badge.tagline}</p>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{badge.description}</p>
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">How to earn it</p>
                    <p className="text-sm text-gray-600">{badge.howToEarn}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Reviewed by Guidni — deep dive */}
      <section className="bg-gray-50 border-t border-gray-100 py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-full">
              <BookOpen className="h-4 w-4" />
              Reviewed by Guidni — How It Works
            </div>
            <h2 className="text-3xl font-bold text-gray-900">The Michelin model for local experiences</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              We visit unannounced. We evaluate honestly. We publish the result — including what could be better.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { step: "1", title: "Partner requests a review", body: "From their dashboard, the partner fills a short form: best times to visit, what to highlight, and their offer for the reviewer (a free table, free stay, or free experience)." },
              { step: "2", title: "Guidni ops team reviews", body: "We review all requests weekly and prioritise based on platform needs, destination coverage, and listing quality. Not every request is fulfilled — that's what gives the badge its value." },
              { step: "3", title: "Reviewer visits unannounced", body: "Within the partner's declared availability window, a Guidni reviewer visits without prior notice. They experience everything as a real guest would." },
              { step: "4", title: "Review published + shared", body: "The editorial review goes live on the listing page — scored, written, and photographed by Guidni. It's also shared on our Instagram, Facebook, and TikTok." },
            ].map(({ step, title, body }) => (
              <div key={step} className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mb-3">
                  {step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500">{body}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-primary/20 rounded-2xl p-6 text-sm text-gray-600 space-y-2">
            <p className="font-semibold text-gray-800">Important: the badge cannot be purchased.</p>
            <p>The moment a review becomes a product, it becomes advertising. Guidni&apos;s editorial review is honest because it is independent. Partners who want paid promotion can use our Ad Placement system (coming soon). This badge is earned through quality — not payment.</p>
          </div>
        </div>
      </section>

      {/* Partner CTA */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-2xl font-bold text-gray-900">List your business on Guidni</h2>
          <p className="text-gray-500">
            Join hundreds of verified partners and start earning the badges your quality deserves.
          </p>
          <Link
            href={`/${locale}/become-partner`}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            Become a Partner
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
