"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { FiUsers, FiInfo } from "react-icons/fi";
import { updateActivityAgentCommission } from "@/lib/actions/agent-partner";

interface Props {
  activityId:             string;
  activityPrice:          number;
  agentCommissionEnabled: boolean;
  agentCommissionRate:    number | null;
}

export function AgentProgramSection({
  activityId,
  activityPrice,
  agentCommissionEnabled: initialEnabled,
  agentCommissionRate:    initialRate,
}: Props) {
  const t = useTranslations("Components.agentProgramSection");
  const [isPending, startTransition] = useTransition();
  const [enabled, setEnabled]        = useState(initialEnabled);
  const [rate, setRate]              = useState(initialRate ?? 5);

  const commissionTND = ((rate / 100) * activityPrice).toFixed(2);

  function handleToggle(value: boolean) {
    setEnabled(value);
    if (!value) {
      save(value, rate);
    }
  }

  function save(newEnabled: boolean, newRate: number) {
    startTransition(async () => {
      const result = await updateActivityAgentCommission(activityId, newEnabled, newRate / 100);
      if (result.success) {
        toast.success(newEnabled ? t("enabledToast") : t("disabledToast"));
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <FiUsers className="h-4 w-4 text-primary" />
            {t("title")}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">{t("hint")}</p>
        </div>
        <button
          type="button"
          onClick={() => handleToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
            enabled ? "bg-primary" : "bg-gray-200"
          }`}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="space-y-4 pl-6 border-l-2 border-primary/10">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("commissionLabel")}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={3}
                max={20}
                step={1}
                value={rate}
                onChange={(e) => setRate(parseInt(e.target.value, 10))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm font-bold text-primary w-12 text-center">
                {rate}%
              </span>
            </div>
            <p className="text-xs text-gray-400">{t("commissionRange")}</p>
          </div>

          {/* Preview */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{t("previewTitle")}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t("activityPrice")}</span>
              <span className="font-medium text-gray-900">{activityPrice} TND</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{t("agentEarns", { rate })}</span>
              <span className="font-semibold text-primary">{commissionTND} TND</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t border-primary/10 pt-1.5">
              <span className="text-gray-600">{t("youKeep")}</span>
              <span className="font-semibold text-gray-900">
                {(activityPrice - parseFloat(commissionTND)).toFixed(2)} TND
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-400">
            <FiInfo className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>{t("infoNote")}</p>
          </div>

          <button
            type="button"
            onClick={() => save(enabled, rate)}
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t("save")}
          </button>
        </div>
      )}
    </div>
  );
}
