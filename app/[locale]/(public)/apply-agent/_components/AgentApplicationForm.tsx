"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label }    from "@/components/ui/label";
import { applyAsAgent } from "@/lib/actions/agent";
import type { AgentApplicationInput } from "@/lib/validations/agent";

interface Destination {
  id:   string;
  city: string;
  slug: string;
}

interface Props {
  destinations: Destination[];
  locale: string;
}

export function AgentApplicationForm({ destinations, locale }: Props) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState<AgentApplicationInput>({
    displayName:   "",
    pseudonym:     "",
    phone:         "",
    country:       "Tunisia",
    city:          "",
    bio:           "",
    touchPoint:    "",
    destinationId: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AgentApplicationInput, string>>>({});

  function handleChange(field: keyof AgentApplicationInput, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: typeof errors = {};
    if (!form.displayName || form.displayName.length < 2) newErrors.displayName = "Name must be at least 2 characters";
    if (!form.phone || form.phone.length < 8) newErrors.phone = "Enter a valid phone number";
    if (!form.country) newErrors.country = "Country is required";
    if (!form.city) newErrors.city = "City is required";
    if (!form.touchPoint || form.touchPoint.length < 10) newErrors.touchPoint = "Please describe how you interact with tourists (min 10 characters)";
    if (form.pseudonym && form.pseudonym.length > 0) {
      if (form.pseudonym.length < 3) newErrors.pseudonym = "Pseudonym must be at least 3 characters";
      else if (!/^[a-zA-Z0-9_]+$/.test(form.pseudonym)) newErrors.pseudonym = "Only letters, numbers, and underscores allowed";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const result = await applyAsAgent(form);
      if (result.success) {
        setSubmitted(true);
      } else {
        toast.error(result.error);
      }
    });
  }

  if (submitted) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Application received!</h2>
        <p className="text-gray-500 max-w-sm mx-auto">
          Our team will review your application within 24 hours. You&apos;ll receive a confirmation once you&apos;re approved.
        </p>
        <p className="text-sm text-gray-400">You can close this page.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Full name <span className="text-red-500">*</span></Label>
        <Input
          id="displayName"
          placeholder="e.g. Fares Benhassine"
          value={form.displayName}
          onChange={(e) => handleChange("displayName", e.target.value)}
          className={errors.displayName ? "border-red-300" : ""}
        />
        {errors.displayName && <p className="text-xs text-red-500">{errors.displayName}</p>}
      </div>

      {/* Pseudonym */}
      <div className="space-y-1.5">
        <Label htmlFor="pseudonym">
          Public pseudonym{" "}
          <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </Label>
        <Input
          id="pseudonym"
          placeholder="e.g. local_fares"
          value={form.pseudonym ?? ""}
          onChange={(e) => handleChange("pseudonym", e.target.value)}
          className={errors.pseudonym ? "border-red-300" : ""}
        />
        <p className="text-xs text-gray-400">
          This is your anonymous public username — shown on invitations and the agent leaderboard instead of your real name.
          Letters, numbers, and underscores only.
        </p>
        {errors.pseudonym && <p className="text-xs text-red-500">{errors.pseudonym}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone / WhatsApp <span className="text-red-500">*</span></Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+216 XX XXX XXX"
          value={form.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          className={errors.phone ? "border-red-300" : ""}
        />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
      </div>

      {/* Country + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
          <Input
            id="country"
            placeholder="Tunisia"
            value={form.country}
            onChange={(e) => handleChange("country", e.target.value)}
            className={errors.country ? "border-red-300" : ""}
          />
          {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
          <Input
            id="city"
            placeholder="Djerba"
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className={errors.city ? "border-red-300" : ""}
          />
          {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
        </div>
      </div>

      {/* Primary destination */}
      {destinations.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="destinationId">
            Primary destination{" "}
            <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </Label>
          <select
            id="destinationId"
            value={form.destinationId ?? ""}
            onChange={(e) => handleChange("destinationId", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
          >
            <option value="">Select your main destination</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>{d.city}</option>
            ))}
          </select>
          <p className="text-xs text-gray-400">The destination where you mainly work with tourists.</p>
        </div>
      )}

      {/* Short bio */}
      <div className="space-y-1.5">
        <Label htmlFor="bio">
          About you{" "}
          <span className="text-gray-400 font-normal text-xs">(optional, max 300 chars)</span>
        </Label>
        <Textarea
          id="bio"
          placeholder="Tell us a bit about yourself — your background, how long you've worked in tourism, etc."
          value={form.bio ?? ""}
          onChange={(e) => handleChange("bio", e.target.value)}
          rows={3}
          maxLength={300}
        />
        <p className="text-xs text-gray-400 text-right">{(form.bio ?? "").length} / 300</p>
      </div>

      {/* How do you meet tourists */}
      <div className="space-y-1.5">
        <Label htmlFor="touchPoint">
          How do you interact with tourists daily? <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="touchPoint"
          placeholder="e.g. I work at a beach club in Djerba and I talk to 20–30 tourists every day. I always help them find things to do on the island."
          value={form.touchPoint}
          onChange={(e) => handleChange("touchPoint", e.target.value)}
          rows={4}
          className={errors.touchPoint ? "border-red-300" : ""}
        />
        <p className="text-xs text-gray-400">
          This helps us understand your context and approve your application faster.
        </p>
        {errors.touchPoint && <p className="text-xs text-red-500">{errors.touchPoint}</p>}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary/90 transition-colors"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting application...
          </span>
        ) : (
          "Submit application"
        )}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        By applying you agree to our{" "}
        <a href={`/${locale}/terms`} className="underline hover:text-gray-600">Terms of Service</a>
        {" "}and{" "}
        <a href={`/${locale}/privacy`} className="underline hover:text-gray-600">Privacy Policy</a>.
      </p>
    </form>
  );
}
