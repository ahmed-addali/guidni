"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiCheck, FiUsers } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label }    from "@/components/ui/label";
import { createReferral } from "@/lib/actions/agent-referrals";

const PARTNER_TYPES = [
  { value: "ACTIVITY",   label: "Activity / Tour operator" },
  { value: "STAY",       label: "Hotel / Villa / Riad" },
  { value: "RESTAURANT", label: "Restaurant / Café" },
  { value: "SHOP",       label: "Shop / Boutique" },
  { value: "TRANSPORT",  label: "Transport / Transfer" },
  { value: "OTHER",      label: "Other" },
];

interface Props {
  locale: string;
}

export function CreateReferralForm({ locale }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    partnerName:  "",
    partnerType:  "",
    partnerPhone: "",
    partnerEmail: "",
    partnerCity:  "",
    agentNote:    "",
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.partnerName.trim()) errs.partnerName = "Partner name is required";
    if (!form.partnerType)        errs.partnerType  = "Select a business category";
    if (!form.partnerPhone && !form.partnerEmail)
      errs.partnerPhone = "Provide at least a phone number or email";
    if (form.partnerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.partnerEmail))
      errs.partnerEmail = "Enter a valid email";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const res = await createReferral({
        partnerName:  form.partnerName,
        partnerType:  form.partnerType,
        partnerPhone: form.partnerPhone || undefined,
        partnerEmail: form.partnerEmail || undefined,
        partnerCity:  form.partnerCity  || undefined,
        agentNote:    form.agentNote    || undefined,
      });

      if (res.success) {
        setSubmitted(true);
        toast.success("Referral submitted!");
      } else {
        toast.error(res.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-8">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <FiCheck className="h-7 w-7 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Referral submitted!</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Our team will contact <span className="font-semibold">{form.partnerName}</span> within 48 hours.
          You&apos;ll earn points as they progress through the partner journey.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => {
              setSubmitted(false);
              setForm({ partnerName: "", partnerType: "", partnerPhone: "", partnerEmail: "", partnerCity: "", agentNote: "" });
            }}
          >
            Refer another
          </Button>
          <Button
            type="button"
            className="bg-primary text-white rounded-xl hover:bg-primary/90"
            onClick={() => router.push(`/${locale}/agent/referrals`)}
          >
            View all referrals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Partner name */}
      <div className="space-y-1.5">
        <Label htmlFor="partnerName">Business name <span className="text-red-500">*</span></Label>
        <Input
          id="partnerName"
          placeholder="e.g. Djerba Dive Center"
          value={form.partnerName}
          onChange={(e) => set("partnerName", e.target.value)}
          className={errors.partnerName ? "border-red-300" : ""}
        />
        {errors.partnerName && <p className="text-xs text-red-500">{errors.partnerName}</p>}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label htmlFor="partnerType">Business category <span className="text-red-500">*</span></Label>
        <select
          id="partnerType"
          value={form.partnerType}
          onChange={(e) => set("partnerType", e.target.value)}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white ${
            errors.partnerType ? "border-red-300" : "border-gray-200"
          }`}
        >
          <option value="">Select a category…</option>
          {PARTNER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        {errors.partnerType && <p className="text-xs text-red-500">{errors.partnerType}</p>}
      </div>

      {/* Contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="partnerPhone">Phone / WhatsApp</Label>
          <Input
            id="partnerPhone"
            type="tel"
            placeholder="+216 XX XXX XXX"
            value={form.partnerPhone}
            onChange={(e) => set("partnerPhone", e.target.value)}
            className={errors.partnerPhone ? "border-red-300" : ""}
          />
          {errors.partnerPhone && <p className="text-xs text-red-500">{errors.partnerPhone}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="partnerEmail">Email</Label>
          <Input
            id="partnerEmail"
            type="email"
            placeholder="owner@business.com"
            value={form.partnerEmail}
            onChange={(e) => set("partnerEmail", e.target.value)}
            className={errors.partnerEmail ? "border-red-300" : ""}
          />
          {errors.partnerEmail && <p className="text-xs text-red-500">{errors.partnerEmail}</p>}
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-3">Provide at least one of the two.</p>

      {/* City */}
      <div className="space-y-1.5">
        <Label htmlFor="partnerCity">
          City <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </Label>
        <Input
          id="partnerCity"
          placeholder="e.g. Djerba"
          value={form.partnerCity}
          onChange={(e) => set("partnerCity", e.target.value)}
        />
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <Label htmlFor="agentNote">
          Your note <span className="text-gray-400 font-normal text-xs">(optional, seen by admin)</span>
        </Label>
        <Textarea
          id="agentNote"
          placeholder="e.g. Met the owner at the marina — very interested in joining Guidni as a dive tour operator."
          value={form.agentNote}
          onChange={(e) => set("agentNote", e.target.value)}
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-gray-400 text-right">{form.agentNote.length} / 500</p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary/90 transition-colors"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <FiUsers className="h-4 w-4" />
            Submit referral
          </span>
        )}
      </Button>

    </form>
  );
}
