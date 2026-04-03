"use client";

import { useState } from "react";
import { FiCopy, FiCheck } from "react-icons/fi";

export function ReferralLinkCard({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3">
      <p className="flex-1 text-sm text-gray-700 truncate font-mono">{link}</p>
      <button
        onClick={copy}
        title="Copy link"
        className="shrink-0 p-2 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-gray-900"
      >
        {copied
          ? <FiCheck className="h-4 w-4 text-green-600" />
          : <FiCopy className="h-4 w-4" />
        }
      </button>
    </div>
  );
}
