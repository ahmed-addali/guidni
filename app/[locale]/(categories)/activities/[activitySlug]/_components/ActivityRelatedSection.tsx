import { ActivityCard } from "@/components/activities/ActivityCard";

type RelatedActivity = {
  id: string;
  slug: string;
  title: string;
  arabicTitle?: string | null;
  category: string;
  price: number;
  region: string;
  city?: string | null;
  country: string;
  duration?: string | null;
  note?: string | null;
  images: { id: string; url: string }[];
  destination?: { slug: string; city: string; country: string } | null;
};

type Props = {
  activities: RelatedActivity[];
  label: string;
  locale: string;
};

export function ActivityRelatedSection({ activities, label, locale }: Props) {
  if (activities.length === 0) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{label}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            locale={locale}
          />
        ))}
      </div>
    </div>
  );
}
