"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FiTrash2, FiAlertOctagon } from "react-icons/fi";
import { deleteRestaurant } from "@/lib/actions/partner-restaurants";
import { ConfirmDialog } from "@/components/partner/ConfirmDialog";

export function SettingsTab({ restaurantId }: { restaurantId: string }) {
  const router  = useRouter();
  const params  = useParams();
  const locale  = params.locale as string;
  const t       = useTranslations("PartnerDashboard.editRestaurant.settings");
  const [deleting, setDeleting] = useState(false);
  const [, start] = useTransition();

  function handleDelete() {
    setDeleting(true);
    start(async () => {
      const res = await deleteRestaurant(restaurantId);
      if (res.success) {
        toast.success(t("deleteSuccess"));
        router.push(`/${locale}/partner/restaurants`);
      } else {
        toast.error((res as any).error ?? t("deleteFailed"));
        setDeleting(false);
      }
    });
  }

  return (
    <div className="space-y-8">
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
