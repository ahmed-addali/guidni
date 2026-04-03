"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/lib/actions/profile";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ProfileData {
  name: string;
  phone?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
}

interface Labels {
  name: string;
  phone: string;
  bio: string;
  city: string;
  country: string;
  address: string;
  save: string;
  saving: string;
  saved: string;
  error: string;
}

interface Props {
  profile: ProfileData;
  labels: Labels;
}

export function ProfileForm({ profile, labels }: Props) {
  const [form, setForm] = useState({
    name: profile.name,
    phone: profile.phone ?? "",
    bio: profile.bio ?? "",
    city: profile.city ?? "",
    country: profile.country ?? "",
    address: profile.address ?? "",
  });
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async () => {
    setLoading(true);
    const result = await updateProfile({
      name: form.name,
      phone: form.phone || undefined,
      bio: form.bio || undefined,
      city: form.city || undefined,
      country: form.country || undefined,
      address: form.address || undefined,
    });
    setLoading(false);

    if (result.success) {
      toast.success(labels.saved);
    } else {
      toast.error(labels.error);
    }
  };

  return (
    <div className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <Label>{labels.name}</Label>
        <Input value={form.name} onChange={update("name")} />
      </div>

      <div className="space-y-1.5">
        <Label>{labels.phone}</Label>
        <Input type="tel" value={form.phone} onChange={update("phone")} />
      </div>

      <div className="space-y-1.5">
        <Label>{labels.bio}</Label>
        <Textarea value={form.bio} onChange={update("bio")} rows={3} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{labels.city}</Label>
          <Input value={form.city} onChange={update("city")} />
        </div>
        <div className="space-y-1.5">
          <Label>{labels.country}</Label>
          <Input value={form.country} onChange={update("country")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{labels.address}</Label>
        <Input value={form.address} onChange={update("address")} />
      </div>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {labels.saving}
          </>
        ) : (
          labels.save
        )}
      </Button>
    </div>
  );
}
