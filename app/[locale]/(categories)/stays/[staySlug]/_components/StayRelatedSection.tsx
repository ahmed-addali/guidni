import { getTranslations } from "next-intl/server";
import { StayCard } from "@/components/stays/StayCard";
import type { StayListItem } from "@/types/stay";

type Props = {
  stays: StayListItem[];
  label: string;
  locale: string;
};

export async function StayRelatedSection({ stays, label, locale }: Props) {
  if (stays.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "StaysPage" });

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{label}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stays.map((stay) => (
          <StayCard
            key={stay.id}
            stay={stay}
            locale={locale}
            perNight={t("perNight")}
            currency={t("currency")}
          />
        ))}
      </div>
    </div>
  );
}
