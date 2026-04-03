"use client";

import { Button } from "@/components/ui/button";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";

export function ScrollToBookingButton({ label }: { label: string }) {
  return (
    <Button
      className="w-full gap-2 rounded-full"
      onClick={() =>
        document
          .getElementById("booking-section")
          ?.scrollIntoView({ behavior: "smooth" })
      }
    >
      <IoMdCheckmarkCircleOutline className="h-4 w-4" />
      {label}
    </Button>
  );
}
