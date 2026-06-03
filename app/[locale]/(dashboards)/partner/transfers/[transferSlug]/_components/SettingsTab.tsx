"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiTrash2, FiAlertOctagon, FiEye, FiEyeOff, FiFileText } from "react-icons/fi";
import { deleteTransfer, updateTransferStatus } from "@/lib/actions/partner-transfers";
import { ConfirmDialog } from "@/components/partner/ConfirmDialog";

type TransferStatus = "DRAFT" | "ACTIVE" | "SUSPENDED";

type Props = {
  transferId:     string;
  transferTitle:  string;
  transferStatus: TransferStatus;
};

export function SettingsTab({ transferId, transferTitle, transferStatus }: Props) {
  const router    = useRouter();
  const params    = useParams();
  const locale    = params.locale as string;
  const t         = useTranslations("PartnerDashboard.editTransfer.settings");
  const [, start] = useTransition();
  const [deleting, setDeleting]           = useState(false);
  const [statusPending, setStatusPending] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<TransferStatus>(transferStatus);

  function handleStatusToggle() {
    const nextStatus: TransferStatus = currentStatus === "ACTIVE" ? "DRAFT" : "ACTIVE";
    setStatusPending(true);
    start(async () => {
      const res = await updateTransferStatus(transferId, nextStatus);
      if (res.success) {
        setCurrentStatus(nextStatus);
        toast.success(t("statusUpdated"));
      } else {
        toast.error(t("statusFailed"));
      }
      setStatusPending(false);
    });
  }

  function handleDelete() {
    setDeleting(true);
    start(async () => {
      const res = await deleteTransfer(transferId);
      if (res.success) {
        toast.success(t("deleteSuccess"));
        router.push(`/${locale}/partner/transfers`);
      } else {
        toast.error(t("deleteFailed"));
        setDeleting(false);
      }
    });
  }

  const statusConfig = {
    DRAFT: {
      icon:     FiFileText,
      label:    t("statusDraft"),
      hint:     t("statusDraftHint"),
      badgeCls: "bg-gray-100 text-gray-600",
    },
    ACTIVE: {
      icon:     FiEye,
      label:    t("statusActive"),
      hint:     t("statusActiveHint"),
      badgeCls: "bg-green-100 text-green-700",
    },
    SUSPENDED: {
      icon:     FiEyeOff,
      label:    t("statusSuspended"),
      hint:     t("statusSuspendedHint"),
      badgeCls: "bg-orange-100 text-orange-700",
    },
  } as const;

  const cfg  = statusConfig[currentStatus];
  const Icon = cfg.icon;

  return (
    <div className="space-y-4">
      {/* Listing Status */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">{t("statusTitle")}</p>
          <p className="text-xs text-gray-400 mt-0.5">{t("statusHint")}</p>
        </div>

        <div className="flex items-center justify-between gap-4 border border-gray-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full ${cfg.badgeCls}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badgeCls}`}>
                {cfg.label}
              </span>
              <p className="text-xs text-gray-500 mt-1">{cfg.hint}</p>
            </div>
          </div>

          {currentStatus !== "SUSPENDED" && (
            <button
              type="button"
              disabled={statusPending}
              onClick={handleStatusToggle}
              className={`shrink-0 text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-50 ${
                currentStatus === "ACTIVE"
                  ? "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  : "bg-primary text-white hover:bg-primary/90"
              }`}
            >
              {currentStatus === "ACTIVE" ? t("unpublish") : t("goLive")}
            </button>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-start gap-2.5">
          <FiAlertOctagon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">{t("dangerZoneTitle")}</p>
            <p className="text-xs text-red-500 mt-0.5">{t("dangerZoneHint")}</p>
          </div>
        </div>
        <ConfirmDialog
          trigger={
            <button
              type="button"
              disabled={deleting}
              className="flex items-center gap-2 text-sm font-medium text-red-600 border border-red-300 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FiTrash2 className="h-4 w-4" />
              {t("deleteButton")}
            </button>
          }
          title={t("deleteDialogTitle")}
          description={t("deleteDialogDescription")}
          confirmLabel={t("deleteConfirmLabel")}
          onConfirm={handleDelete}
          loading={deleting}
        />
      </div>
    </div>
  );
}
