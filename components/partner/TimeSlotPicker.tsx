"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FiClock, FiPlus, FiX } from "react-icons/fi";
import { TimePickerInput } from "@/components/shared/TimePickerInput";

type Props = {
  value: string[];
  onChange: (slots: string[]) => void;
  error?: string;
};

export function TimeSlotPicker({ value, onChange, error }: Props) {
  const t = useTranslations("Components.timeSlotPicker");
  const [adding, setAdding] = useState(false);
  const [input,  setInput]  = useState("");

  function addSlot() {
    if (!input) return;
    if (value.includes(input)) { setAdding(false); return; }
    onChange([...value, input].sort());
    setAdding(false);
    setInput("");
  }

  function removeSlot(slot: string) {
    onChange(value.filter((s) => s !== slot));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((slot) => (
          <span
            key={slot}
            dir="ltr"
            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-lg"
          >
            <FiClock className="h-3.5 w-3.5 shrink-0" />
            {slot}
            <button
              type="button"
              onClick={() => removeSlot(slot)}
              className="text-primary/60 hover:text-primary transition-colors ml-0.5"
              aria-label={`Remove ${slot}`}
            >
              <FiX className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}

        {adding ? (
          <div className="flex items-center gap-2">
            <div className="border border-primary rounded-lg px-3 py-1.5 w-36 focus-within:ring-2 focus-within:ring-primary/30">
              <TimePickerInput
                value={input}
                onChange={(v) => { setInput(v); }}
                placeholder={t("placeholder")}
              />
            </div>
            <button
              type="button"
              onClick={addSlot}
              disabled={!input}
              className="text-sm bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-40"
            >
              {t("add")}
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setInput(""); }}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-1"
            >
              {t("cancel")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 border border-dashed border-gray-300 hover:border-primary hover:text-primary px-3 py-1.5 rounded-lg transition-colors"
          >
            <FiPlus className="h-3.5 w-3.5" />
            {t("addTime")}
          </button>
        )}
      </div>

      {value.length === 0 && !adding && (
        <p className="text-xs text-gray-400">{t("emptyHint")}</p>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
