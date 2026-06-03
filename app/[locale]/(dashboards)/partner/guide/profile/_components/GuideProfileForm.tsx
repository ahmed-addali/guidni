"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SingleImageUploader } from "@/components/upload/SingleImageUploader";
import { createGuideProfile, updateGuideProfile, updateGuideChatEnabled } from "@/lib/actions/partner-guides";
import { MessageCircle } from "lucide-react";
import {
  FiGlobe, FiInstagram, FiFacebook, FiArrowLeft, FiExternalLink,
} from "react-icons/fi";
import { SiTiktok } from "react-icons/si";

/* ── Constants ────────────────────────────────────────────────────────────── */

const SPECIALIZATIONS: { id: string; label: string }[] = [
  { id: "culture",         label: "Culture & History" },
  { id: "food_drink",      label: "Food & Drink"      },
  { id: "adventures",      label: "Adventures"        },
  { id: "nature_wildlife", label: "Nature"            },
  { id: "water_sports",    label: "Water Sports"      },
  { id: "shopping",        label: "Shopping"          },
  { id: "wellness",        label: "Wellness"          },
  { id: "family_friendly", label: "Family-friendly"   },
  { id: "sightseeing",     label: "Sightseeing"       },
  { id: "workshops",       label: "Workshops"         },
];

const LANGUAGES = ["Arabic", "French", "English", "Spanish", "German", "Italian", "Turkish"];

/* ── Types ───────────────────────────────────────────────────────────────── */

type Destination = { id: string; city: string; country: string };

type Profile = {
  id?:              string;
  slug?:            string;
  displayName:      string;
  bio:              string;
  arabicBio?:       string | null;
  tagline?:         string | null;
  avatarUrl?:       string | null;
  coverUrl?:        string | null;
  specializations:  string[];
  languages:        string[];
  experienceYears?: number | null;
  country:          string;
  destinationId?:   string | null;
  website?:         string | null;
  instagram?:       string | null;
  facebook?:        string | null;
  tiktok?:          string | null;
  chatEnabled?:     boolean;
};

type Props = {
  profile:      (Profile & { id?: string }) | null;
  destinations: Destination[];
  locale:       string;
};

/* ── Sub-components ──────────────────────────────────────────────────────── */

function SectionCard({ title, description, children }: {
  title:       string;
  description?: string;
  children:    React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-5">
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ htmlFor, children, hint }: {
  htmlFor?: string;
  children: React.ReactNode;
  hint?:    string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-baseline justify-between mb-1.5"
    >
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {children}
      </span>
      {hint && <span className="text-xs text-gray-400 font-normal normal-case">{hint}</span>}
    </label>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const near = len > max * 0.85;
  return (
    <span className={`text-xs ${near ? (len >= max ? "text-red-500" : "text-amber-500") : "text-gray-400"}`}>
      {len}/{max}
    </span>
  );
}

function inputCls(error?: boolean) {
  return `w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
    error
      ? "border-red-300 focus:ring-red-100"
      : "border-gray-200 focus:ring-primary/15 focus:border-primary/40"
  }`;
}

function SocialInput({
  id, value, onChange, placeholder, icon: Icon, prefix,
}: {
  id:          string;
  value:       string;
  onChange:    (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  icon:        React.ElementType;
  prefix?:     string;
}) {
  return (
    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/15 focus-within:border-primary/40 transition-colors">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border-r border-gray-200 shrink-0">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        {prefix && <span className="text-xs text-gray-400">{prefix}</span>}
      </div>
      <input
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="flex-1 px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none bg-white"
      />
    </div>
  );
}

/* ── Main form ───────────────────────────────────────────────────────────── */

export function GuideProfileForm({ profile, destinations, locale }: Props) {
  const router = useRouter();
  const [isPending, startTransition]           = useTransition();
  const [isChatPending, startChatTransition]   = useTransition();
  const [chatEnabled, setChatEnabled]          = useState(profile?.chatEnabled ?? true);

  const isEdit = !!profile;

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
      const result = isEdit
        ? await updateGuideProfile(payload)
        : await createGuideProfile(payload);

      if (result.success) {
        toast.success(isEdit ? "Profile updated" : "Profile created! Set up your photos next.");
        if (!isEdit && "data" in result) {
          router.push(`/${locale}/partner/guide`);
        }
      } else {
        toast.error("error" in result ? result.error : "Something went wrong");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Identity ─────────────────────────────────────────────── */}
      <SectionCard
        title="Identity"
        description="How you appear to travelers on your public guide profile."
      >
        {/* Display name + tagline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <FieldLabel htmlFor="displayName">Display name <span className="text-red-400">*</span></FieldLabel>
              <CharCount value={form.displayName} max={80} />
            </div>
            <input
              id="displayName"
              value={form.displayName}
              onChange={set("displayName")}
              placeholder="Ahmed from Djerba"
              maxLength={80}
              required
              className={inputCls()}
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <FieldLabel htmlFor="tagline">Tagline</FieldLabel>
              <CharCount value={form.tagline} max={120} />
            </div>
            <input
              id="tagline"
              value={form.tagline}
              onChange={set("tagline")}
              placeholder="Djerba local · 15 years · Culture & Food"
              maxLength={120}
              className={inputCls()}
            />
          </div>
        </div>

        {/* Bio EN */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <FieldLabel htmlFor="bio">Bio (English) <span className="text-red-400">*</span></FieldLabel>
            <CharCount value={form.bio} max={2000} />
          </div>
          <textarea
            id="bio"
            value={form.bio}
            onChange={set("bio")}
            placeholder="Tell travelers about yourself, your expertise, and what makes your plans special..."
            rows={5}
            maxLength={2000}
            required
            className={`${inputCls()} resize-none`}
          />
          <p className="text-xs text-gray-400 mt-1.5">Minimum 50 characters. This is your main pitch — make it personal.</p>
        </div>

        {/* Bio AR */}
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <FieldLabel htmlFor="arabicBio">Bio (Arabic)</FieldLabel>
            <CharCount value={form.arabicBio} max={2000} />
          </div>
          <textarea
            id="arabicBio"
            value={form.arabicBio}
            onChange={set("arabicBio")}
            placeholder="نبذة عنك بالعربية..."
            rows={4}
            maxLength={2000}
            dir="rtl"
            className={`${inputCls()} resize-none`}
          />
        </div>
      </SectionCard>

      {/* ── Photos ───────────────────────────────────────────────── */}
      <SectionCard
        title="Photos"
        description="A great profile photo and cover image significantly increase traveler trust."
      >
        {profile?.id ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <SingleImageUploader
              entity="guide-profile"
              entityId={profile.id}
              value={form.avatarUrl}
              onChange={(url) => setForm((p) => ({ ...p, avatarUrl: url }))}
              label="Profile photo"
              aspect="aspect-square"
              placeholder="Upload your profile photo"
            />
            <SingleImageUploader
              entity="guide-profile"
              entityId={profile.id}
              value={form.coverUrl}
              onChange={(url) => setForm((p) => ({ ...p, coverUrl: url }))}
              label="Cover photo"
              aspect="aspect-video"
              placeholder="Upload a cover photo"
            />
          </div>
        ) : (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3.5">
            <span className="text-amber-500 text-base mt-0.5 shrink-0">ℹ</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Save your profile first</p>
              <p className="text-xs text-amber-700 mt-0.5">Photo upload will be available after your profile is created.</p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── Expertise ────────────────────────────────────────────── */}
      <SectionCard
        title="Expertise"
        description="Help travelers find you by what you know best."
      >
        {/* Specializations */}
        <div>
          <FieldLabel hint="select at least one">
            Specializations <span className="text-red-400">*</span>
          </FieldLabel>
          <div className="flex flex-wrap gap-2">
            {SPECIALIZATIONS.map(({ id, label }) => {
              const active = form.specializations.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleArray("specializations", id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Languages */}
        <div>
          <FieldLabel hint="select at least one">
            Languages <span className="text-red-400">*</span>
          </FieldLabel>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => {
              const active = form.languages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleArray("languages", lang)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    active
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* Years of experience */}
        <div className="max-w-[180px]">
          <FieldLabel htmlFor="experienceYears">Years of experience</FieldLabel>
          <input
            id="experienceYears"
            type="number"
            min={0}
            max={50}
            value={form.experienceYears}
            onChange={set("experienceYears")}
            placeholder="e.g. 10"
            className={inputCls()}
          />
        </div>
      </SectionCard>

      {/* ── Location ─────────────────────────────────────────────── */}
      <SectionCard
        title="Location"
        description="Where you operate and which destination you cover most."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="country">Country <span className="text-red-400">*</span></FieldLabel>
            <input
              id="country"
              value={form.country}
              onChange={set("country")}
              placeholder="Tunisia"
              required
              className={inputCls()}
            />
          </div>
          <div>
            <FieldLabel htmlFor="destinationId">Primary destination</FieldLabel>
            <select
              id="destinationId"
              value={form.destinationId}
              onChange={set("destinationId")}
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-colors bg-white"
            >
              <option value="">— No specific destination —</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>{d.city}, {d.country}</option>
              ))}
            </select>
          </div>
        </div>
      </SectionCard>

      {/* ── Social links ─────────────────────────────────────────── */}
      <SectionCard
        title="Social Links"
        description="Optional — adds credibility and lets travelers follow your work."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="website">Website</FieldLabel>
            <SocialInput
              id="website"
              value={form.website}
              onChange={set("website")}
              placeholder="yoursite.com"
              icon={FiGlobe}
            />
          </div>
          <div>
            <FieldLabel htmlFor="instagram">Instagram</FieldLabel>
            <SocialInput
              id="instagram"
              value={form.instagram}
              onChange={set("instagram")}
              placeholder="username"
              icon={FiInstagram}
              prefix="@"
            />
          </div>
          <div>
            <FieldLabel htmlFor="facebook">Facebook</FieldLabel>
            <SocialInput
              id="facebook"
              value={form.facebook}
              onChange={set("facebook")}
              placeholder="facebook.com/yourpage"
              icon={FiFacebook}
            />
          </div>
          <div>
            <FieldLabel htmlFor="tiktok">TikTok</FieldLabel>
            <SocialInput
              id="tiktok"
              value={form.tiktok}
              onChange={set("tiktok")}
              placeholder="username"
              icon={SiTiktok}
              prefix="@"
            />
          </div>
        </div>
      </SectionCard>

      {/* ── Chat settings ────────────────────────────────────────── */}
      {isEdit && (
        <SectionCard
          title="Chat settings"
          description="Control whether travelers can message you directly."
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Allow traveler messages</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  When enabled, travelers who purchased your plans or sent a custom request can chat with you directly.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isChatPending}
              onClick={() => {
                const next = !chatEnabled;
                setChatEnabled(next);
                startChatTransition(async () => {
                  const res = await updateGuideChatEnabled(next);
                  if (!res.success) {
                    setChatEnabled(!next);
                    toast.error("Failed to update chat setting");
                  } else {
                    toast.success(next ? "Chat enabled" : "Chat disabled");
                  }
                });
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                chatEnabled ? "bg-primary" : "bg-gray-200"
              }`}
              role="switch"
              aria-checked={chatEnabled}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ${
                  chatEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </SectionCard>
      )}

      {/* ── Action bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <button
          type="button"
          onClick={() => router.push(`/${locale}/partner/guide`)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <div className="flex items-center gap-3">
          {isEdit && profile?.slug && (
            <a
              href={`/${locale}/planner/guides/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-xl hover:border-gray-300 hover:text-gray-800 transition-colors font-medium"
            >
              <FiExternalLink className="h-3.5 w-3.5" />
              View public profile
            </a>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-36"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              isEdit ? "Save changes" : "Create profile"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
