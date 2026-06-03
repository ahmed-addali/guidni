"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label }    from "@/components/ui/label";
import { updateAgentProfile } from "@/lib/actions/agent";

interface Props {
  profile: {
    id:          string;
    displayName: string;
    pseudonym:   string | null;
    phone:       string;
    country:     string;
    city:        string;
    bio:         string | null;
  };
}

export function AgentProfileForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    displayName: profile.displayName,
    pseudonym:   profile.pseudonym ?? "",
    phone:       profile.phone,
    country:     profile.country,
    city:        profile.city,
    bio:         profile.bio ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.displayName || form.displayName.length < 2)
      errs.displayName = "Name must be at least 2 characters";
    if (!form.phone || form.phone.length < 8)
      errs.phone = "Enter a valid phone number";
    if (!form.country) errs.country = "Country is required";
    if (!form.city)    errs.city    = "City is required";
    if (form.pseudonym && !/^[a-zA-Z0-9_]+$/.test(form.pseudonym))
      errs.pseudonym = "Only letters, numbers, and underscores allowed";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const result = await updateAgentProfile({
        displayName: form.displayName,
        pseudonym:   form.pseudonym || undefined,
        phone:       form.phone,
        country:     form.country,
        city:        form.city,
        bio:         form.bio || undefined,
      });

      if (result.success) {
        toast.success("Profile updated");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Full name <span className="text-red-500">*</span></Label>
        <Input
          id="displayName"
          value={form.displayName}
          onChange={(e) => set("displayName", e.target.value)}
          className={errors.displayName ? "border-red-300" : ""}
        />
        {errors.displayName && <p className="text-xs text-red-500">{errors.displayName}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pseudonym">
          Public pseudonym{" "}
          <span className="text-gray-400 font-normal text-xs">(optional)</span>
        </Label>
        <Input
          id="pseudonym"
          placeholder="e.g. local_fares"
          value={form.pseudonym}
          onChange={(e) => set("pseudonym", e.target.value)}
          className={errors.pseudonym ? "border-red-300" : ""}
        />
        {errors.pseudonym && <p className="text-xs text-red-500">{errors.pseudonym}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="phone">Phone / WhatsApp <span className="text-red-500">*</span></Label>
        <Input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          className={errors.phone ? "border-red-300" : ""}
        />
        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="country">Country <span className="text-red-500">*</span></Label>
          <Input
            id="country"
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            className={errors.country ? "border-red-300" : ""}
          />
          {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City <span className="text-red-500">*</span></Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            className={errors.city ? "border-red-300" : ""}
          />
          {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">
          About you{" "}
          <span className="text-gray-400 font-normal text-xs">(optional, max 300 chars)</span>
        </Label>
        <Textarea
          id="bio"
          value={form.bio}
          onChange={(e) => set("bio", e.target.value)}
          rows={3}
          maxLength={300}
        />
        <p className="text-xs text-gray-400 text-right">{form.bio.length} / 300</p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-white rounded-xl py-2.5 font-semibold hover:bg-primary/90 transition-colors"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </span>
        ) : "Save changes"}
      </Button>
    </form>
  );
}
