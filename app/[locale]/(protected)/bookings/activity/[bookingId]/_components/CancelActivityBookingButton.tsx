"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cancelActivityBooking } from "@/lib/actions/user-bookings";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  bookingId: string;
  locale: string;
  label: string;
  confirmLabel: string;
  cancelLabel: string;
}

export function CancelActivityBookingButton({
  bookingId,
  locale,
  label,
  confirmLabel,
  cancelLabel,
}: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    const result = await cancelActivityBooking(bookingId);
    setLoading(false);
    if (result.success) {
      toast.success("Booking cancelled.");
      router.push(`/${locale}/bookings`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  if (!confirming) {
    return (
      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setConfirming(true)}>
        {label}
      </Button>
    );
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="destructive"
        onClick={handleCancel}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
      </Button>
      <Button variant="outline" onClick={() => setConfirming(false)} disabled={loading}>
        {cancelLabel}
      </Button>
    </div>
  );
}
