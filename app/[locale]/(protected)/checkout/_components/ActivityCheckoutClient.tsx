"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, ArrowLeft, CheckCircle, XCircle, Mail, Phone, QrCode, Copy, Check } from "lucide-react";
import { StepIndicator } from "@/components/checkout/StepIndicator";
import { ContactStep } from "@/components/checkout/ContactStep";
import { PaymentStep } from "@/components/checkout/PaymentStep";
import { OrderSummaryActivity, computeActivityTotal } from "@/components/checkout/OrderSummaryActivity";
import { ActivityMiniSummaryBar } from "@/components/checkout/MiniSummaryBar";
import { createActivityReservation } from "@/lib/actions/bookings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import type { ContactFormData } from "@/lib/validations/contact";
import type { PaymentMethod, PaymentOption } from "@prisma/client";

interface ActivityInfo {
  id: string;
  slug: string;
  title: string;
  price: number;
  cancelation: boolean;
  coverImageUrl?: string;
}

interface Labels {
  title: string;
  backTo: string;
  orderSummary: string;
  contact: Record<string, string>;
  payment: Record<string, string>;
  summary: {
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
  miniSummary: {
    adults: string;
    children: string;
    perPerson: string;
    taxes: string;
    serviceFee: string;
    total: string;
  };
  steps: { contact: string; payment: string };
  success: string;
  successWhatsNext: string;
  successStep1: string;
  successStep2: string;
  successStep3: string;
  successBookingRef: string;
  successCopied: string;
  error: string;
  goBack: string;
  bookAnother: string;
  viewBookings: string;
}

interface Props {
  activity:   ActivityInfo;
  date:       string;
  time:       string;
  adults:     number;
  children:   number;
  agentToken?: string;
  user:       { name: string; email: string; phone: string };
  locale:     string;
  labels:     Labels;
}

type Step = 1 | 2 | 3;

export function ActivityCheckoutClient({
  activity,
  date,
  time,
  adults,
  children,
  agentToken,
  user,
  locale,
  labels,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [contact, setContact] = useState<ContactFormData>({
    name: user.name,
    email: user.email,
    phone: user.phone,
  });
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId]   = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [failed, setFailed]         = useState(false);
  const [copied, setCopied]         = useState(false);

  const total = computeActivityTotal(activity.price, adults, children);

  const steps = [
    { id: 1, title: labels.steps.contact },
    { id: 2, title: labels.steps.payment },
  ];

  const handleComplete = async ({
    option,
    method,
  }: {
    option: PaymentOption;
    method: PaymentMethod;
  }) => {
    setLoading(true);
    setFailed(false);
    const result = await createActivityReservation({
      activityId: activity.id,
      date,
      time,
      adults,
      children,
      paymentOption: option,
      paymentMethod: method,
      agentToken,
    });
    setLoading(false);

    if (result.success && result.data) {
      setBookingId(result.data.id);
      setBookingRef(result.data.bookingRef);
      setStep(3);
      toast.success(labels.success);
    } else {
      setFailed(true);
      toast.error(result.error ?? labels.error);
    }
  };

  const handleCopyRef = async () => {
    if (!bookingRef) return;
    await navigator.clipboard.writeText(bookingRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Success / Error state ────────────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="max-w-lg mx-auto py-12 space-y-6">
        {bookingId && !failed ? (
          <>
            <Card>
              <CardContent className="p-8 text-center space-y-5">
                {/* Checkmark */}
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-50 p-4 w-fit">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-900">{labels.success}</h2>

                {/* Booking ref pill */}
                {bookingRef && (
                  <div className="flex items-center justify-center gap-2">
                    <div className="bg-gray-100 rounded-full px-4 py-1.5 text-sm font-mono font-semibold text-gray-700">
                      {bookingRef}
                    </div>
                    <button
                      onClick={handleCopyRef}
                      className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      title={labels.successCopied}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-gray-400" />
                      )}
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <Button onClick={() => router.push(`/${locale}/bookings`)}>
                    {labels.viewBookings}
                  </Button>
                  <button
                    onClick={() => router.push(`/${locale}/activities`)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {labels.bookAnother}
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* What happens next */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">{labels.successWhatsNext}</p>
              <div className="space-y-3">
                {[
                  { icon: Mail,  text: labels.successStep1 },
                  { icon: Phone, text: labels.successStep2 },
                  { icon: QrCode, text: labels.successStep3 },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <Icon className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-center space-y-5">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-50 p-4 w-fit">
                  <XCircle className="h-12 w-12 text-red-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-gray-900">{labels.error}</h2>
              <Button onClick={() => { setStep(2); setFailed(false); }}>
                {labels.goBack}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ── Main checkout layout ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/${locale}/activities/${activity.slug}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {labels.backTo} {activity.title}
      </Link>

      {/* Title */}
      <div className="flex items-center gap-3">
        <CalendarCheck className="h-6 w-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">{labels.title}</h1>
      </div>

      {/* Mobile sticky mini-summary */}
      <ActivityMiniSummaryBar
        title={activity.title}
        coverImageUrl={activity.coverImageUrl}
        price={activity.price}
        date={date}
        time={time}
        adults={adults}
        children={children}
        locale={locale}
        labels={labels.miniSummary}
      />

      <StepIndicator steps={steps} currentStep={step} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Left: step forms */}
        <div>
          <Card className="p-6">
            {step === 1 && (
              <ContactStep
                initialData={contact}
                onNext={(data) => {
                  setContact(data);
                  setStep(2);
                }}
              />
            )}
            {step === 2 && (
              <PaymentStep
                onPrevious={() => setStep(1)}
                onComplete={handleComplete}
                isLoading={loading}
                total={total}
              />
            )}
          </Card>
        </div>

        {/* Right: order summary (shows above form on mobile via order) */}
        <div className="order-first lg:order-last">
          <p className="text-lg font-semibold text-gray-900 mb-3">
            {labels.orderSummary}
          </p>
          <OrderSummaryActivity
            title={activity.title}
            coverImageUrl={activity.coverImageUrl}
            price={activity.price}
            date={date}
            time={time}
            adults={adults}
            children={children}
            cancelation={activity.cancelation}
            locale={locale}
            labels={labels.summary}
          />
        </div>
      </div>
    </div>
  );
}
