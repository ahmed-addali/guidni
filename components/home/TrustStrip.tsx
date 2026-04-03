import { getTranslations } from "next-intl/server";
import { ShieldCheck, Star, CreditCard, Users } from "lucide-react";

interface Props {
  locale: string;
}

export async function TrustStrip({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "HomePage.trust" });

  const ITEMS = [
    { icon: ShieldCheck, label: t("item1Label"), desc: t("item1Desc") },
    { icon: Star,        label: t("item2Label"), desc: t("item2Desc") },
    { icon: CreditCard,  label: t("item3Label"), desc: t("item3Desc") },
    { icon: Users,       label: t("item4Label"), desc: t("item4Desc") },
  ];

  return (
    <section className="py-6 w-full border-y border-gray-100 mb-2">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {ITEMS.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
