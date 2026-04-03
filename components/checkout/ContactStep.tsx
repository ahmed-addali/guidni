"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ContactSchema, type ContactFormData } from "@/lib/validations/contact";
import { ArrowRight, Info, Loader2 } from "lucide-react";

interface ContactStepProps {
  initialData: ContactFormData;
  onNext: (data: ContactFormData) => void;
}

export function ContactStep({ initialData, onNext }: ContactStepProps) {
  const t = useTranslations("Checkout");
  const [form, setForm] = useState<ContactFormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    const result = ContactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        phone: fieldErrors.phone?.[0],
      });
      return;
    }
    setErrors({});
    setLoading(true);
    // Optionally update phone in DB if changed
    setLoading(false);
    onNext(form);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t("contact.title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("contact.subtitle")}</p>
        <div className="flex items-start gap-1.5 mt-2">
          <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500">{t("contact.infoNote")}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">{t("contact.name")}</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("contact.namePlaceholder")}
          />
          {errors.name && (
            <p className="text-sm text-red-500">{errors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{t("contact.email")}</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder={t("contact.emailPlaceholder")}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">{t("contact.phone")}</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder={t("contact.phonePlaceholder")}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t("contact.next")}
              <ArrowRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
