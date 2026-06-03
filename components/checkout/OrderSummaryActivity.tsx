import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FiCalendar, FiClock, FiUsers } from "react-icons/fi";
import { CheckCircle, XCircle } from "lucide-react";
import { TAXES, SERVICE_FEE } from "@/lib/constants/payments";

const LOCALE_MAP: Record<string, string> = { en: "en-GB", fr: "fr-FR", ar: "ar-TN" };

interface ActivitySummaryProps {
  title: string;
  coverImageUrl?: string;
  price: number;
  date: string;
  time: string;
  adults: number;
  children: number;
  cancelation: boolean;
  locale: string;
  labels: {
    adults: string;
    children: string;
    taxes: string;
    serviceFee: string;
    total: string;
    totalNote: string;
    perPerson: string;
    freeCancel: string;
    nonRefundable: string;
  };
}

export function OrderSummaryActivity({
  title,
  coverImageUrl,
  price,
  date,
  time,
  adults,
  children,
  cancelation,
  locale,
  labels,
}: ActivitySummaryProps) {
  const subtotal = (adults + children) * price;
  const total = subtotal + TAXES + SERVICE_FEE;

  const displayDate = new Date(date).toLocaleDateString(LOCALE_MAP[locale] ?? "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Card>
      {coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt={title}
          className="w-full h-44 object-cover rounded-t-lg"
        />
      )}
      <CardContent className="p-5 space-y-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <FiCalendar className="h-4 w-4 shrink-0" />
            <span>{displayDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiClock className="h-4 w-4 shrink-0" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiUsers className="h-4 w-4 shrink-0" />
            <span>
              {adults} {labels.adults}
              {children > 0 ? `, ${children} ${labels.children}` : ""}
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>
              {adults + children} × {price} TND {labels.perPerson}
            </span>
            <span>{subtotal} TND</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{labels.taxes}</span>
            <span>{TAXES} TND</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>{labels.serviceFee}</span>
            <span>{SERVICE_FEE} TND</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between items-end">
          <div>
            <p className="font-semibold text-gray-900">{labels.total}</p>
            <p className="text-xs text-gray-400">{labels.totalNote}</p>
          </div>
          <span className="text-xl font-bold text-primary">{total} TND</span>
        </div>

        {/* Cancellation policy */}
        <div className={`flex items-center gap-1.5 text-xs font-medium ${cancelation ? "text-green-600" : "text-red-500"}`}>
          {cancelation ? (
            <CheckCircle className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          <span>{cancelation ? labels.freeCancel : labels.nonRefundable}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Export the computed total so parent components can pass it to PaymentStep
export function computeActivityTotal(price: number, adults: number, children: number): number {
  return (adults + children) * price + TAXES + SERVICE_FEE;
}
