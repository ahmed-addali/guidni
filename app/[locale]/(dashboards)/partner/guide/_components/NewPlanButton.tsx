"use client";

import { useState } from "react";
import { NewGuidePlanModal } from "@/components/partner/NewGuidePlanModal";

interface Destination {
  id:      string;
  city:    string;
  country: string;
}

interface Props {
  locale:               string;
  destinations:         Destination[];
  defaultDestinationId?: string;
  label?:               string;
  className?:           string;
}

export function NewPlanButton({
  locale,
  destinations,
  defaultDestinationId,
  label = "+ New Plan",
  className = "inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>

      {open && (
        <NewGuidePlanModal
          locale={locale}
          destinations={destinations}
          defaultDestinationId={defaultDestinationId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
