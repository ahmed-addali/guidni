"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { completePlanPurchase } from "@/lib/actions/plan-purchases";

type Props = { planId: string };

/**
 * Handles the return from the payment page.
 * Reads ?session_id=xxx&purchased=true, calls completePlanPurchase to fulfill the order,
 * then cleans up the URL. This is the "success_url handler" equivalent in the Stripe flow.
 */
export function PurchaseSuccessBanner({ planId }: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const handled = useRef(false);

  const sessionId = searchParams.get("session_id");
  const purchased = searchParams.get("purchased");

  useEffect(() => {
    if (!sessionId || purchased !== "true" || handled.current) return;
    handled.current = true;

    completePlanPurchase(sessionId).then((result) => {
      if (result.success) {
        if (!result.alreadyDone) {
          toast.success("Plan unlocked! Full itinerary is now available.", {
            duration: 5000,
          });
        }
      } else {
        toast.error(result.error ?? "Could not complete purchase");
      }
      // Clean the URL — remove session_id and purchased params
      router.replace(pathname);
    });
  }, [sessionId, purchased, pathname, router]);

  return null; // no visual — uses toast
}
