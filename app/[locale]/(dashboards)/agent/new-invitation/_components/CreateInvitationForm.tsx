"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FiSend, FiCopy, FiCheck, FiLock } from "react-icons/fi";
import { Loader2 } from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label }    from "@/components/ui/label";
import { QRInviteModal } from "@/components/agent/QRInviteModal";
import { createAgentInvitation } from "@/lib/actions/agent";

interface Activity {
  id:                     string;
  title:                  string;
  city:                   string;
  price:                  number;
  times:                  string;
  agentCommissionEnabled: boolean;
  agentCommissionRate:    number | null;
}

interface Props {
  activities: Activity[];
  locale:     string;
}

export function CreateInvitationForm({ activities, locale }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    listingId:    "",
    touristEmail: "",
    touristPhone: "",
    adults:       1,
    children:     0,
    date:         "",
    timeSlot:     "",
    note:         "",
  });

  const [showAll, setShowAll]               = useState(false);
  const [errors, setErrors]                 = useState<Record<string, string>>({});
  const [generatedLink, setGeneratedLink]   = useState<string | null>(null);
  const [copied, setCopied]                 = useState(false);

  const commissionActivities    = activities.filter((a) => a.agentCommissionEnabled);
  const displayedActivities     = showAll ? activities : commissionActivities;
  const selectedActivity        = activities.find((a) => a.id === form.listingId);
  const availableTimes          = selectedActivity
    ? selectedActivity.times.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const commissionLabel = selectedActivity?.agentCommissionEnabled
    ? `${((selectedActivity.agentCommissionRate ?? 0.05) * 100).toFixed(0)}% · TND ${(selectedActivity.price * (selectedActivity.agentCommissionRate ?? 0.05)).toFixed(2)} / person`
    : null;

  function set(field: string, value: string | number) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.listingId) errs.listingId = "Select an activity";
    if (!form.touristEmail && !form.touristPhone)
      errs.touristEmail = "Provide at least an email or phone number";
    if (form.touristEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.touristEmail))
      errs.touristEmail = "Enter a valid email";
    if (form.adults < 1) errs.adults = "At least 1 adult required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function copyLink() {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const result = await createAgentInvitation({
        listingType:  "ACTIVITY",
        listingId:    form.listingId,
        touristEmail: form.touristEmail || undefined,
        touristPhone: form.touristPhone || undefined,
        adults:       form.adults,
        children:     form.children,
        date:         form.date || undefined,
        timeSlot:     form.timeSlot || undefined,
        note:         form.note || undefined,
      });

      if (result.success) {
        const link = `${window.location.origin}/${locale}/invite/${result.token}`;
        setGeneratedLink(link);
        toast.success("Invitation created!");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (generatedLink) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <FiCheck className="h-7 w-7 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Invitation created!</h2>
          <p className="text-sm text-gray-500">Share this link with your tourist. It expires in 7 days.</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <p className="flex-1 text-sm text-gray-700 truncate font-mono">{generatedLink}</p>
          <button
            onClick={copyLink}
            className="shrink-0 p-2 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-gray-900"
          >
            {copied
              ? <FiCheck className="h-4 w-4 text-green-600" />
              : <FiCopy className="h-4 w-4" />
            }
          </button>
        </div>

        <div className="flex gap-3">
          <QRInviteModal
            url={generatedLink}
            activityTitle={selectedActivity?.title ?? "Activity"}
            expiresLabel="Scan to book · Link expires in 7 days"
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => {
              setGeneratedLink(null);
              setForm({ listingId: "", touristEmail: "", touristPhone: "", adults: 1, children: 0, date: "", timeSlot: "", note: "" });
            }}
          >
            Create another
          </Button>
          <Button
            type="button"
            className="flex-1 bg-primary text-white rounded-xl hover:bg-primary/90"
            onClick={() => router.push(`/${locale}/agent/invitations`)}
          >
            View all invitations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Activity with commission filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="listingId">Activity <span className="text-red-500">*</span></Label>
          <button
            type="button"
            onClick={() => { setShowAll((v) => !v); set("listingId", ""); }}
            className="text-xs text-blue-600 hover:underline"
          >
            {showAll
              ? `Show commission only (${commissionActivities.length})`
              : `Show all activities (${activities.length})`}
          </button>
        </div>

        <div className="space-y-1.5">
          {displayedActivities.length === 0 ? (
            <p className="text-sm text-gray-400 py-3 text-center border border-dashed border-gray-200 rounded-xl">
              No activities with commission enabled yet.{" "}
              <button type="button" onClick={() => setShowAll(true)} className="text-blue-600 hover:underline">
                Show all
              </button>
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200">
              {displayedActivities.map((a) => {
                const hasCommission = a.agentCommissionEnabled;
                const earnTND       = hasCommission
                  ? (a.price * (a.agentCommissionRate ?? 0.05)).toFixed(2)
                  : null;
                const isSelected = form.listingId === a.id;

                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => hasCommission ? set("listingId", a.id) : undefined}
                    disabled={!hasCommission}
                    className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors border-b border-gray-50 last:border-b-0 ${
                      isSelected
                        ? "bg-primary/5"
                        : hasCommission
                        ? "hover:bg-gray-50"
                        : "opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? "text-primary" : "text-gray-900"}`}>
                        {a.title}
                      </p>
                      <p className="text-xs text-gray-400">{a.city} · {a.price} TND / person</p>
                    </div>
                    {hasCommission && earnTND ? (
                      <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                        💰 +{earnTND} TND
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                        <FiLock className="h-3 w-3" />
                        No commission
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected activity commission preview */}
        {commissionLabel && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
            Your commission: {commissionLabel}
          </p>
        )}

        {errors.listingId && <p className="text-xs text-red-500">{errors.listingId}</p>}
      </div>

      {/* Tourist contact */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="touristEmail">Tourist email</Label>
          <Input
            id="touristEmail"
            type="email"
            placeholder="tourist@example.com"
            value={form.touristEmail}
            onChange={(e) => set("touristEmail", e.target.value)}
            className={errors.touristEmail ? "border-red-300" : ""}
          />
          {errors.touristEmail && <p className="text-xs text-red-500">{errors.touristEmail}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="touristPhone">Tourist phone / WhatsApp</Label>
          <Input
            id="touristPhone"
            type="tel"
            placeholder="+33 6 XX XX XX XX"
            value={form.touristPhone}
            onChange={(e) => set("touristPhone", e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 -mt-3">Provide at least one of the two.</p>

      {/* Party size */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="adults">Adults <span className="text-red-500">*</span></Label>
          <Input
            id="adults"
            type="number"
            min={1}
            value={form.adults}
            onChange={(e) => set("adults", parseInt(e.target.value, 10) || 1)}
            className={errors.adults ? "border-red-300" : ""}
          />
          {errors.adults && <p className="text-xs text-red-500">{errors.adults}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="children">Children</Label>
          <Input
            id="children"
            type="number"
            min={0}
            value={form.children}
            onChange={(e) => set("children", parseInt(e.target.value, 10) || 0)}
          />
        </div>
      </div>

      {/* Date + time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="date">
            Preferred date{" "}
            <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timeSlot">
            Time slot{" "}
            <span className="text-gray-400 font-normal text-xs">(optional)</span>
          </Label>
          {availableTimes.length > 0 ? (
            <select
              id="timeSlot"
              value={form.timeSlot}
              onChange={(e) => set("timeSlot", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
            >
              <option value="">Any time</option>
              {availableTimes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          ) : (
            <Input
              id="timeSlot"
              placeholder="e.g. 09:00"
              value={form.timeSlot}
              onChange={(e) => set("timeSlot", e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Note */}
      <div className="space-y-1.5">
        <Label htmlFor="note">
          Personal note{" "}
          <span className="text-gray-400 font-normal text-xs">(optional, shown to tourist)</span>
        </Label>
        <Textarea
          id="note"
          placeholder="e.g. I recommended this activity — it's perfect for families. Book directly using this link!"
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
          rows={3}
          maxLength={300}
        />
        <p className="text-xs text-gray-400 text-right">{form.note.length} / 300</p>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary/90 transition-colors"
      >
        {isPending ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating invitation…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <FiSend className="h-4 w-4" />
            Create invitation & get link
          </span>
        )}
      </Button>

    </form>
  );
}
