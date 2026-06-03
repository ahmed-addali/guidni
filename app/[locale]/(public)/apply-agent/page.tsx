import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, Shield, Coins } from "lucide-react";
import { auth } from "@/lib/auth";
import { getMyAgentProfile } from "@/lib/actions/agent";
import { getDestinations } from "@/lib/actions/destinations";
import { AgentApplicationForm } from "./_components/AgentApplicationForm";

type Params = Promise<{ locale: string }>;

export async function generateMetadata() {
  return { title: "Apply to Become a Guidni Local Agent" };
}

export default async function ApplyAgentPage({ params }: { params: Params }) {
  const { locale } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/apply-agent`);
  }

  // If already has a profile, show status
  const profile = await getMyAgentProfile();
  if (profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          {profile.isVerified
            ? <CheckCircle2 className="h-8 w-8 text-primary" />
            : <Clock className="h-8 w-8 text-primary" />
          }
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          {profile.isVerified ? "You're a verified agent" : "Application under review"}
        </h1>
        <p className="text-gray-500">
          {profile.isVerified
            ? "Your account is active. Head to your agent dashboard to start sending invitations."
            : "Our team will review your application within 24 hours. We'll notify you once approved."
          }
        </p>
        {profile.isVerified && (
          <Link
            href={`/${locale}/agent`}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Go to my dashboard →
          </Link>
        )}
      </div>
    );
  }

  const destinations = await getDestinations();

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-12">

      {/* Back link */}
      <Link
        href={`/${locale}/become-agent`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-8 transition-colors"
      >
        ← Back to Local Agent program
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* Form (2/3) */}
        <div className="lg:col-span-2">
          <div className="mb-8 space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">Apply to become a Local Agent</h1>
            <p className="text-gray-400 text-sm">Takes 2 minutes · Reviewed within 24 hours · Free</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 sm:p-8">
            <AgentApplicationForm
              destinations={destinations.map((d) => ({ id: d.id, city: d.city, slug: d.slug }))}
              locale={locale}
            />
          </div>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-5">

          {/* What happens next */}
          <div className="bg-gradient-to-br from-primary/8 to-primary/3 border border-primary/10 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">What happens next</h3>
            <ul className="space-y-3">
              {[
                "You submit this form — takes 2 minutes",
                "Our team reviews your application within 24 hours",
                "You receive an approval confirmation",
                "You can start sending booking invitations immediately",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* Key facts */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Key facts</h3>
            <ul className="space-y-3">
              {[
                { icon: Coins,       text: "Commission paid automatically on every booking" },
                { icon: Shield,      text: "Points earned for bookings and partner referrals" },
                { icon: CheckCircle2, text: "1 point = TND 0.50 — redeem as cash anytime" },
                { icon: Clock,       text: "No minimum hours, no monthly fees, commission-only" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Questions */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-2">
            <h3 className="font-semibold text-gray-900">Questions?</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Email us at{" "}
              <a href="mailto:agents@guidni.com" className="text-primary hover:underline">
                agents@guidni.com
              </a>{" "}
              or message us on WhatsApp — we reply within a few hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
