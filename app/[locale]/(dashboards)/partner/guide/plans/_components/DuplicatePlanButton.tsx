"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiCopy } from "react-icons/fi";
import { duplicateGuidePlan } from "@/lib/actions/partner-guides";

type Props = { planId: string; locale: string };

export function DuplicatePlanButton({ planId, locale }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    const result = await duplicateGuidePlan(planId);
    setLoading(false);

    if (result.success) {
      toast.success("Plan duplicated — editing copy now");
      router.push(`/${locale}/planner/${result.newPlanId}/edit`);
    } else {
      toast.error("error" in result ? result.error : "Duplication failed");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDuplicate}
      disabled={loading}
      className="p-1.5 text-gray-400 hover:text-primary transition-colors disabled:opacity-50"
      title="Duplicate plan"
    >
      <FiCopy className="h-4 w-4" />
    </button>
  );
}
