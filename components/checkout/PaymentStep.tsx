"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Lock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PaymentMethod, PaymentOption } from "@prisma/client";

interface PaymentChoice {
  option: PaymentOption;
  method: PaymentMethod;
}

interface PaymentStepProps {
  onPrevious: () => void;
  onComplete: (choice: PaymentChoice) => void;
  isLoading: boolean;
  total: number;
}

const PAY_NOW_OPTIONS: { method: PaymentMethod; labelKey: string }[] = [
  { method: "KONNECT", labelKey: "payment.konnect" },
  { method: "CREDIT_CARD", labelKey: "payment.creditCard" },
];

const PAY_LATER_OPTIONS: { method: PaymentMethod; labelKey: string }[] = [
  { method: "CASH", labelKey: "payment.cash" },
];

export function PaymentStep({ onPrevious, onComplete, isLoading, total }: PaymentStepProps) {
  const t = useTranslations("Checkout");
  const [payOption, setPayOption] = useState<PaymentOption>("LATER");
  const [method, setMethod] = useState<PaymentMethod>("CASH");

  const subOptions = payOption === "NOW" ? PAY_NOW_OPTIONS : PAY_LATER_OPTIONS;

  const handleOptionChange = (opt: PaymentOption) => {
    setPayOption(opt);
    setMethod(opt === "NOW" ? "KONNECT" : "CASH");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t("payment.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("payment.subtitle")}</p>
      </div>

      {/* Pay now / pay later toggle */}
      <div className="grid grid-cols-2 gap-3">
        {(["LATER", "NOW"] as PaymentOption[]).map((opt) => (
          <button
            key={opt}
            onClick={() => handleOptionChange(opt)}
            className={cn(
              "border rounded-lg p-4 text-left transition-colors",
              payOption === opt
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-gray-900">
                {t(`payment.${opt === "NOW" ? "payNow" : "payLater"}`)}
              </span>
              {payOption === opt && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t(`payment.${opt === "NOW" ? "payNowDesc" : "payLaterDesc"}`)}
            </p>
          </button>
        ))}
      </div>

      <Separator />

      {/* Payment method sub-options */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{t("payment.chooseMethod")}</p>
        <div className="space-y-2">
          {subOptions.map((opt) => (
            <button
              key={opt.method}
              onClick={() => setMethod(opt.method)}
              className={cn(
                "w-full border rounded-lg p-3 text-left flex items-center justify-between transition-colors",
                method === opt.method
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <span className="text-sm font-medium text-gray-900">
                {t(opt.labelKey)}
              </span>
              {method === opt.method && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Total summary row */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{t("payment.total")}</span>
        <span className="text-lg font-bold text-primary">{total} TND</span>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onPrevious} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t("payment.back")}
        </Button>
        <Button
          onClick={() => onComplete({ option: payOption, method })}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("payment.confirmBooking")
          )}
        </Button>
      </div>

      {/* Trust signal */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Lock className="h-3 w-3" />
        <span>{t("payment.secureBooking")}</span>
      </div>
    </div>
  );
}
