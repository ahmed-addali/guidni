"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/lib/actions/admin";

const roles = ["USER", "PARTNER", "ADMIN", "AGENT"] as const;

const ROLE_COLORS: Record<string, string> = {
  ADMIN:   "bg-red-50 text-red-700 border-red-200",
  PARTNER: "bg-violet-50 text-violet-700 border-violet-200",
  AGENT:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  USER:    "bg-gray-100 text-gray-600 border-gray-200",
};

interface Props {
  userId: string;
  currentRole: string;
}

export function UserRoleSelect({ userId, currentRole }: Props) {
  const [role, setRole] = useState(currentRole);
  const [, startTransition] = useTransition();

  function handleChange(newRole: string) {
    const prev = role;
    setRole(newRole);
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (!result.success) setRole(prev);
    });
  }

  return (
    <select
      value={role}
      onChange={(e) => handleChange(e.target.value)}
      className={`text-xs font-medium border rounded-full px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-colors ${ROLE_COLORS[role] ?? ""}`}
    >
      {roles.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  );
}
