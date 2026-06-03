"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

type Props = {
  title: string;
  shareLabel: string;
  copiedLabel: string;
  className?: string;
};

export function ShareButton({ title, shareLabel, copiedLabel, className }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleShare}
      aria-label={copied ? copiedLabel : shareLabel}
      title={copied ? copiedLabel : shareLabel}
      className={className}
    >
      {copied
        ? <Check className="h-4 w-4 text-green-600" />
        : <Share2 className="h-4 w-4 text-gray-600" />
      }
    </button>
  );
}
