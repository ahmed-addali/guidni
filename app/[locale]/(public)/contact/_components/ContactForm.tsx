"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Send, CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const t = useTranslations("ContactPage.form");

  const [values, setValues] = useState({ name: "", email: "", subject: "general", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const subjects = [
    { value: "general",  label: t("subjectGeneral") },
    { value: "booking",  label: t("subjectBooking") },
    { value: "partner",  label: t("subjectPartner") },
    { value: "press",    label: t("subjectPress") },
    { value: "report",   label: t("subjectReport") },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    // Simulate brief delay — email sending wired in Phase 21
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
        </div>
        <p className="font-semibold text-gray-900">{t("success")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("name")}</label>
        <input
          required
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          placeholder={t("namePlaceholder")}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("email")}</label>
        <input
          required
          type="email"
          value={values.email}
          onChange={(e) => setValues({ ...values, email: e.target.value })}
          placeholder={t("emailPlaceholder")}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("subject")}</label>
        <select
          value={values.subject}
          onChange={(e) => setValues({ ...values, subject: e.target.value })}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
        >
          {subjects.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t("message")}</label>
        <textarea
          required
          rows={5}
          value={values.message}
          onChange={(e) => setValues({ ...values, message: e.target.value })}
          placeholder={t("messagePlaceholder")}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white rounded-xl px-6 py-2.5 font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {submitting ? (
          t("submitting")
        ) : (
          <><Send className="h-4 w-4" /> {t("submit")}</>
        )}
      </button>
    </form>
  );
}
