"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import type { QuestionOption } from "@/types/chat";

type Props = {
  questions: QuestionOption[];
  onSubmit: (answers: Record<string, string>) => void;
};

export function DynamicForm({ questions, onSubmit }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const update = (question: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [question]: value }));
  };

  const updateOther = (question: string, value: string) => {
    setOtherValues((prev) => ({ ...prev, [question]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const finalAnswers: Record<string, string> = {};
    for (const key in answers) {
      if (answers[key] === "__other__") {
        finalAnswers[key] = otherValues[key] || "";
      } else {
        finalAnswers[key] = answers[key];
      }
    }
    onSubmit(finalAnswers);
  };

  const allAnswered = questions.every((q) => {
    const val = answers[q.question];
    if (val === "__other__") {
      return otherValues[q.question] && otherValues[q.question].trim().length > 0;
    }
    return val && val.trim().length > 0;
  });

  if (submitted) {
    return (
      <div className="px-4 py-3 bg-primary/5 border border-primary/10 rounded-xl">
        <p className="text-xs text-primary font-medium">✓ Answers submitted</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-gray-100">
        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
          Please answer these questions
        </p>
      </div>

      {/* Questions */}
      <div className="p-4 space-y-5">
        {questions.map((q, qi) => {
          const isRadio = q.suggestions.length <= 5;
          const selected = answers[q.question];
          const isOther = selected === "__other__";

          return (
            <div key={qi} className="space-y-2">
              <label className="text-sm font-semibold text-gray-800">
                {q.question}
              </label>

              {q.suggestions.length > 0 && isRadio ? (
                /* ── Radio group (≤5 suggestions) ── */
                <div className="grid gap-2">
                  {q.suggestions.map((opt, oi) => (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => update(q.question, opt)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-left transition-all ${
                        selected === opt
                          ? "bg-primary/10 border-primary/30 border-2 text-primary font-medium"
                          : "bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                          selected === opt
                            ? "border-primary bg-primary"
                            : "border-gray-300"
                        }`}
                      >
                        {selected === opt && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      {opt}
                    </button>
                  ))}

                  {/* Other option */}
                  <button
                    type="button"
                    onClick={() => update(q.question, "__other__")}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-left transition-all ${
                      isOther
                        ? "bg-primary/10 border-primary/30 border-2 text-primary font-medium"
                        : "bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                        isOther
                          ? "border-primary bg-primary"
                          : "border-gray-300"
                      }`}
                    >
                      {isOther && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    Other
                  </button>

                  {isOther && (
                    <input
                      type="text"
                      placeholder="Type your answer…"
                      value={otherValues[q.question] ?? ""}
                      onChange={(e) => updateOther(q.question, e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      autoFocus
                    />
                  )}
                </div>
              ) : q.suggestions.length > 5 ? (
                /* ── Select dropdown (>5 suggestions) ── */
                <div className="space-y-2">
                  <select
                    value={selected === "__other__" ? "__other__" : (selected ?? "")}
                    onChange={(e) => update(q.question, e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Select an option…
                    </option>
                    {q.suggestions.map((opt, oi) => (
                      <option key={oi} value={opt}>
                        {opt}
                      </option>
                    ))}
                    <option value="__other__">Other</option>
                  </select>

                  {isOther && (
                    <input
                      type="text"
                      placeholder="Type your answer…"
                      value={otherValues[q.question] ?? ""}
                      onChange={(e) => updateOther(q.question, e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      autoFocus
                    />
                  )}
                </div>
              ) : (
                /* ── No suggestions — text input ── */
                <input
                  type="text"
                  placeholder="Type your answer…"
                  value={answers[q.question] ?? ""}
                  onChange={(e) => update(q.question, e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-3.5 w-3.5" />
          Submit Answers
        </button>
      </div>
    </div>
  );
}
