import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Users,
  Star,
  TrendingUp,
  Gift,
  ShieldCheck,
  Zap,
  Award,
  CheckCircle2,
  Coins,
} from "lucide-react";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return {
    title: "Become a Guidni Local Agent — Earn While You Work",
    description:
      "Turn your tourist connections into income. Send booking invitations, earn commissions, refer new partners, and collect points — all from your phone.",
  };
}

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Meet a tourist",
    body: "You're already doing this every day — at the beach, at the hotel, at the souk. A tourist asks you what to do. Now you have an answer.",
  },
  {
    step: "2",
    title: "Open Guidni, select an activity",
    body: "Browse commission-enabled listings. Filter by what's available today. See exactly how much TND you earn per booking before you send anything.",
  },
  {
    step: "3",
    title: "Send an invitation",
    body: "Type their email, share a WhatsApp link, or show them a QR code on your screen. The tourist gets a personal page: the activity, the price, your name on it.",
  },
  {
    step: "4",
    title: "Tourist books, you earn",
    body: "They complete the booking on their phone. Your commission is recorded automatically. No cash handling, no manual tracking, no arguments.",
  },
];

const EARN_POINTS = [
  {
    icon: Zap,
    title: "Every booking",
    points: "+2 pts",
    description: "Earn 2 points on every tourist booking made through your invitation.",
  },
  {
    icon: Users,
    title: "Refer a partner",
    points: "Up to +105 pts",
    description:
      "Know a restaurant owner, a beach club, or a rental shop? Refer them. Earn points at each milestone: account created → verified → first listing → first booking.",
  },
  {
    icon: Award,
    title: "Reach Pro tier",
    points: "+25 pts",
    description: "One-time bonus when you hit 10 confirmed bookings.",
  },
  {
    icon: TrendingUp,
    title: "Reach Elite tier",
    points: "+75 pts",
    description: "One-time bonus when you hit 50 confirmed bookings.",
  },
];

const TIERS = [
  {
    name: "Starter",
    requirement: "0–9 confirmed bookings",
    color: "border-gray-200 bg-gray-50",
    badge: "bg-gray-100 text-gray-600",
    perks: ["Base commission rate", "Send invitations", "Earn points"],
  },
  {
    name: "Pro",
    requirement: "10–49 confirmed bookings",
    color: "border-blue-200 bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    perks: ["+1% bonus commission on all eligible listings", "Pro Agent badge on your profile", "Priority in agent directory"],
  },
  {
    name: "Elite",
    requirement: "50+ confirmed bookings",
    color: "border-primary/20 bg-primary/5",
    badge: "bg-primary/10 text-primary",
    perks: ["+2% bonus commission on all eligible listings", "Elite Agent badge", "Featured placement in leaderboard", "Priority payout processing"],
  },
];

const WHO_CAN_JOIN = [
  "Beach club staff",
  "Hotel concierge & reception",
  "Taxi & transfer drivers",
  "Souk & medina shop owners",
  "Restaurant & café staff",
  "Tour desk agents",
  "Freelance guides",
  "Anyone who meets tourists daily",
];

export default async function BecomeAgentPage({ params }: { params: Params }) {
  const { locale } = await params;

  return (
    <div className="min-h-screen">

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/8 via-white to-primary/4 py-24 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <span className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
            Guidni Local Agent Program
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
            Earn while you{" "}
            <span className="text-blue-600">meet tourists</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            You already connect tourists to experiences every day. Guidni turns
            those conversations into commissions — automatically, from your phone.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={`/${locale}/apply-agent`}
              className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-base"
            >
              Apply now — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="text-sm text-gray-400">No setup fee · Commission-only · Approved in 24h</span>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "5%", label: "Average commission per booking" },
            { value: "TND 0.50", label: "Value per point earned" },
            { value: "24h", label: "Application approval time" },
            { value: "105 pts", label: "Max points per partner referral" },
          ].map(({ value, label }) => (
            <div key={label} className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            How it <span className="text-blue-600">works</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Four steps, done entirely from your phone. No training required.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {HOW_IT_WORKS.map(({ step, title, body }) => (
            <div key={step} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center mb-4">
                {step}
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What you earn */}
      <section className="bg-gray-50 border-t border-gray-100 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Two ways to <span className="text-blue-600">earn</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Commission on every booking you generate. Points for long-term growth.
              Both convert to real TND in your wallet.
            </p>
          </div>

          {/* Commission */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0 w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center">
                <Coins className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Commission</h3>
                <p className="text-sm text-gray-500 mt-0.5">Paid on every confirmed booking you generate</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Tourist books a TND 80 activity at 5%", earn: "TND 4.00" },
                { label: "Tourist books a TND 150 stay at 5%", earn: "TND 7.50" },
                { label: "Pro Agent — same activity at 6%", earn: "TND 4.80" },
              ].map(({ label, earn }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2">{label}</p>
                  <p className="text-lg font-bold text-gray-900">You earn {earn}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Commission rate is set by each partner (min 3%, max 20%). You can filter to show only commission-enabled listings and sort by highest earning.
            </p>
          </div>

          {/* Points */}
          <div className="bg-white border border-gray-100 rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-2">
              <div className="shrink-0 w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center">
                <Gift className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Points Wallet</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Earn points on bookings and partner referrals —{" "}
                  <span className="font-semibold text-gray-700">1 point = TND 0.50</span>
                </p>
              </div>
            </div>
            <div className="bg-amber-50 rounded-xl px-5 py-3 mb-6 mt-4 text-sm text-amber-800 font-medium">
              100 points = TND 50 cash · Minimum redemption: 50 pts
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {EARN_POINTS.map(({ icon: Icon, title, points, description }) => (
                <div key={title} className="flex gap-3">
                  <div className="shrink-0 w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Icon className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{title}</p>
                      <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{points}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partner referral spotlight */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-primary text-white rounded-2xl p-8 sm:p-10">
          <div className="flex items-start gap-4 mb-6">
            <div className="shrink-0 w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Refer a partner, earn up to TND 52</h3>
              <p className="text-white/70 text-sm mt-1">
                Know a business that should be on Guidni? Refer them and earn points at every milestone.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { milestone: "Partner signs up", pts: "+5 pts", note: "When they create their account" },
              { milestone: "Admin verifies them", pts: "+20 pts", note: "Our team approves the business" },
              { milestone: "First listing published", pts: "+30 pts", note: "They go live on the platform" },
              { milestone: "First booking received", pts: "+50 pts", note: "Their first real customer" },
            ].map(({ milestone, pts, note }) => (
              <div key={milestone} className="bg-white/10 rounded-xl p-4">
                <p className="text-lg font-bold text-white">{pts}</p>
                <p className="text-sm font-medium text-white/90 mt-1">{milestone}</p>
                <p className="text-xs text-white/60 mt-1">{note}</p>
              </div>
            ))}
          </div>
          <p className="text-white/60 text-xs mt-5">
            Points are only awarded after our team verifies the partner. This protects against fake referrals and ensures you get credit for real introductions.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="bg-gray-50 border-t border-gray-100 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Grow your <span className="text-blue-600">tier</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              The more bookings you generate, the higher your tier — and the more you earn on every booking.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {TIERS.map(({ name, requirement, color, badge, perks }) => (
              <div key={name} className={`border rounded-2xl p-6 ${color}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge}`}>{name}</span>
                </div>
                <p className="text-xs text-gray-500 mb-5">{requirement}</p>
                <ul className="space-y-2.5">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who can join */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl font-bold text-gray-900">
            Who can <span className="text-blue-600">join</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            If you interact with tourists regularly, you qualify. No diploma, no office, no minimum hours.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {WHO_CAN_JOIN.map((role) => (
            <span
              key={role}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              {role}
            </span>
          ))}
        </div>
      </section>

      {/* Trust & verification */}
      <section className="bg-gray-50 border-t border-gray-100 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center space-y-3 mb-10">
            <h2 className="text-3xl font-bold text-gray-900">
              Trust &amp; <span className="text-blue-600">verification</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Every agent is reviewed by a human before they can send a single invitation. This protects tourists, partners, and you.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: ShieldCheck,
                title: "Admin-approved",
                body: "Every application is reviewed by the Guidni team within 24 hours. We check your identity and your context before approving.",
              },
              {
                icon: Star,
                title: "Verified Agent badge",
                body: "Once verified, you receive the Guidni Verified Agent badge — displayed on every invitation you send and on your agent profile.",
              },
              {
                icon: Users,
                title: "Rating system",
                body: "Tourists can rate their experience with your invitation. Your rating is public on your profile. This keeps the network trustworthy for everyone.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-20">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Common questions</h2>
        </div>
        <div className="space-y-4">
          {[
            {
              q: "Is there a fee to become an agent?",
              a: "No. Applying is free. There are no monthly fees, no setup costs, and no minimum booking requirements. You earn when you generate bookings — nothing before that.",
            },
            {
              q: "How do I get paid?",
              a: "Commissions are tracked automatically in your dashboard. You request a payout when you're ready. Guidni processes it via bank transfer or Konnect. Minimum payout: TND 25.",
            },
            {
              q: "What about points — can I cash them out too?",
              a: "Yes. Points redeem as cash at the rate of TND 0.50 per point. Minimum redemption is 50 points (TND 25). You request a points payout from the same wallet in your dashboard.",
            },
            {
              q: "Do I need to handle any money from tourists?",
              a: "No. Tourists pay online when they complete the booking. You never touch the money — the commission is credited to your account automatically after the booking is confirmed.",
            },
            {
              q: "Can I refer a business I already know?",
              a: "Yes — and that's the best referrals. You submit the partner's details and our team contacts them directly. You earn points progressively as they set up their account and start receiving bookings.",
            },
            {
              q: "Can my account be deactivated?",
              a: "Yes. Guidni reserves the right to deactivate agents who abuse the system, send fake invitations, or violate our terms. All pending earnings are reviewed by admin on deactivation.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-white border border-gray-100 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-primary via-primary to-blue-800 py-20 px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
            Ready to start earning?
          </h2>
          <p className="text-white/70 text-lg max-w-lg mx-auto">
            The application takes 2 minutes. Approval within 24 hours. Your first invitation can go out the same day.
          </p>
          <Link
            href={`/${locale}/apply-agent`}
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-xl font-bold text-base hover:bg-white/90 transition-colors"
          >
            Apply to become a Local Agent
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-white/40 text-sm">Free · No commitment · Commission-only</p>
        </div>
      </section>

    </div>
  );
}
