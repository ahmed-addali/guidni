import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getUserPlans } from "@/lib/actions/planner";
import { PlanCard } from "./PlanCard";

type Props = {
  locale: string;
};

export async function SavedPlansStrip({ locale }: Props) {
  const plans = await getUserPlans();
  if (plans.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-100 pt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Your saved plans</h2>
          <p className="text-xs text-gray-400 mt-0.5">{plans.length} plan{plans.length !== 1 ? "s" : ""} saved</p>
        </div>
        <Link
          href={`/${locale}/planner`}
          className="flex items-center gap-1 text-xs text-primary font-medium hover:opacity-80 transition-opacity"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} locale={locale} />
        ))}
      </div>
    </section>
  );
}
