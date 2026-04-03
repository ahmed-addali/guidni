"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createGuideProfile, updateGuideProfile } from "@/lib/actions/partner-guides";

const SPECIALIZATIONS = [
  "culture", "food_drink", "adventures", "nature_wildlife", "water_sports",
  "shopping", "wellness", "family_friendly", "sightseeing", "workshops",
];

const LANGUAGES = ["Arabic", "French", "English", "Spanish", "German", "Italian", "Turkish"];

type Destination = { id: string; city: string; country: string };

type Profile = {
  displayName: string;
  bio: string;
  arabicBio?: string | null;
  tagline?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  specializations: string[];
  languages: string[];
  experienceYears?: number | null;
  country: string;
  destinationId?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
};

type Props = {
  profile: Profile | null;
  destinations: Destination[];
  locale: string;
};

export function GuideProfileForm({ profile, destinations, locale }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    displayName:     profile?.displayName     ?? "",
    bio:             profile?.bio             ?? "",
    arabicBio:       profile?.arabicBio       ?? "",
    tagline:         profile?.tagline         ?? "",
    avatarUrl:       profile?.avatarUrl       ?? "",
    coverUrl:        profile?.coverUrl        ?? "",
    specializations: profile?.specializations ?? [] as string[],
    languages:       profile?.languages       ?? [] as string[],
    experienceYears: profile?.experienceYears?.toString() ?? "",
    country:         profile?.country         ?? "",
    destinationId:   profile?.destinationId   ?? "",
    website:         profile?.website         ?? "",
    instagram:       profile?.instagram       ?? "",
    facebook:        profile?.facebook        ?? "",
    tiktok:          profile?.tiktok          ?? "",
  });

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function toggleArray(field: "specializations" | "languages", value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      displayName:     form.displayName,
      bio:             form.bio,
      arabicBio:       form.arabicBio  || undefined,
      tagline:         form.tagline    || undefined,
      avatarUrl:       form.avatarUrl  || undefined,
      coverUrl:        form.coverUrl   || undefined,
      specializations: form.specializations,
      languages:       form.languages,
      experienceYears: form.experienceYears ? parseInt(form.experienceYears) : undefined,
      country:         form.country,
      destinationId:   form.destinationId || undefined,
      website:         form.website   || undefined,
      instagram:       form.instagram || undefined,
      facebook:        form.facebook  || undefined,
      tiktok:          form.tiktok    || undefined,
    };

    startTransition(async () => {
      const result = profile
        ? await updateGuideProfile(payload)
        : await createGuideProfile(payload);

      if (result.success) {
        toast.success(profile ? "Profile updated" : "Profile created");
        if (!profile && "data" in result) {
          router.push(`/${locale}/partner/guide`);
        }
      } else {
        toast.error("error" in result ? result.error : "Something went wrong");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Identity */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Identity</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input id="displayName" value={form.displayName} onChange={set("displayName")} placeholder="Ahmed from Djerba" maxLength={80} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" value={form.tagline} onChange={set("tagline")} placeholder="Djerba local · 15 years · Culture & Food" maxLength={120} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio (EN) * <span className="text-gray-400 font-normal text-xs">(min 50 chars)</span></Label>
          <Textarea id="bio" value={form.bio} onChange={set("bio")} placeholder="Tell travelers about yourself..." rows={5} maxLength={2000} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="arabicBio">Bio (Arabic)</Label>
          <Textarea id="arabicBio" value={form.arabicBio} onChange={set("arabicBio")} placeholder="نبذة عنك بالعربية..." rows={4} maxLength={2000} dir="rtl" />
        </div>
      </div>

      {/* Images */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Images</h2>
        <div className="space-y-1.5">
          <Label htmlFor="avatarUrl">Profile photo URL</Label>
          <Input id="avatarUrl" type="url" value={form.avatarUrl} onChange={set("avatarUrl")} placeholder="https://..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="coverUrl">Cover photo URL</Label>
          <Input id="coverUrl" type="url" value={form.coverUrl} onChange={set("coverUrl")} placeholder="https://..." />
        </div>
      </div>

      {/* Expertise */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Expertise</h2>

        <div>
          <Label className="mb-2 block">Specializations * <span className="text-gray-400 font-normal text-xs">(select at least one)</span></Label>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleArray("specializations", s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize ${
                  form.specializations.includes(s)
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {s.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">Languages * <span className="text-gray-400 font-normal text-xs">(select at least one)</span></Label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => toggleArray("languages", l)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  form.languages.includes(l)
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="experienceYears">Years of experience</Label>
          <Input id="experienceYears" type="number" min={0} max={50} value={form.experienceYears} onChange={set("experienceYears")} placeholder="e.g. 10" className="w-32" />
        </div>
      </div>

      {/* Location */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Location</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="country">Country *</Label>
            <Input id="country" value={form.country} onChange={set("country")} placeholder="Tunisia" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="destinationId">Primary destination</Label>
            <select
              id="destinationId"
              value={form.destinationId}
              onChange={set("destinationId")}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">— No specific destination —</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.city}, {d.country}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Social links */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 border-b border-gray-100 pb-3">Social Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="website">Website</Label>
            <Input id="website" type="url" value={form.website} onChange={set("website")} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagram">Instagram handle</Label>
            <Input id="instagram" value={form.instagram} onChange={set("instagram")} placeholder="username (no @)" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="facebook">Facebook URL</Label>
            <Input id="facebook" value={form.facebook} onChange={set("facebook")} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tiktok">TikTok handle</Label>
            <Input id="tiktok" value={form.tiktok} onChange={set("tiktok")} placeholder="username (no @)" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="min-w-32">
          {isPending ? "Saving…" : profile ? "Save changes" : "Create profile"}
        </Button>
      </div>
    </form>
  );
}
