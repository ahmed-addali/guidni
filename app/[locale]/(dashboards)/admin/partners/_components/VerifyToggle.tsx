"use client";

import { useState, useTransition } from "react";
import { togglePartnerVerified } from "@/lib/actions/admin";
import { FiCheck, FiX } from "react-icons/fi";

interface Props {
  profileId: string;
  verified: boolean;
}

export function VerifyToggle({ profileId, verified }: Props) {
  const [isVerified, setIsVerified] = useState(verified);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    const next = !isVerified;
    setIsVerified(next);
    startTransition(async () => {
      const result = await togglePartnerVerified(profileId, next);
      if (!result.success) setIsVerified(!next);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
        isVerified
          ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
          : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
      }`}
    >
      {isVerified ? <FiCheck className="h-3 w-3" /> : <FiX className="h-3 w-3" />}
      {isVerified ? "Verified" : "Unverified"}
    </button>
  );
}
