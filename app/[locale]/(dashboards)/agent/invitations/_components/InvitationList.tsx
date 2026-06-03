"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FiSend, FiX, FiCopy, FiCheck } from "react-icons/fi";
import { cancelAgentInvitation } from "@/lib/actions/agent";

type Invitation = {
  id:           string;
  token:        string;
  status:       string;
  listingType:  string;
  touristEmail: string | null;
  touristPhone: string | null;
  adults:       number;
  children:     number;
  date:         string | null;
  createdAt:    Date;
  expiresAt:    Date;
};

interface Props {
  invitations: Invitation[];
  locale:      string;
}

export function InvitationList({ invitations: initial, locale }: Props) {
  const [invitations, setInvitations] = useState(initial);
  const [isPending, startTransition]  = useTransition();
  const [copied, setCopied]           = useState<string | null>(null);

  function copyLink(token: string) {
    const url = `${window.location.origin}/${locale}/book?agent=${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function handleCancel(id: string) {
    startTransition(async () => {
      const result = await cancelAgentInvitation(id);
      if (result.success) {
        setInvitations((prev) =>
          prev.map((inv) => inv.id === id ? { ...inv, status: "CANCELLED" } : inv)
        );
        toast.success("Invitation cancelled");
      } else {
        toast.error(result.error);
      }
    });
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING:   { label: "Pending",   className: "bg-yellow-50 text-yellow-700 border-yellow-100" },
    OPENED:    { label: "Opened",    className: "bg-blue-50 text-blue-700 border-blue-100" },
    BOOKED:    { label: "Booked",    className: "bg-green-50 text-green-700 border-green-100" },
    EXPIRED:   { label: "Expired",   className: "bg-gray-50 text-gray-500 border-gray-100" },
    CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600 border-red-100" },
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
      <div className="divide-y divide-gray-50">
        {invitations.map((inv) => {
          const s = statusConfig[inv.status] ?? statusConfig.PENDING;
          const canCancel = inv.status === "PENDING" || inv.status === "OPENED";
          const canCopy   = inv.status === "PENDING" || inv.status === "OPENED";

          return (
            <div key={inv.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                <FiSend className="h-4 w-4 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {inv.touristEmail || inv.touristPhone || "Tourist"}
                </p>
                <p className="text-xs text-gray-400">
                  {inv.listingType} · {inv.adults} adult{inv.adults !== 1 ? "s" : ""}
                  {inv.children > 0 ? ` · ${inv.children} child${inv.children !== 1 ? "ren" : ""}` : ""}
                  {inv.date ? ` · ${inv.date}` : ""}
                </p>
              </div>

              <div className="hidden sm:block text-xs text-gray-400 shrink-0">
                {new Date(inv.createdAt).toLocaleDateString()}
              </div>

              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border shrink-0 ${s.className}`}>
                {s.label}
              </span>

              <div className="flex items-center gap-1 shrink-0">
                {canCopy && (
                  <button
                    onClick={() => copyLink(inv.token)}
                    title="Copy booking link"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700"
                  >
                    {copied === inv.token
                      ? <FiCheck className="h-3.5 w-3.5 text-green-600" />
                      : <FiCopy className="h-3.5 w-3.5" />
                    }
                  </button>
                )}
                {canCancel && (
                  <button
                    onClick={() => handleCancel(inv.id)}
                    disabled={isPending}
                    title="Cancel invitation"
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-400 hover:text-red-600"
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
